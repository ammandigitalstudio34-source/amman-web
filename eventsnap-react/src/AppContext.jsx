import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getRedirectResult, onAuthStateChanged, signInAnonymously, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import {
  addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, runTransaction, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { CITIES, KEYS, TAG_TO_TYPE, TYPE_TO_TAG } from "./data";
import { auth, db, googleProvider, storage } from "./firebase";
import {
  listenForForegroundMessages, removeDeviceToken, sendNotificationEvent,
  showForegroundNotification, syncPushNotifications,
} from "./notifications";
import { scrollToId, useStored } from "./utils";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const fromProfile = (profile, authUid) => ({
  n: profile.name, r: "New", rv: "0", loc: profile.area, city: profile.city, km: null,
  price: profile.price, tags: profile.tags || [], scene: "studio", skin: "#8f5e40",
  hair: "#15100c", shirt: "#7b2ff7", av: "#e9defd", img: "", photo: profile.photo || "",
  pending: !profile.verified, registered: true, mine: profile.ownerUid === authUid,
  id: profile.id, ownerUid: profile.ownerUid || profile.id, phone: profile.phone,
  busyDates: profile.busyDates || [],
});

export function AppProvider({ children }) {
  const [authUser, setAuthUser] = useState(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [city, setCity] = useStored(KEYS.city, "Chennai");
  const [profiles, setProfiles] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [favs, setFavs] = useStored(KEYS.favs, []);
  const [chats, setChats] = useState({});
  const [chatMeta, setChatMeta] = useState({});
  const [seen, setSeen] = useStored(KEYS.seenUser, {});
  const [fpFilter, setFpFilter] = useState("All");
  const [fpCity, setFpCity] = useState(CITIES[city] ? city : "Chennai");
  const [fpShowAll, setFpShowAll] = useState(false);
  const [board, setBoard] = useState({ type: "all", radius: "0", status: "open" });
  const [postPrefill, setPostPrefill] = useState(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [bookingWith, setBookingWith] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [toastState, setToastState] = useState({ msg: "", id: 0 });

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setAuthUser(user);
    setAuthReady(true);
  }), []);

  const signInWithGoogle = useCallback(
    () => signInWithRedirect(auth, googleProvider),
    [],
  );
  const signInWithGooglePopup = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }, []);
  const signInAsGuest = useCallback(async () => {
    if (!auth) throw new Error("Firebase is not configured.");
    if (auth.currentUser) return auth.currentUser;
    const result = await signInAnonymously(auth);
    return result.user;
  }, []);
  const signOutGoogle = useCallback(async () => {
    if (auth.currentUser) await removeDeviceToken(auth.currentUser);
    await signOut(auth);
  }, []);
  const toast = useCallback((msg) => setToastState({ msg, id: Date.now() }), []);
  const notifyCommittedEvents = useCallback(async (events, user) => {
    const errors = [];
    const results = await Promise.all(events.map(async (event) => {
      try {
        return await sendNotificationEvent(event, user);
      } catch (error) {
        console.error("A saved EventSnap action could not trigger its push notification.", error);
        errors.push(error);
        return null;
      }
    }));
    if (errors.length) {
      const detail = errors[0] instanceof Error ? ` ${errors[0].message}` : "";
      toast(`Saved successfully, but a push notification could not be sent.${detail}`);
    } else if (results.some((result) => result?.notificationSent === false && !result.processing)) {
      toast("Saved successfully, but no recipient device received the push. The recipient must enable notifications on a supported device.");
    }
    return results;
  }, [toast]);
  const closeBooking = useCallback(() => setBookingWith(null), []);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => toast(`Could not sign in: ${error.message}`));
  }, [toast]);

  useEffect(() => {
    if (!authUser) return undefined;
    syncPushNotifications(authUser).catch((error) => {
      console.error("Could not sync the FCM token.", error);
      toast(`Could not sync notification registration: ${error.message}`);
    });
    let active = true;
    let unsubscribe = () => {};
    listenForForegroundMessages((payload) => {
      showForegroundNotification(payload).catch((error) => {
        console.error("Could not display a foreground notification.", error);
        toast(`Could not display notification: ${error.message}`);
      });
    }).then((stop) => {
      if (active) unsubscribe = stop;
      else stop();
    }).catch((error) => {
      console.error("Could not listen for foreground push notifications.", error);
      toast(`Could not initialize notifications: ${error.message}`);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [authUser, toast]);

  useEffect(() => onSnapshot(collection(db, "profiles"), (snapshot) => {
    setProfiles(snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id })));
  }, (error) => {
    console.error("Could not load photographer profiles from Firestore.", error);
    toast(`Could not load photographer profiles: ${error.message}`);
  }), [toast]);

  useEffect(() => onSnapshot(collection(db, "gigs"), (snapshot) => {
    setGigs(snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id })));
  }, (error) => {
    console.error("Could not load functions from Firestore.", error);
    toast(`Could not load functions: ${error.message}`);
  }), [toast]);

  useEffect(() => {
    if (!authReady || !authUser) {
      setChatMeta({});
      setChats({});
      return undefined;
    }
    setChats({});
    const conversations = query(
      collection(db, "conversations"),
      where("participants", "array-contains", authUser.uid)
    );
    let initialSnapshot = true;
    let previousConversations = {};
    return onSnapshot(conversations, (snapshot) => {
      const nextConversations = Object.fromEntries(snapshot.docs.map((entry) => [
        entry.id, { ...entry.data(), id: entry.id },
      ]));
      if (!initialSnapshot) {
        snapshot.docChanges().forEach((change) => {
          const current = nextConversations[change.doc.id];
          const previous = previousConversations[change.doc.id];
          if (!current || Number(current.lastMessageAt) <= Number(previous?.lastMessageAt || 0)) return;
          const myRole = current.photographerUid === authUser.uid ? "photographer" : "customer";
          if (!current.lastSenderRole || current.lastSenderRole === myRole) return;

          const sender = current.lastSenderRole === "customer"
            ? current.customerName || "Customer"
            : current.lastSenderRole === "photographer"
              ? current.photographerName || "Photographer"
              : "EventSnap support";
          toast(`New message from ${sender}. Open your profile to reply.`);
        });
      }
      initialSnapshot = false;
      previousConversations = nextConversations;
      setChatMeta(nextConversations);
    }, (error) => {
      console.error("Could not load conversations from Firestore.", error);
      toast(`Could not load conversations: ${error.message}`);
    });
  }, [authReady, authUser, toast]);

  useEffect(() => {
    if (!authUser || !selectedConversationId || !chatMeta[selectedConversationId]) return undefined;
    const messagesQuery = query(
      collection(db, "conversations", selectedConversationId, "messages"),
      orderBy("t", "asc")
    );
    return onSnapshot(messagesQuery, (snapshot) => {
      setChats((current) => ({
        ...current,
        [selectedConversationId]: snapshot.docs.map((entry) => {
          const message = entry.data();
          return {
            id: entry.id,
            from: message.senderUid === authUser.uid ? "me" : "them",
            text: message.text,
            t: message.t,
            senderRole: message.senderRole,
          };
        }),
      }));
    }, (error) => {
      console.error("Could not load conversation messages from Firestore.", error);
      toast(`Could not load messages: ${error.message}`);
    });
  }, [authUser, chatMeta, selectedConversationId, toast]);

  const safeCity = CITIES[city] ? city : "Chennai";
  const myProfile = authUser ? profiles.find((profile) => profile.ownerUid === authUser.uid) || null : null;
  const photographers = useMemo(
    () => profiles.slice().reverse().map((profile) => fromProfile(profile, authUser?.uid)),
    [profiles, authUser]
  );
  const conversations = useMemo(() => Object.entries(chatMeta).map(([id, meta]) => {
    const list = chats[id] || [];
    return {
      ...meta,
      id,
      lastMessageText: meta.lastMessageText || "",
      lastMessageAt: meta.lastMessageAt || 0,
      messages: list,
    };
  }), [chatMeta, chats]);
  const selectedConversation = conversations.find((entry) => entry.id === selectedConversationId) || null;
  const messages = selectedConversation ? chats[selectedConversation.id] || [] : [];

  const setLocation = useCallback((selectedCity) => {
    if (!CITIES[selectedCity]) return;
    setCity(selectedCity);
    setFpCity(selectedCity);
    setFpShowAll(false);
  }, [setCity]);

  const showCityPhotographers = useCallback((selectedCity, type, scroll) => {
    setLocation(selectedCity);
    const tag = TYPE_TO_TAG[type] || "All";
    const inCity = photographers.filter((profile) => profile.city === selectedCity);
    const withTag = inCity.filter((profile) => tag === "All" || profile.tags.includes(tag));
    setFpFilter(withTag.length ? tag : "All");
    if (scroll) {
      scrollToId("photographers");
      if (!inCity.length) toast(`No photographers in ${selectedCity} yet — be the first to join!`);
      else if (!withTag.length) toast(`No ${tag.toLowerCase()} photographers in ${selectedCity} yet — showing all ${inCity.length} there.`);
      else toast(`${withTag.length} photographer${withTag.length === 1 ? "" : "s"} found in ${selectedCity}.`);
    }
  }, [photographers, setLocation, toast]);

  const prefillPost = useCallback((fields, { scroll = true, focus = true } = {}) => {
    setPostPrefill({ ...fields, focus, nonce: Date.now() });
    if (scroll) scrollToId("post");
  }, []);

  const bookPhotographer = useCallback((profile) => {
    if (profile.ownerUid === authUser?.uid || profile.id === authUser?.uid) {
      toast("You can't book your own photographer profile.");
      return;
    }
    setBookingWith(profile);
  }, [authUser, toast]);

  const createProfile = useCallback(async (draft) => {
    if (!authUser) throw new Error("Sign in with Google before creating a profile.");
    let photo = draft.photo || "";
    if (photo.startsWith("data:")) {
      const contentType = photo.match(/^data:(image\/[^;]+);base64,/i)?.[1];
      if (!contentType) throw new Error("The selected profile photo is not a valid image.");
      const photoRef = ref(storage, `profile-photos/${authUser.uid}/avatar`);
      await uploadString(photoRef, photo, "data_url", { contentType });
      photo = await getDownloadURL(photoRef);
    }
    const id = authUser.uid;
    const profile = {
      ...draft, photo, id, ownerUid: authUser.uid, verified: false, created: new Date().toISOString(),
    };
    await setDoc(doc(db, "profiles", id), profile);
    return profile;
  }, [authUser]);

  const deleteMyProfile = useCallback(async (profileId) => {
    const profile = profiles.find((entry) => entry.id === profileId);
    if (!authUser || profile?.ownerUid !== authUser.uid) {
      throw new Error("You can only delete a profile linked to your signed-in account.");
    }
    await deleteDoc(doc(db, "profiles", profileId));
  }, [authUser, profiles]);

  const addGig = useCallback(async (gig) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Sign in before posting a function.");
    const { phone, notes, ...publicGig } = gig;
    const gigRef = doc(collection(db, "gigs"));
    const saved = { ...publicGig, ownerUid: currentUser.uid, created: Date.now(), id: gigRef.id };
    const batch = writeBatch(db);
    batch.set(gigRef, saved);
    batch.set(doc(db, "gigPrivate", gigRef.id), {
      ownerUid: currentUser.uid, phone, notes,
    });
    await batch.commit();
    await notifyCommittedEvents([{ type: "booking_request", gigId: gigRef.id }], currentUser);
    return saved;
  }, [notifyCommittedEvents]);

  const deleteGig = useCallback(async (gig) => {
    const currentUser = authUser || auth.currentUser;
    if (!currentUser) throw new Error("Sign in before deleting this booking.");
    if (gig.ownerUid !== currentUser.uid
      && gig.requestedPhotographerUid !== currentUser.uid
      && gig.photographerUid !== currentUser.uid) {
      throw new Error("You can only delete a booking you created or are assigned to.");
    }
    return sendNotificationEvent({ type: "booking_deleted", gigId: gig.id }, currentUser);
  }, [authUser]);

  const respondToBooking = useCallback(async (gig, decision) => {
    if (!authUser || !myProfile) {
      throw new Error("Sign in with your photographer account to respond to a booking.");
    }
    if (decision !== "confirmed" && decision !== "busy") {
      throw new Error("Choose whether to confirm the booking or mark the date busy.");
    }
    if (decision === "busy" && gig.requestedPhotographerUid !== authUser.uid) {
      throw new Error("Only the selected photographer can mark this booking busy.");
    }
    if (decision === "confirmed" && !myProfile.verified) {
      throw new Error("A verified photographer profile is required to confirm a booking.");
    }
    const profileRef = doc(db, "profiles", authUser.uid);
    const gigRef = doc(db, "gigs", gig.id);
    const relatedOpenGigs = decision === "busy"
      ? gigs.filter((entry) => entry.id !== gig.id
        && entry.requestedPhotographerUid === authUser.uid
        && entry.date === gig.date
        && entry.status === "open")
      : [];
    const relatedRefs = relatedOpenGigs.map((entry) => doc(db, "gigs", entry.id));
    const now = Date.now();
    const outcome = await runTransaction(db, async (transaction) => {
      const snapshots = await Promise.all([
        transaction.get(profileRef),
        transaction.get(gigRef),
        ...relatedRefs.map((reference) => transaction.get(reference)),
      ]);
      const profileSnapshot = snapshots[0];
      const gigSnapshot = snapshots[1];
      if (!profileSnapshot.exists() || !gigSnapshot.exists()) {
        throw new Error("This booking or photographer profile is no longer available.");
      }
      const currentGig = { ...gigSnapshot.data(), id: gigSnapshot.id };
      if (currentGig.status !== "open") {
        throw new Error("This booking has already been answered.");
      }
      if (decision === "busy" && currentGig.requestedPhotographerUid !== authUser.uid) {
        throw new Error("Only the selected photographer can mark this booking busy.");
      }
      const busyDates = profileSnapshot.data().busyDates || [];
      if (decision === "confirmed" && busyDates.includes(currentGig.date)) {
        throw new Error("You have already marked this date unavailable.");
      }

      const updateFor = (status) => ({
        status,
        photographer: myProfile.name,
        photographerUid: authUser.uid,
        [status === "confirmed" ? "confirmedAt" : "busyAt"]: now,
      });
      transaction.update(profileRef, { busyDates: arrayUnion(currentGig.date) });
      transaction.update(gigRef, updateFor(decision));
      const changedGigIds = [currentGig.id];
      relatedOpenGigs.forEach((entry, index) => {
        const snapshot = snapshots[index + 2];
        if (snapshot.exists() && snapshot.data().status === "open") {
          transaction.update(relatedRefs[index], updateFor("busy"));
          changedGigIds.push(relatedRefs[index].id);
        }
      });
      return { gig: currentGig, changedGigIds };
    });
    await notifyCommittedEvents(outcome.changedGigIds.map((gigId) => ({
      type: decision === "confirmed" ? "booking_accepted" : "booking_rejected",
      gigId,
    })), authUser);
    return outcome.gig;
  }, [authUser, gigs, myProfile, notifyCommittedEvents]);

  const confirmGig = useCallback(async (gig) => {
    await respondToBooking(gig, "confirmed");
    const privateGig = await getDoc(doc(db, "gigPrivate", gig.id));
    return privateGig.exists() ? privateGig.data() : {};
  }, [respondToBooking]);

  const toggleFav = useCallback((name) => {
    const on = !favs.includes(name);
    setFavs(on ? [...favs, name] : favs.filter((entry) => entry !== name));
    toast(on ? `${name} saved to your favourites.` : `${name} removed from your favourites.`);
  }, [favs, setFavs, toast]);

  const openChat = useCallback(async (profile) => {
    try {
      const currentUser = authUser || (await signInAsGuest());
      const mine = profile.mine || profile.ownerUid === currentUser.uid;
      setChatWith({ ...profile, mine });
      setSelectedConversationId(!mine ? `${profile.ownerUid}_${currentUser.uid}` : null);
    } catch (error) {
      toast(`Could not open chat: ${error.message}`);
    }
  }, [authUser, signInAsGuest, toast]);

  const selectConversation = useCallback((conversation) => {
    const profile = photographers.find((entry) => entry.id === conversation.profileId)
      || {
        n: conversation.photographerName, city: conversation.city, loc: conversation.area,
        price: conversation.price, tags: conversation.tags || [], ownerUid: conversation.photographerUid,
        id: conversation.profileId,
      };
    setChatWith({ ...profile, mine: true });
    setSelectedConversationId(conversation.id);
  }, [photographers]);

  const returnToInbox = useCallback(() => setSelectedConversationId(null), []);
  const closeChat = useCallback(() => {
    setChatWith(null);
    setSelectedConversationId(null);
  }, []);

  const sendChat = useCallback(async (text) => {
    const clean = text.trim();
    if (!clean || !chatWith) return Promise.resolve();
    const currentUser = authUser || (await signInAsGuest());
    const id = selectedConversationId || `${chatWith.ownerUid}_${currentUser.uid}`;
    const role = chatWith.mine ? "photographer" : "customer";
    let existing = chatMeta[id];
    if (!existing) {
      const current = await getDocs(query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUser.uid)
      ));
      const conversation = current.docs.find((entry) => entry.id === id);
      if (conversation) existing = conversation.data();
    }
    const now = Date.now();
    const conversationRef = doc(db, "conversations", id);
    const customerUid = role === "customer" ? currentUser.uid : existing.customerUid;
    const photographerUid = chatWith.ownerUid;
    if (!existing) {
      await setDoc(conversationRef, {
        customerUid,
        customerName: role === "customer" ? currentUser.displayName || "Guest" : "",
        photographerUid,
        photographerName: chatWith.n,
        profileId: chatWith.id,
        city: chatWith.city,
        area: chatWith.loc,
        price: chatWith.price,
        tags: chatWith.tags || [],
        participants: [customerUid, photographerUid],
        createdAt: now,
      });
    }
    const message = await addDoc(collection(db, "conversations", id, "messages"), {
      senderUid: currentUser.uid, senderRole: role, text: clean, t: now,
    });
    await updateDoc(conversationRef, {
      lastMessageText: clean, lastMessageAt: now, lastSenderRole: role, updatedAt: now,
    });
    await notifyCommittedEvents([{
      type: "new_message",
      conversationId: id,
      messageId: message.id,
    }], currentUser);
    setSelectedConversationId(id);
  }, [authUser, chatMeta, chatWith, myProfile, notifyCommittedEvents, selectedConversationId, signInAsGuest]);

  const markSeen = useCallback(() => {
    if (!selectedConversationId) return Promise.resolve();
    setSeen((current) => ({ ...current, [selectedConversationId]: Date.now() }));
    return Promise.resolve();
  }, [selectedConversationId, setSeen]);

  const isConversationUnread = useCallback((conversation) => {
    if (!authUser || !conversation?.id) return false;
    const myRole = conversation.photographerUid === authUser.uid ? "photographer" : "customer";
    return conversation.lastSenderRole !== myRole
      && Number(conversation.lastMessageAt) > (seen[conversation.id] || 0);
  }, [authUser, seen]);

  const unreadFor = useCallback((profile) => {
    const ownerUid = profile.ownerUid || profile.id;
    if (ownerUid !== authUser?.uid) return 0;
    return conversations.filter((conversation) => (
      conversation.photographerUid === ownerUid && isConversationUnread(conversation)
    )).length;
  }, [authUser, conversations, isConversationUnread]);

  const value = {
    authUser, authReady, signInWithGoogle, signInWithGooglePopup, signInAsGuest, signOutGoogle,
    city: safeCity, setLocation, showCityPhotographers,
    gigs, addGig, deleteGig, confirmGig, respondToBooking,
    profiles, myProfile, createProfile, deleteMyProfile,
    photographers, favs, toggleFav,
    fpFilter, setFpFilter, fpCity, setFpCity, fpShowAll, setFpShowAll,
    board, setBoard, postPrefill, prefillPost,
    bookPhotographer, bookingWith, closeBooking, joinOpen, setJoinOpen,
    conversations, chatWith, closeChat, openChat,
    selectedConversation, selectedConversationId, selectConversation, returnToInbox,
    messages, sendChat, markSeen, unreadFor, isConversationUnread,
    toast, toastState,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
