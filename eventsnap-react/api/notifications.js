import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "../server/firebaseAdmin.js";

const ADMIN_UID = "QXpWsJiQE9N0e4lb12J2oFqUfyk2";
const MAX_MULTICAST_SIZE = 500;
const EVENT_LEASE_MS = 5 * 60 * 1000;
const EVENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireId(value, name) {
  if (typeof value !== "string" || !value || value.length > 128 || value.includes("/")) {
    throw new RequestError(400, `A valid ${name} is required.`);
  }
  return value;
}

function splitIntoBatches(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

async function sendToUsers({ db, messaging }, userIds, payload) {
  const recipientIds = [...new Set(userIds.filter((uid) => typeof uid === "string" && uid))];
  if (!recipientIds.length) return 0;

  const snapshots = await Promise.all(recipientIds.map((uid) => (
    db.collection("fcmTokens").doc(uid).collection("devices").get()
  )));
  const devicesByToken = new Map();
  snapshots.forEach((snapshot) => snapshot.docs.forEach((device) => {
    const data = device.data();
    const ownerUid = device.ref.parent.parent?.id;
    if (typeof data.token === "string" && data.token && data.uid === ownerUid
      && recipientIds.includes(ownerUid)) {
      devicesByToken.set(data.token, device);
    }
  }));

  const devices = [...devicesByToken.entries()];
  if (!devices.length) {
    console.warn("No registered notification devices found.", { type: payload.type });
    return 0;
  }

  let delivered = 0;
  for (const batch of splitIntoBatches(devices, MAX_MULTICAST_SIZE)) {
    const response = await messaging.sendEachForMulticast({
      tokens: batch.map(([token]) => token),
      data: {
        title: String(payload.title).slice(0, 100),
        body: String(payload.body).slice(0, 300),
        type: payload.type,
        url: payload.url,
      },
      webpush: { headers: { Urgency: "high" } },
    });

    const staleDocuments = [];
    response.responses.forEach((result, index) => {
      if (result.success) {
        delivered += 1;
        return;
      }
      const code = result.error?.code;
      if (code === "messaging/registration-token-not-registered"
        || code === "messaging/invalid-registration-token") {
        staleDocuments.push(batch[index][1].ref.delete());
      } else {
        console.error("FCM delivery failed.", { code: code || "unknown", type: payload.type });
      }
    });
    await Promise.all(staleDocuments);
  }
  return delivered;
}

async function claimEvent(db, eventId, actorUid) {
  const eventRef = db.collection("notificationEvents").doc(eventId);
  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(eventRef);
    const previous = snapshot.data();
    if (previous?.status === "sent") return "sent";
    if (previous?.status === "processing" && previous.leaseUntil?.toMillis() > Date.now()) {
      return "processing";
    }
    transaction.set(eventRef, {
      actorUid,
      status: "processing",
      attempts: (previous?.attempts || 0) + 1,
      leaseUntil: Timestamp.fromMillis(Date.now() + EVENT_LEASE_MS),
      expireAt: Timestamp.fromMillis(Date.now() + EVENT_TTL_MS),
    }, { merge: true });
    return "claimed";
  });
  return { eventRef, result };
}

async function deliverOnce(services, eventId, actorUid, deliveries) {
  const { eventRef, result } = await claimEvent(services.db, eventId, actorUid);
  if (result === "sent") return { notificationSent: true, duplicate: true };
  if (result === "processing") return { notificationSent: false, processing: true };

  try {
    const deliveryCounts = await Promise.all(deliveries.map(({ recipients, payload }) => (
      sendToUsers(services, recipients, payload)
    )));
    const deliveredDevices = deliveryCounts.reduce((total, count) => total + count, 0);
    await eventRef.set({
      status: "sent",
      deliveredDevices,
      completedAt: FieldValue.serverTimestamp(),
      leaseUntil: FieldValue.delete(),
    }, { merge: true });
    return { notificationSent: deliveredDevices > 0, deliveredDevices };
  } catch (error) {
    await eventRef.set({
      status: "failed",
      errorCode: String(error.code || "unknown").slice(0, 100),
      leaseUntil: FieldValue.delete(),
    }, { merge: true });
    throw error;
  }
}

async function getGig(db, gigId) {
  const snapshot = await db.collection("gigs").doc(gigId).get();
  if (!snapshot.exists) throw new RequestError(404, "The booking was not found.");
  return { ...snapshot.data(), id: snapshot.id };
}

async function getPhotographer(db, uid) {
  const snapshot = await db.collection("profiles").doc(uid).get();
  if (!snapshot.exists) throw new RequestError(403, "The photographer profile could not be verified.");
  const profile = snapshot.data();
  if ((profile.ownerUid || snapshot.id) !== uid) {
    throw new RequestError(403, "The photographer profile could not be verified.");
  }
  return profile;
}

async function verifiedPhotographersInCity(db, gig) {
  if (typeof gig.city !== "string" || !gig.city) return [];
  const profiles = await db.collection("profiles").where("city", "==", gig.city).get();
  return profiles.docs
    .filter((profile) => profile.data().verified === true)
    .map((profile) => profile.data().ownerUid || profile.id)
    .filter((uid) => uid !== gig.ownerUid);
}

function gigMessage(gig, photographerName, accepted) {
  if (accepted) {
    return {
      title: "Function confirmed",
      body: `${photographerName || "A photographer"} confirmed ${gig.title || "your function"}${gig.date ? ` for ${gig.date}` : ""}.`,
      type: "booking_accepted",
      url: "/#/photographers",
    };
  }
  return {
    title: "Photographer unavailable",
    body: `${photographerName || "The photographer"} is unavailable for ${gig.title || "your function"}${gig.date ? ` on ${gig.date}` : ""}. Please choose another date or photographer.`,
    type: "booking_rejected",
    url: "/#/photographers",
  };
}

async function handleBookingRequest(services, actorUid, gigId) {
  const gig = await getGig(services.db, gigId);
  if (gig.ownerUid !== actorUid || gig.status !== "open") {
    throw new RequestError(403, "You are not allowed to send a request for this booking.");
  }

  let recipients;
  if (gig.requestedPhotographerUid) {
    const photographerUid = requireId(gig.requestedPhotographerUid, "photographer");
    if (photographerUid === actorUid) {
      throw new RequestError(403, "You cannot send a booking request to your own profile.");
    }
    await getPhotographer(services.db, photographerUid);
    recipients = [photographerUid];
  } else {
    recipients = await verifiedPhotographersInCity(services.db, gig);
  }
  return deliverOnce(services, `booking_request-${gigId}`, actorUid, [{
    recipients,
    payload: {
      title: gig.requestedPhotographerUid ? "Booking request for you" : "New function request",
      body: gig.requestedPhotographerUid
        ? `A customer sent you a function request in ${gig.city || "your city"}.`
        : `A new function is available in ${gig.city || "your city"}.`,
      type: "booking_request",
      url: "/#/board",
    },
  }]);
}

async function handleBookingResponse(services, actorUid, gigId, accepted) {
  const gig = await getGig(services.db, gigId);
  const expectedStatus = accepted ? "confirmed" : "busy";
  if (gig.status !== expectedStatus || gig.photographerUid !== actorUid
    || (gig.ownerUid === actorUid)) {
    throw new RequestError(403, "You are not allowed to send this booking update.");
  }
  const profile = await getPhotographer(services.db, actorUid);
  if (accepted && profile.verified !== true) {
    throw new RequestError(403, "A verified photographer is required to confirm a booking.");
  }
  if (!accepted && gig.requestedPhotographerUid !== actorUid) {
    throw new RequestError(403, "Only the selected photographer can reject this request.");
  }
  const transitionId = String(accepted ? gig.confirmedAt || gig.created : gig.busyAt || gig.created || gigId);
  return deliverOnce(services, `${accepted ? "booking_accepted" : "booking_rejected"}-${gigId}-${transitionId}`, actorUid, [{
    recipients: [gig.ownerUid],
    payload: gigMessage(gig, gig.photographer || profile.name, accepted),
  }]);
}

async function handleBookingReopen(services, actorUid, gigId) {
  if (actorUid !== ADMIN_UID) throw new RequestError(403, "Only EventSnap support can reopen this booking.");
  const gig = await getGig(services.db, gigId);
  if (gig.status !== "open" || !gig.ownerUid) {
    throw new RequestError(403, "This booking is not available for reopening notifications.");
  }
  const photographers = await verifiedPhotographersInCity(services.db, gig);
  return deliverOnce(services, `booking_reopened-${gigId}`, actorUid, [
    {
      recipients: [gig.ownerUid],
      payload: {
        title: "Booking canceled",
        body: "The confirmed function was reopened and is available again.",
        type: "booking_cancelled",
        url: "/#/board",
      },
    },
    {
      recipients: photographers,
      payload: {
        title: "Function available again",
        body: `A function in ${gig.city || "your city"} is available again.`,
        type: "booking_request",
        url: "/#/board",
      },
    },
  ]);
}

async function handleNewMessage(services, actorUid, conversationId, messageId) {
  const conversationRef = services.db.collection("conversations").doc(conversationId);
  const [conversationSnapshot, messageSnapshot] = await Promise.all([
    conversationRef.get(),
    conversationRef.collection("messages").doc(messageId).get(),
  ]);
  if (!conversationSnapshot.exists || !messageSnapshot.exists) {
    throw new RequestError(404, "The message or conversation was not found.");
  }
  const conversation = conversationSnapshot.data();
  const message = messageSnapshot.data();
  if (!conversation.customerUid || !conversation.photographerUid
    || conversation.customerUid === conversation.photographerUid
    || !Array.isArray(conversation.participants)
    || !conversation.participants.includes(conversation.customerUid)
    || !conversation.participants.includes(conversation.photographerUid)
    || message.senderUid !== actorUid) {
    throw new RequestError(403, "You are not allowed to notify this conversation.");
  }

  let recipients;
  let senderName = "Someone";
  if (message.senderRole === "customer" && actorUid === conversation.customerUid) {
    recipients = [conversation.photographerUid];
    senderName = conversation.customerName || senderName;
  } else if (message.senderRole === "photographer" && actorUid === conversation.photographerUid) {
    const profile = await getPhotographer(services.db, actorUid);
    recipients = [conversation.customerUid];
    senderName = conversation.photographerName || profile.name || senderName;
  } else if (message.senderRole === "admin" && actorUid === ADMIN_UID) {
    recipients = [conversation.customerUid, conversation.photographerUid];
    senderName = "EventSnap support";
  } else {
    throw new RequestError(403, "You are not allowed to notify this conversation.");
  }

  return deliverOnce(services, `chat_message-${messageId}`, actorUid, [{
    recipients,
    payload: {
      title: `New message from ${senderName}`,
      body: "Open EventSnap to read the message.",
      type: "chat_message",
      url: "/#/",
    },
  }]);
}

function assertCanDelete(gig, actorUid) {
  if (actorUid !== ADMIN_UID && actorUid !== gig.ownerUid
    && actorUid !== gig.requestedPhotographerUid && actorUid !== gig.photographerUid) {
    throw new RequestError(403, "You are not allowed to delete this booking.");
  }
}

async function handleBookingDeletion(services, actorUid, gigId) {
  const { db, messaging } = services;
  const eventRef = db.collection("notificationEvents").doc(`booking_deleted-${gigId}`);
  const gigRef = db.collection("gigs").doc(gigId);
  const privateRef = db.collection("gigPrivate").doc(gigId);
  const claim = await db.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);
    const previous = eventSnapshot.data();
    if (previous) {
      if (actorUid !== ADMIN_UID && previous.actorUid !== actorUid) {
        throw new RequestError(403, "You are not allowed to delete this booking.");
      }
      if (previous.status === "sent") return { state: "sent" };
      if (previous.status === "processing" && previous.leaseUntil?.toMillis() > Date.now()) {
        return { state: "processing" };
      }
      if (previous.payload) {
        transaction.set(eventRef, {
          status: "processing",
          attempts: (previous.attempts || 0) + 1,
          leaseUntil: Timestamp.fromMillis(Date.now() + EVENT_LEASE_MS),
          expireAt: Timestamp.fromMillis(Date.now() + EVENT_TTL_MS),
        }, { merge: true });
        return { state: "claimed", payload: previous.payload };
      }
    }

    const gigSnapshot = await transaction.get(gigRef);
    if (!gigSnapshot.exists) throw new RequestError(404, "The booking was not found.");
    const gig = gigSnapshot.data();
    assertCanDelete(gig, actorUid);
    const privateSnapshot = await transaction.get(privateRef);
    let profileSnapshot = null;
    if (gig.status === "confirmed" && gig.photographerUid && gig.date) {
      profileSnapshot = await transaction.get(db.collection("profiles").doc(gig.photographerUid));
    }
    const payload = gig.status === "confirmed" && gig.photographerUid
      ? {
        recipients: [gig.photographerUid],
        title: "Confirmed booking removed",
        body: "A confirmed function booking was deleted from EventSnap.",
        type: "booking_cancelled",
        url: "/#/board",
      }
      : null;

    transaction.delete(gigRef);
    if (privateSnapshot.exists) transaction.delete(privateRef);
    if (profileSnapshot?.exists && Array.isArray(profileSnapshot.data().busyDates)
      && profileSnapshot.data().busyDates.includes(gig.date)) {
      transaction.update(db.collection("profiles").doc(gig.photographerUid), {
        busyDates: FieldValue.arrayRemove(gig.date),
      });
    }
    transaction.set(eventRef, {
      actorUid,
      status: payload ? "processing" : "sent",
      attempts: 1,
      payload,
      leaseUntil: payload ? Timestamp.fromMillis(Date.now() + EVENT_LEASE_MS) : FieldValue.delete(),
      expireAt: Timestamp.fromMillis(Date.now() + EVENT_TTL_MS),
    }, { merge: true });
    return payload ? { state: "claimed", payload } : { state: "sent" };
  });

  if (claim.state === "sent") return { deleted: true, notificationSent: true };
  if (claim.state === "processing") return { deleted: true, notificationSent: false, processing: true };

  try {
    const deliveredDevices = await sendToUsers({ db, messaging }, claim.payload.recipients, claim.payload);
    await eventRef.set({
      status: "sent",
      deliveredDevices,
      completedAt: FieldValue.serverTimestamp(),
      leaseUntil: FieldValue.delete(),
    }, { merge: true });
    return { deleted: true, notificationSent: deliveredDevices > 0, deliveredDevices };
  } catch (error) {
    await eventRef.set({
      status: "failed",
      errorCode: String(error.code || "unknown").slice(0, 100),
      leaseUntil: FieldValue.delete(),
    }, { merge: true });
    console.error("Booking was deleted but its push notification failed.", error);
    return { deleted: true, notificationSent: false };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const authorization = req.headers.authorization || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new RequestError(401, "A Firebase ID token is required.");

    const services = getAdminServices();
    let decodedToken;
    try {
      decodedToken = await services.auth.verifyIdToken(match[1], true);
    } catch (error) {
      if (["auth/id-token-expired", "auth/id-token-revoked", "auth/invalid-id-token", "auth/argument-error", "auth/user-disabled"]
        .includes(error.code)) {
        throw new RequestError(401, "The Firebase ID token is invalid or expired.");
      }
      throw error;
    }
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new RequestError(400, "A valid event body is required.");
    }

    let result;
    if (body.type === "booking_request") {
      result = await handleBookingRequest(services, decodedToken.uid, requireId(body.gigId, "booking ID"));
    } else if (body.type === "booking_accepted" || body.type === "booking_rejected") {
      result = await handleBookingResponse(
        services,
        decodedToken.uid,
        requireId(body.gigId, "booking ID"),
        body.type === "booking_accepted",
      );
    } else if (body.type === "booking_reopened") {
      result = await handleBookingReopen(
        services,
        decodedToken.uid,
        requireId(body.gigId, "booking ID"),
      );
    } else if (body.type === "new_message") {
      result = await handleNewMessage(
        services,
        decodedToken.uid,
        requireId(body.conversationId, "conversation ID"),
        requireId(body.messageId, "message ID"),
      );
    } else if (body.type === "booking_deleted") {
      result = await handleBookingDeletion(
        services,
        decodedToken.uid,
        requireId(body.gigId, "booking ID"),
      );
    } else {
      throw new RequestError(400, "Unsupported notification event.");
    }
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof RequestError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("Notification API request failed.", error);
    return res.status(500).json({ error: "Notification processing failed." });
  }
}
