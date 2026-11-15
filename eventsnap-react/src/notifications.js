import {
  deleteToken, getMessaging, getToken, isSupported, onMessage,
} from "firebase/messaging";
import {
  deleteDoc, doc, getDoc, serverTimestamp, setDoc,
} from "firebase/firestore";
import { app, auth, db, firebaseConfig } from "./firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
  || "BH7H_9D8gZunqjw5enT1L2CwQid-xqxlJbK9krPGPh3tRE2JGDMIeV6r7MWKyRKDxqZ0fcSEAXH1sqP8NthPo5w";
const DEVICE_ID_KEY = "es_fcm_device_id";
const disabledKey = (uid) => `es_push_disabled_${uid}`;
let fallbackDeviceId;

function createDeviceId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function isPushSupported() {
  if (!app || !db || typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }
  return isSupported();
}

function getDeviceId() {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = createDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    if (!fallbackDeviceId) fallbackDeviceId = createDeviceId();
    return fallbackDeviceId;
  }
}

function isDisabled(uid) {
  try {
    return localStorage.getItem(disabledKey(uid)) === "yes";
  } catch {
    return false;
  }
}

async function getMessagingAndRegistration() {
  const configUrl = new URL("/firebase-messaging-sw.js", window.location.origin);
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (value) configUrl.searchParams.set(key, value);
  });
  const registration = await navigator.serviceWorker.register(configUrl.toString(), { scope: "/" });
  return { messaging: getMessaging(app), registration };
}

async function saveDeviceToken(user) {
  const { messaging, registration } = await getMessagingAndRegistration();
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("Firebase did not return a messaging token.");

  await setDoc(doc(db, "fcmTokens", user.uid, "devices", getDeviceId()), {
    uid: user.uid,
    token,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function enablePushNotifications(user) {
  if (!user?.uid) throw new Error("Sign in before enabling notifications.");
  if (!app || !db || typeof window === "undefined"
    || !("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("This browser does not support push notifications.");
  }
  if (Notification.permission === "denied") {
    throw new Error("Notifications are blocked by your browser. Allow them in this site's browser settings, then try again.");
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");
  if (!(await isPushSupported())) throw new Error("This browser does not support push notifications.");

  try {
    localStorage.removeItem(disabledKey(user.uid));
  } catch {
    // The FCM token still remains usable when browser storage is unavailable.
  }
  await saveDeviceToken(user);
}

export async function showForegroundNotification(payload) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const { registration } = await getMessagingAndRegistration();
  const data = payload.data || {};
  const title = payload.notification?.title || data.title || "EventSnap";
  const body = payload.notification?.body || data.body || "You have a new update.";
  await registration.showNotification(title, {
    body,
    icon: "/icons/eventsnap-192.png",
    data: { url: data.url || "/#/" },
  });
}

export async function syncPushNotifications(user) {
  if (!user?.uid || typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted" || isDisabled(user.uid)) return false;
  if (!(await isPushSupported())) return false;
  await saveDeviceToken(user);
  return true;
}

export async function removeDeviceToken(user, { disable = false } = {}) {
  if (!user?.uid) return;
  const tokenDocument = doc(db, "fcmTokens", user.uid, "devices", getDeviceId());
  const existingToken = await getDoc(tokenDocument);
  if (existingToken.exists()) await deleteDoc(tokenDocument);
  if (await isPushSupported()) {
    await deleteToken(getMessaging(app));
  }
  if (disable) {
    try {
      localStorage.setItem(disabledKey(user.uid), "yes");
    } catch {
      // The current token is still removed from Firestore and FCM.
    }
  }
}

export async function listenForForegroundMessages(callback) {
  if (!(await isPushSupported())) return () => {};
  const { messaging } = await getMessagingAndRegistration();
  return onMessage(messaging, callback);
}

export async function sendNotificationEvent(event, user = auth?.currentUser) {
  if (!user?.getIdToken) throw new Error("Sign in before requesting a notification.");
  const idToken = await user.getIdToken();
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`The notification API returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(result.error || `The notification API returned HTTP ${response.status}.`);
  }
  return result;
}
