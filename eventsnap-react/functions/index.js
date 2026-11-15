import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import {
  onDocumentCreated, onDocumentDeleted, onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();
setGlobalOptions({ region: "asia-east1", maxInstances: 10 });

const db = getFirestore();
const ADMIN_UID = "QXpWsJiQE9N0e4lb12J2oFqUfyk2";
const MAX_MULTICAST_SIZE = 500;

const chunks = (items, size) => {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
};

async function runOnce(event, work) {
  const eventRef = db.collection("notificationEvents").doc(event.id);
  const claimed = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(eventRef);
    const previous = snapshot.data();
    if (previous?.status === "sent") return "sent";
    if (previous?.status === "processing" && previous.leaseUntil?.toMillis() > Date.now()) return "processing";
    transaction.set(eventRef, {
      status: "processing",
      attempts: (previous?.attempts || 0) + 1,
      leaseUntil: Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
      expireAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return "claimed";
  });
  if (claimed === "sent") return;
  if (claimed === "processing") throw new Error("This notification event is already being processed.");

  try {
    await work();
    await eventRef.set({
      status: "sent",
      completedAt: FieldValue.serverTimestamp(),
      leaseUntil: FieldValue.delete(),
    }, { merge: true });
  } catch (error) {
    await eventRef.set({
      status: "failed",
      errorCode: String(error.code || "unknown").slice(0, 100),
      leaseUntil: FieldValue.delete(),
    }, { merge: true });
    throw error;
  }
}

async function getDeviceDocuments(userIds) {
  const uniqueIds = [...new Set(userIds.filter((uid) => typeof uid === "string" && uid.length > 0))];
  const snapshots = await Promise.all(uniqueIds.map((uid) => (
    db.collection("fcmTokens").doc(uid).collection("devices").get()
  )));
  return snapshots.flatMap((snapshot) => snapshot.docs);
}

async function sendToUsers(userIds, { title, body, type, url }) {
  const documents = await getDeviceDocuments(userIds);
  const uniqueDevices = new Map();
  documents.forEach((device) => {
    const data = device.data();
    if (typeof data.token === "string" && data.uid && userIds.includes(data.uid)) {
      uniqueDevices.set(data.token, device);
    }
  });

  const devices = [...uniqueDevices.entries()];
  if (!devices.length) {
    console.warn("No registered notification devices found.", {
      type,
      recipientCount: userIds.length,
    });
    return;
  }

  for (const batch of chunks(devices, MAX_MULTICAST_SIZE)) {
    const response = await getMessaging().sendEachForMulticast({
      tokens: batch.map(([token]) => token),
      data: {
        title: String(title).slice(0, 100),
        body: String(body).slice(0, 300),
        type,
        url,
      },
      webpush: { headers: { Urgency: "high" } },
    });

    const staleDocuments = [];
    response.responses.forEach((result, index) => {
      const code = result.error?.code;
      if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
        staleDocuments.push(batch[index][1].ref.delete());
      } else if (!result.success) {
        console.warn("FCM delivery failed.", { code: code || "unknown", type });
      }
    });
    await Promise.all(staleDocuments);
  }
}

async function notifyVerifiedPhotographers(gig, title, body, type) {
  if (typeof gig.city !== "string" || !gig.city) return;
  const profiles = await db.collection("profiles").where("city", "==", gig.city).get();
  const recipients = profiles.docs
    .filter((profile) => profile.data().verified === true)
    .map((profile) => profile.data().ownerUid || profile.id)
    .filter((uid) => uid !== gig.ownerUid);
  await sendToUsers(recipients, { title, body, type, url: "/#/board" });
}

export const notifyNewFunctionRequest = onDocumentCreated(
  { document: "gigs/{gigId}", retry: true },
  async (event) => runOnce(event, async () => {
    const gig = event.data?.data();
    if (!gig || gig.status !== "open" || !gig.ownerUid) return;
    if (gig.requestedPhotographerUid) {
      const selectedProfile = await db.collection("profiles").doc(gig.requestedPhotographerUid).get();
      if (!selectedProfile.exists
        || (selectedProfile.data().ownerUid || selectedProfile.id) !== gig.requestedPhotographerUid) return;
      await sendToUsers([gig.requestedPhotographerUid], {
        title: "Booking request for you",
        body: `A customer sent you a function request in ${gig.city || "your city"}.`,
        type: "booking_request",
        url: "/#/board",
      });
      return;
    }
    await notifyVerifiedPhotographers(
      gig,
      "New function request",
      `A new function is available in ${gig.city || "your city"}.`,
      "booking_request",
    );
  }),
);

export const notifyFunctionStatus = onDocumentUpdated(
  { document: "gigs/{gigId}", retry: true },
  async (event) => runOnce(event, async () => {
    const previous = event.data?.before.data();
    const current = event.data?.after.data();
    if (!previous || !current || previous.ownerUid !== current.ownerUid) return;

    if (previous.status === "open" && current.status === "confirmed" && current.photographerUid) {
      const profile = await db.collection("profiles").doc(current.photographerUid).get();
      if (!profile.exists || profile.data().verified !== true) return;
      await sendToUsers([current.ownerUid], {
        title: "Function confirmed",
        body: `${current.photographer || "A photographer"} confirmed ${current.title || "your function"}${current.date ? ` for ${current.date}` : ""}.`,
        type: "booking_accepted",
        url: "/#/photographers",
      });
      return;
    }

    if (previous.status === "open" && current.status === "busy" && current.photographerUid) {
      const profile = await db.collection("profiles").doc(current.photographerUid).get();
      if (!profile.exists || (profile.data().ownerUid || profile.id) !== current.photographerUid) return;
      await sendToUsers([current.ownerUid], {
        title: "Photographer unavailable",
        body: `${current.photographer || "The photographer"} is unavailable for ${current.title || "your function"}${current.date ? ` on ${current.date}` : ""}. Please choose another date or photographer.`,
        type: "booking_busy",
        url: "/#/photographers",
      });
      return;
    }

    if (previous.status === "confirmed" && current.status === "open" && previous.photographerUid) {
      await sendToUsers([current.ownerUid], {
        title: "Booking canceled",
        body: "The confirmed function was reopened and is available again.",
        type: "booking_cancelled",
        url: "/#/board",
      });
      await notifyVerifiedPhotographers(
        current,
        "Function available again",
        `A function in ${current.city || "your city"} is available again.`,
        "booking_request",
      );
    }
  }),
);

export const notifyDeletedConfirmedFunction = onDocumentDeleted(
  { document: "gigs/{gigId}", retry: true },
  async (event) => runOnce(event, async () => {
    const gig = event.data?.data();
    if (!gig || gig.status !== "confirmed" || !gig.photographerUid) return;
    if (typeof gig.date === "string") {
      const profileRef = db.collection("profiles").doc(gig.photographerUid);
      const profileSnapshot = await profileRef.get();
      if (profileSnapshot.exists && profileSnapshot.data().busyDates?.includes(gig.date)) {
        await profileRef.update({ busyDates: FieldValue.arrayRemove(gig.date) });
      }
    }
    await sendToUsers([gig.photographerUid], {
      title: "Confirmed booking removed",
      body: "A confirmed function booking was deleted from EventSnap.",
      type: "booking_cancelled",
      url: "/#/board",
    });
  }),
);

export const notifyNewChatMessage = onDocumentCreated(
  { document: "conversations/{conversationId}/messages/{messageId}", retry: true },
  async (event) => runOnce(event, async () => {
    const message = event.data?.data();
    if (!message?.senderUid || typeof message.senderRole !== "string") return;
    const conversationSnapshot = await db.collection("conversations").doc(event.params.conversationId).get();
    if (!conversationSnapshot.exists) return;

    const conversation = conversationSnapshot.data();
    let recipients = [];
    let senderName = "Someone";
    if (message.senderRole === "customer" && message.senderUid === conversation.customerUid) {
      recipients = [conversation.photographerUid];
      senderName = conversation.customerName || senderName;
    } else if (message.senderRole === "photographer" && message.senderUid === conversation.photographerUid) {
      const profile = await db.collection("profiles").doc(message.senderUid).get();
      recipients = [conversation.customerUid];
      senderName = conversation.photographerName || (profile.exists ? profile.data().name : null) || senderName;
    } else if (message.senderRole === "admin" && message.senderUid === ADMIN_UID) {
      recipients = [conversation.customerUid, conversation.photographerUid];
      senderName = "EventSnap support";
    } else {
      return;
    }

    await sendToUsers(recipients, {
      title: `New message from ${senderName}`,
      body: "Open EventSnap to read the message.",
      type: "chat_message",
      url: "/#/",
    });
  }),
);
