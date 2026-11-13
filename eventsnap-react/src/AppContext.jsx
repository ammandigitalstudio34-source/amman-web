import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { CITIES, KEYS, TAG_TO_TYPE, TYPE_TO_TAG } from "./data";
import { auth, db, googleProvider, storage } from "./firebase";
import { inr, scrollToId, useStored } from "./utils";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const fromProfile = (profile, authUid) => ({
  n: profile.name, r: "New", rv: "0", loc: profile.area, city: profile.city, km: null,
  price: profile.price, tags: profile.tags || [], scene: "studio", skin: "#8f5e40",
  hair: "#15100c", shirt: "#7b2ff7", av: "#e9defd", img: "", photo: profile.photo || "",
  pending: !profile.verified, registered: true, mine: profile.ownerUid === authUid,
  id: profile.id, ownerUid: profile.ownerUid || profile.id, phone: profile.phone,
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
  const [chatWith, setChatWith] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [toastState, setToastState] = useState({ msg: "", id: 0 });

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setAuthUser(user);
    setAuthReady(true);
  }), []);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }, []);
  const signOutGoogle = useCallback(() => signOut(auth), []);
  const toast = useCallback((msg) => setToastState({ msg, id: Date.now() }), []);

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
    return onSnapshot(conversations, (snapshot) => {
      setChatMeta(Object.fromEntries(snapshot.docs.map((entry) => [
        entry.id, { ...entry.data(), id: entry.id },
      ])));
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
    prefillPost({
      type: TAG_TO_TYPE[profile.tags[0]] || profile.tags[0],
      city: CITIES[profile.city] ? profile.city : undefined,
      notes: `Preferred photographer: ${profile.n} (${inr(profile.price)} / event)`,
      budget: profile.price,
    });
    toast(`Booking ${profile.n} — add your function details.`);
  }, [prefillPost, toast]);

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
    if (!authUser) throw new Error("Sign in with Google before posting a function.");
    const { phone, notes, ...publicGig } = gig;
    const gigRef = doc(collection(db, "gigs"));
    const saved = { ...publicGig, ownerUid: authUser.uid, created: Date.now(), id: gigRef.id };
    const batch = writeBatch(db);
    batch.set(gigRef, saved);
    batch.set(doc(db, "gigPrivate", gigRef.id), {
      ownerUid: authUser.uid, phone, notes,
    });
    await batch.commit();
    return saved;
  }, [authUser]);

  const confirmGig = useCallback(async (gig) => {
    if (!authUser || !myProfile?.verified) {
      throw new Error("Sign in with a verified photographer account to confirm a function.");
    }
    await updateDoc(doc(db, "gigs", gig.id), {
      status: "confirmed",
      photographer: myProfile.name,
      photographerUid: authUser.uid,
      confirmedAt: Date.now(),
    });
    const privateGig = await getDoc(doc(db, "gigPrivate", gig.id));
    return privateGig.exists() ? privateGig.data() : {};
  }, [authUser, myProfile]);

  const toggleFav = useCallback((name) => {
    const on = !favs.includes(name);
    setFavs(on ? [...favs, name] : favs.filter((entry) => entry !== name));
    toast(on ? `${name} saved to your favourites.` : `${name} removed from your favourites.`);
  }, [favs, setFavs, toast]);

  const openChat = useCallback((profile) => {
    const mine = profile.mine || profile.ownerUid === authUser?.uid;
    setChatWith({ ...profile, mine });
    setSelectedConversationId(!mine && authUser ? `${profile.ownerUid}_${authUser.uid}` : null);
  }, [authUser]);

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
    if (!authUser) throw new Error("Sign in with Google before sending messages.");
    const id = selectedConversationId || `${chatWith.ownerUid}_${authUser.uid}`;
    const role = chatWith.mine ? "photographer" : "customer";
    let existing = chatMeta[id];
    if (role === "photographer" && (!existing || !myProfile?.verified)) {
      throw new Error("Only a verified photographer can reply to customer messages.");
    }
    if (!existing) {
      const current = await getDoc(doc(db, "conversations", id));
      if (current.exists()) existing = current.data();
    }
    const now = Date.now();
    const conversationRef = doc(db, "conversations", id);
    const customerUid = role === "customer" ? authUser.uid : existing.customerUid;
    const photographerUid = chatWith.ownerUid;
    if (!existing) {
      await setDoc(conversationRef, {
        customerUid,
        customerName: role === "customer" ? authUser.displayName || "Customer" : "",
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
    await addDoc(collection(db, "conversations", id, "messages"), {
      senderUid: authUser.uid, senderRole: role, text: clean, t: now,
    });
    await updateDoc(conversationRef, {
      lastMessageText: clean, lastMessageAt: now, lastSenderRole: role, updatedAt: now,
    });
    setSelectedConversationId(id);
  }, [authUser, chatMeta, chatWith, myProfile, selectedConversationId]);

  const markSeen = useCallback(() => {
    if (!selectedConversationId) return Promise.resolve();
    setSeen((current) => ({ ...current, [selectedConversationId]: Date.now() }));
    return Promise.resolve();
  }, [selectedConversationId, setSeen]);

  const unreadFor = useCallback((profile) => {
    const list = chats[String(profile.id)] || [];
    const last = list[list.length - 1];
    return last?.from === "me" && last.t > (seen[String(profile.id)] || 0) ? 1 : 0;
  }, [chats, seen]);

  const value = {
    authUser, authReady, signInWithGoogle, signOutGoogle,
    city: safeCity, setLocation, showCityPhotographers,
    gigs, addGig, confirmGig,
    profiles, myProfile, createProfile, deleteMyProfile,
    photographers, favs, toggleFav,
    fpFilter, setFpFilter, fpCity, setFpCity, fpShowAll, setFpShowAll,
    board, setBoard, postPrefill, prefillPost,
    bookPhotographer, joinOpen, setJoinOpen,
    conversations, chatWith, closeChat, openChat,
    selectedConversation, selectedConversationId, selectConversation, returnToInbox,
    messages, sendChat, markSeen, unreadFor,
    toast, toastState,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
