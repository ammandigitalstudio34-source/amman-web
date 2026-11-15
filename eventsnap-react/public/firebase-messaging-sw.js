// Register this before Firebase Messaging so it keeps the custom click handler.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/#/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      if (existing.url !== targetUrl && "navigate" in existing) await existing.navigate(targetUrl);
      await existing.focus();
      return;
    }
    await self.clients.openWindow(targetUrl);
  })());
});

importScripts("https://www.gstatic.com/firebasejs/13.3.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.3.0/firebase-messaging-compat.js");

const params = new URL(self.location.href).searchParams;
const config = Object.fromEntries(
  ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId", "measurementId"]
    .map((key) => [key, params.get(key) || undefined])
    .filter(([, value]) => value),
);

firebase.initializeApp(config);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || "EventSnap";
  return self.registration.showNotification(title, {
    body: data.body || "You have a new EventSnap update.",
    icon: "/icons/eventsnap-192.png",
    data: { url: data.url || "/#/" },
    requireInteraction: true,
    vibrate: [200, 100, 200],
  });
});
