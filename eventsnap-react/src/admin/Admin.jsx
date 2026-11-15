import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  EmailAuthProvider, getRedirectResult, linkWithCredential, onAuthStateChanged, signInWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, signOut,
} from "firebase/auth";
import {
  addDoc, collection, deleteDoc, deleteField, doc, getDocs, onSnapshot, orderBy, query, updateDoc, writeBatch,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { sendNotificationEvent } from "../notifications";
import { dayLabel, hhmm, initials, inr, useStored } from "../utils";
import { Bubble, CameraFill, Grid, LogoMark, Send } from "../components/Icons";
import s from "./admin.module.css";

/* EventSnap admin panel (route: #/admin). */

const cx = (...a) => a.filter(Boolean).join(" ");
const ADMIN_UID = "QXpWsJiQE9N0e4lb12J2oFqUfyk2";
const authErrorMessage = (error) => {
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(error.code)) {
    return "Email or password is incorrect, or no password is linked to this Firebase account. If the admin account only uses Google, use “Set up password with Google” below.";
  }
  if (error.code === "auth/operation-not-allowed") {
    return "This sign-in provider is disabled. Enable Google and/or Email/Password in Firebase Console → Authentication → Sign-in method.";
  }
  if (error.code === "auth/unauthorized-domain") {
    return "This website domain is not authorized for Firebase Authentication. Add it under Firebase Console → Authentication → Settings → Authorized domains.";
  }
  if (error.code === "auth/email-already-in-use") {
    return "This email belongs to another Firebase account and cannot be linked to the authorized admin account.";
  }
  return `Could not authenticate: ${error.message}`;
};
const ago = (t) => {
  const sec = (Date.now() - t) / 1000;
  if (sec < 60) return "just now"; if (sec < 3600) return Math.floor(sec / 60) + " min ago"; if (sec < 86400) return Math.floor(sec / 3600) + " h ago";
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
function Login({ onSignIn, onSignInGoogle, onSetupPassword, busy, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className={s.login}>
      <div>
        <div className={s.brand}><LogoMark simple /><div><b>Event<em>Snap</em></b><small>Admin panel</small></div></div>
        <h1>Admin login</h1>
        <p>Sign in with your authorized admin email and password.</p>
        <div className={s.err} role="alert">{error}</div>
        <form onSubmit={(event) => {
          event.preventDefault();
          onSignIn(email, password);
        }}>
          <div className={s.fld}>
            <label htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className={s.fld}>
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <button type="submit" className={cx(s.btn, s.btnP)} style={{ width: "100%" }} disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <button type="button" className={cx(s.btn, s.btnG)} style={{ width: "100%", marginTop: 10 }} onClick={onSignInGoogle} disabled={busy}>
          Continue with Google
        </button>
        <p style={{ margin: "16px 0 8px", fontSize: ".8rem" }}>
          First time? Link a password to the authorized Google admin account.
        </p>
        <button type="button" className={cx(s.btn, s.btnG)} style={{ width: "100%" }} onClick={() => onSetupPassword(email, password)} disabled={busy}>
          Set up password with Google
        </button>
        <p style={{ textAlign: "center", margin: "16px 0 0" }}><a href="/" style={{ color: "#7b2ff7", fontWeight: 700 }}>← Back to website</a></p>
      </div>
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(auth.currentUser);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [settingUpPassword, setSettingUpPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setChecking(false);
    if (nextUser && nextUser.uid !== ADMIN_UID) {
      setError("This account is not authorized to access the admin panel.");
      setUser(null);
      signOut(auth).catch((signOutError) => {
        setError(`Could not sign out unauthorized account: ${signOutError.message}`);
      });
      return;
    }
    setUser(nextUser);
  }), []);
  useEffect(() => {
    getRedirectResult(auth).catch((redirectError) => {
      setError(authErrorMessage(redirectError));
    });
  }, []);

  const login = async (email, password) => {
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (signInError) {
      setError(authErrorMessage(signInError));
    } finally {
      setBusy(false);
    }
  };
  const loginWithGoogle = async () => {
    setBusy(true);
    setError("");
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (signInError) {
      setError(authErrorMessage(signInError));
      setBusy(false);
    }
  };
  const setupPassword = async (email, password) => {
    if (!email.trim() || !password) {
      setError("Enter the email and password you want to use before setting up password sign-in.");
      return;
    }

    setBusy(true);
    setSettingUpPassword(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.uid !== ADMIN_UID) {
        await signOut(auth);
        throw new Error("This Google account is not authorized to access the admin panel.");
      }

      const credential = EmailAuthProvider.credential(email.trim(), password);
      await linkWithCredential(result.user, credential);
    } catch (setupError) {
      let message = authErrorMessage(setupError);
      if (auth.currentUser?.uid === ADMIN_UID) {
        try {
          await signOut(auth);
        } catch (signOutError) {
          message += ` Could not sign out afterward: ${signOutError.message}`;
        }
      }
      setError(message);
    } finally {
      setSettingUpPassword(false);
      setBusy(false);
    }
  };
  const logout = async () => {
    try {
      await signOut(auth);
      setError("");
    } catch (signOutError) {
      setError(`Could not sign out: ${signOutError.message}`);
    }
  };
  const authorized = user?.uid === ADMIN_UID;
  return (
    <div className={s.root}>
      {checking
        ? <div className={s.login}><div><p>Checking admin access…</p></div></div>
        : authorized && !settingUpPassword
        ? <Panel onLogout={logout} />
        : <Login onSignIn={login} onSignInGoogle={loginWithGoogle} onSetupPassword={setupPassword} busy={busy} error={error} />}
    </div>
  );
}

function Panel({ onLogout }) {
  const [profiles, setProfiles] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [conversationDocs, setConversationDocs] = useState({});
  const [seen, setSeen] = useStored("es_chat_seen_admin", {});
  const [view, setView] = useState("dash");
  const [active, setActive] = useState(null);
  const [toastMsg, setToastMsg] = useState({ m: "", id: 0 });
  const [toastOn, setToastOn] = useState(false);
  const toast = useCallback((m) => setToastMsg({ m, id: Date.now() }), []);
  useEffect(() => { if (!toastMsg.m) return; setToastOn(true); const t = setTimeout(() => setToastOn(false), 2800); return () => clearTimeout(t); }, [toastMsg]);

  useEffect(() => {
    const stopProfiles = onSnapshot(collection(db, "profiles"), (snapshot) => {
      setProfiles(snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id })));
    }, (error) => toast(`Could not load profiles: ${error.message}`));
    const stopGigs = onSnapshot(collection(db, "gigs"), (snapshot) => {
      setGigs(snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id })));
    }, (error) => toast(`Could not load functions: ${error.message}`));
    const stopConversations = onSnapshot(collection(db, "conversations"), (snapshot) => {
      setConversationDocs(Object.fromEntries(snapshot.docs.map((entry) => [
        entry.id, { ...entry.data(), id: entry.id },
      ])));
    }, (error) => toast(`Could not load conversations: ${error.message}`));
    return () => {
      stopProfiles();
      stopGigs();
      stopConversations();
    };
  }, [toast]);

  useEffect(() => {
    if (!active) return undefined;
    const messagesQuery = query(
      collection(db, "conversations", active, "messages"),
      orderBy("t", "asc")
    );
    return onSnapshot(messagesQuery, (snapshot) => {
      setChatMessages((current) => ({
        ...current,
        [active]: snapshot.docs.map((entry) => {
          const message = entry.data();
          return {
            from: message.senderRole === "customer" ? "me" : "them",
            by: message.senderRole === "admin" ? "admin" : undefined,
            text: message.text,
            t: message.t,
          };
        }),
      }));
    }, (error) => toast(`Could not load conversation messages: ${error.message}`));
  }, [active, toast]);

  const convs = useMemo(() => Object.entries(conversationDocs).map(([id, conversation]) => {
    const last = {
      from: conversation.lastSenderRole === "customer" ? "me" : "them",
      text: conversation.lastMessageText || "",
      t: conversation.lastMessageAt || 0,
    };
    return {
      id, name: conversation.photographerName,
      last,
      unread: id === active && view === "msgs" ? 0
        : conversation.lastSenderRole === "customer" && last.t > (seen[id] || 0) ? 1 : 0,
      conversation,
    };
  }).filter((conversation) => conversation.last.text).sort((a, b) => b.last.t - a.last.t), [conversationDocs, seen, active, view]);
  const unread = convs.reduce((a, c) => a + c.unread, 0);
  const pending = profiles.filter((p) => !p.verified).length;

  // toast when a new customer message arrives
  const previousMessages = useRef(null);
  useEffect(() => {
    const current = Object.fromEntries(Object.entries(conversationDocs).map(([id, conversation]) => [
      id, conversation.lastMessageAt || 0,
    ]));
    if (previousMessages.current) {
      const hasNewCustomerMessage = Object.entries(conversationDocs).some(([id, conversation]) => (
        conversation.lastSenderRole === "customer"
        && (conversation.lastMessageAt || 0) > (previousMessages.current[id] || 0)
      ));
      if (hasNewCustomerMessage) toast("New message from a customer");
    }
    previousMessages.current = current;
  }, [conversationDocs, toast]);
  useEffect(() => { document.title = (unread ? `(${unread}) ` : "") + "EventSnap Admin"; }, [unread]);

  // reading a thread marks it seen
  useEffect(() => { if (view === "msgs" && active) setSeen((x) => ({ ...x, [active]: Date.now() })); }, [view, active, chatMessages[active]?.length]);

  const profileByName = (n) => profiles.find((p) => p.name === n);
  const Avatar = ({ name, small }) => {
    const p = profileByName(name);
    return <span className={cx(s.av, small && s.avSm)}>{p?.photo ? <img src={p.photo} alt="" /> : initials(name)}</span>;
  };
  const openChat = (id) => { setActive(id); setView("msgs"); };
  const sendAdminMessage = async (conversationId, text) => {
    const clean = text.trim();
    if (!clean || !conversationId) return;
    const now = Date.now();
    const message = await addDoc(collection(db, "conversations", conversationId, "messages"), {
      senderUid: ADMIN_UID, senderRole: "admin", text: clean, t: now,
    });
    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessageText: clean, lastMessageAt: now, lastSenderRole: "admin", updatedAt: now,
    });
    try {
      await sendNotificationEvent({ type: "new_message", conversationId, messageId: message.id }, auth.currentUser);
    } catch (error) {
      console.error("The admin reply was saved but its push notification could not be sent.", error);
      toast("Reply sent, but its push notification could not be sent.");
    }
  };
  const deleteConversation = async (conversationId) => {
    const messages = await getDocs(collection(db, "conversations", conversationId, "messages"));
    for (let offset = 0; offset < messages.docs.length; offset += 500) {
      const batch = writeBatch(db);
      messages.docs.slice(offset, offset + 500).forEach((message) => batch.delete(message.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, "conversations", conversationId));
    setChatMessages((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
  };
  const updateProfile = (profile, changes) => updateDoc(doc(db, "profiles", profile.id), changes);
  const removeProfile = (profile) => deleteDoc(doc(db, "profiles", profile.id));
  const removeGig = (gig) => sendNotificationEvent(
    { type: "booking_deleted", gigId: gig.id },
    auth.currentUser,
  );
  const updateGig = (gig, changes) => {
    const update = Object.fromEntries(Object.entries(changes).map(([key, value]) => [
      key, value === null ? deleteField() : value,
    ]));
    return updateDoc(doc(db, "gigs", gig.id), update);
  };

  const NavB = ({ v, icon, label, count }) => (
    <button className={cx(s.navB, view === v && s.on)} onClick={() => setView(v)}>{icon}{label}{count > 0 && <span className={s.cnt}>{count}</span>}</button>
  );

  return (
    <div className={s.app}>
      <aside className={s.side}>
        <div className={s.brand}><LogoMark simple /><div><b>Event<em>Snap</em></b><small>Admin panel</small></div></div>
        <NavB v="dash" label="Dashboard" icon={<Grid />} />
        <NavB v="msgs" label="Messages" count={unread} icon={<Bubble />} />
        <NavB v="phot" label="Photographers" count={pending} icon={<CameraFill />} />
        <NavB v="func" label="Functions" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" /></svg>} />
        <div className={s.sideFoot}>
          <a className={s.navB} href="/"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg><span className={s.btnLabel}>Back to Home</span></a>
          <button className={s.navB} onClick={onLogout}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" /></svg><span className={s.btnLabel}>Log out</span></button>
        </div>
      </aside>

      <main className={s.main}>
        <div className={s.homeBar}>
          <a className={s.backHome} href="/">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            Back to Home
          </a>
        </div>
        {view === "dash" && <Dashboard {...{ profiles, gigs, convs, unread, pending, openChat, setView, Avatar }} />}
        {view === "msgs" && <Messages {...{ chats: chatMessages, convs, active, setActive, profileByName, Avatar, toast, sendAdminMessage, deleteConversation }} />}
        {view === "phot" && <Photographers {...{ profiles, toast, updateProfile, removeProfile }} />}
        {view === "func" && <Functions {...{ gigs, toast, updateGig, removeGig }} />}
      </main>
      <div className={cx(s.toast, toastOn && s.toastShow)}>{toastMsg.m}</div>
    </div>
  );
}

const Live = () => <span className={s.live}><i />Live</span>;

function Dashboard({ profiles, gigs, convs, unread, pending, openChat, setView, Avatar }) {
  const stats = [
    ["Registered photographers", profiles.length, "#f1e9ff", "#7b2ff7", <CameraFill key="i" size={24} />],
    ["Pending verification", pending, "#fff3d6", "#c98a00", <svg key="i" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>],
    ["Open functions", gigs.filter((g) => g.status === "open").length, "#e8f0ff", "#2457c5", <svg key="i" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" /></svg>],
    ["Confirmed functions", gigs.filter((g) => g.status === "confirmed").length, "#e3f7eb", "#137a3e", <svg key="i" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>],
    ["Conversations", convs.length, "#f1e9ff", "#7b2ff7", <Bubble key="i" size={24} />],
    ["Unread messages", unread, "#fdecec", "#c62a2f", <svg key="i" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg>],
  ];
  return (
    <>
      <div className={s.top}><div><h2>Dashboard</h2><p>Everything happening on EventSnap right now.</p></div><Live /></div>
      <div className={s.stats}>
        {stats.map(([l, v, bg, fg, ic]) => <div className={s.stat} key={l}><div className={s.ic} style={{ background: bg, color: fg }}>{ic}</div><div><b>{v}</b><span>{l}</span></div></div>)}
      </div>
      <div className={s.grid2}>
        <div className={s.panel}>
          <div className={s.panelH}><h3>Latest messages</h3><button className={cx(s.btn, s.btnG, s.btnSm)} onClick={() => setView("msgs")}>Open inbox</button></div>
          <ul className={s.feed}>
            {convs.slice(0, 5).map((c) => (
              <li key={c.id} className={s.click} onClick={() => openChat(c.id)}>
                <span className={s.dot}><Bubble size={18} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b>{c.name}</b> {c.unread > 0 && <span className={cx(s.pill, s.pPend)}>{c.unread} new</span>}
                  <small style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last.from === "me" ? "Customer" : "Photographer"}: {c.last.text}</small>
                </div>
                <small>{ago(c.last.t)}</small>
              </li>
            ))}
            {!convs.length && <li className={s.empty} style={{ display: "block" }}>No messages yet. When a customer taps “Message” on the website, it shows up here.</li>}
          </ul>
        </div>
        <div className={s.panel}>
          <div className={s.panelH}><h3>New photographers</h3><button className={cx(s.btn, s.btnG, s.btnSm)} onClick={() => setView("phot")}>Manage</button></div>
          <ul className={s.feed}>
            {profiles.slice().reverse().slice(0, 5).map((p) => (
              <li key={p.id}>
                <Avatar name={p.name} small />
                <div style={{ flex: 1, minWidth: 0 }}><b>{p.name}</b><small>{p.area}, {p.city} · +91 {p.phone}</small></div>
                <span className={cx(s.pill, p.verified ? s.pOk : s.pPend)}>{p.verified ? "Verified" : "Pending"}</span>
              </li>
            ))}
            {!profiles.length && <li className={s.empty} style={{ display: "block" }}>No photographers have joined yet.</li>}
          </ul>
        </div>
      </div>
    </>
  );
}

function Messages({ chats, convs, active, setActive, profileByName, Avatar, toast, sendAdminMessage, deleteConversation }) {
  const [text, setText] = useState("");
  const bodyRef = useRef(null), inputRef = useRef(null);
  const list = active ? chats[active] || [] : [];
  useLayoutEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [list.length, active]);
  useEffect(() => { if (active) setTimeout(() => inputRef.current?.focus(), 0); }, [active]);

  const current = convs.find((conversation) => conversation.id === active);
  const prof = active ? profileByName(current?.name) : null;
  const meta = current?.conversation || {};
  const where = prof ? `${prof.area}, ${prof.city}` : meta.city ? `${meta.area || ""}, ${meta.city}` : "";
  const price = prof ? prof.price : meta.price;

  const send = async (t) => {
    t = t.trim(); if (!t || !active) return;
    try {
      await sendAdminMessage(active, t);
      setText("");
    } catch (error) {
      toast(`Could not send this reply: ${error.message}`);
    }
  };
  const del = async () => {
    if (!window.confirm(`Delete the whole conversation with ${current?.name || "this customer"}?`)) return;
    try {
      await deleteConversation(active);
      setActive(null); toast("Conversation deleted.");
    } catch (error) {
      toast(`Could not delete the conversation: ${error.message}`);
    }
  };

  let lastDay = "";
  return (
    <>
      <div className={s.top}><div><h2>Messages</h2><p>Customers' messages to photographers. Reply on the photographer's behalf.</p></div><Live /></div>
      <div className={cx(s.panel, s.msgs, active && s.hasThread)}>
        <div className={s.convs}>
          {convs.map((c) => (
            <button key={c.id} className={cx(s.conv, c.id === active && s.convOn)} onClick={() => setActive(c.id)}>
              <Avatar name={c.name} />
              <span className={s.mid}><b>{c.conversation.customerName || "Customer"} · {c.name}</b><span className={s.last}>{c.last.from === "me" ? "Customer: " : "You: "}{c.last.text}</span></span>
              <span className={s.rt}>{ago(c.last.t)}{c.unread > 0 && <><br /><span className={s.un}>{c.unread}</span></>}</span>
            </button>
          ))}
          {!convs.length && <div className={s.empty}>No conversations yet.<br />Open the website, tap <b>Message</b> on a photographer and send something.</div>}
        </div>
        <div className={s.thread}>
          {!active ? (
            <div className={s.noThread}><Bubble size={54} sw={1.6} />Select a conversation to read and reply.</div>
          ) : (
            <>
              <div className={s.thH}>
                <button className={s.back} aria-label="Back" onClick={() => setActive(null)}>←</button>
                <Avatar name={current?.name || "Customer"} />
                <div className={s.mid}><b>{current?.conversation.customerName || "Customer"} · {current?.name}</b><br /><small>{where}{prof ? ` · +91 ${prof.phone}` : ""}</small></div>
                <button className={cx(s.btn, s.btnDel, s.btnSm)} onClick={del}>Delete chat</button>
              </div>
              <div className={s.thBody} ref={bodyRef}>
                {list.map((msg, i) => {
                  const d = dayLabel(msg.t), showDay = d !== lastDay; lastDay = d;
                  return (
                    <div key={i} style={{ display: "contents" }}>
                      {showDay && <div className={s.day}>{d}</div>}
                      <div className={cx(s.m, msg.from === "me" ? s.cust : s.ph)}>
                        <span className={s.lbl}>{msg.from === "me" ? "Customer" : current?.name + (msg.by === "admin" ? " (admin)" : "")}</span>
                        {msg.text}<time>{hhmm(msg.t)}</time>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={s.quick}>
                {["Yes, I'm available on that date 👍", price ? `My price is ${inr(price)} per event.` : "Let me check my price for that.", "Please share the venue and timing.", "Sorry, I'm already booked that day."]
                  .map((q) => <button type="button" key={q} onClick={() => send(q)}>{q}</button>)}
              </div>
              <form className={s.thF} onSubmit={(e) => { e.preventDefault(); send(text); }}>
                <input ref={inputRef} placeholder={`Reply as ${active}…`} autoComplete="off" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
                <button aria-label="Send"><Send /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Photographers({ profiles, toast, updateProfile, removeProfile }) {
  const [q, setQ] = useState("");
  const list = profiles.filter((p) => !q || [p.name, p.city, p.area, p.phone].join(" ").toLowerCase().includes(q.toLowerCase())).slice().reverse();
  const verify = async (p) => {
    try {
      await updateProfile(p, { verified: !p.verified });
      toast(!p.verified ? `${p.name} is now verified ✓` : `${p.name} set back to pending.`);
    } catch (error) { toast(`Could not update ${p.name}'s verification: ${error.message}`); }
  };
  const del = async (p) => {
    if (!window.confirm(`Delete ${p.name}'s profile? This removes it from the website.`)) return;
    try { await removeProfile(p); toast(`${p.name} deleted.`); }
    catch (error) { toast(`Could not delete ${p.name}'s profile: ${error.message}`); }
  };
  return (
    <>
      <div className={s.top}><div><h2>Photographers</h2><p>Profiles created with “Join as a photographer”. Verify them to show the green Verified badge.</p></div></div>
      <div className={s.panel}>
        <div className={s.panelH}><h3>Registered photographers ({profiles.length})</h3><input className={s.search} placeholder="Search name, city, phone…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className={s.tblWrap}>
          <table className={s.tbl}>
            <thead><tr><th>Photographer</th><th>Mobile</th><th>Location</th><th>Shoots</th><th>Price</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><div className={s.who}><span className={s.av}>{p.photo ? <img src={p.photo} alt="" /> : initials(p.name)}</span><div><b>{p.name}</b><small>{p.exp}</small></div></div></td>
                  <td className={s.nowrap}>+91 {p.phone}</td>
                  <td>{p.area}, <b>{p.city}</b></td>
                  <td><div className={s.tags}>{(p.tags || []).map((t) => <span key={t}>{t}</span>)}</div></td>
                  <td className={s.nowrap}>{inr(p.price)}</td>
                  <td className={s.nowrap}>{p.created ? new Date(p.created).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                  <td><span className={cx(s.pill, p.verified ? s.pOk : s.pPend)}>{p.verified ? "Verified" : "Pending"}</span></td>
                  <td><div className={s.acts}>
                    <button className={cx(s.btn, s.btnSm, p.verified ? s.btnG : s.btnOk)} onClick={() => verify(p)}>{p.verified ? "Unverify" : "Verify"}</button>
                    <button className={cx(s.btn, s.btnSm, s.btnDel)} onClick={() => del(p)}>Delete</button>
                  </div></td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={8} className={s.empty}>{profiles.length ? "No match." : "No photographers have joined yet. They appear here after “Join as a photographer” on the website."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Functions({ gigs, toast, updateGig, removeGig }) {
  const [q, setQ] = useState(""), [st, setSt] = useState("all");
  const list = gigs.filter((g) => (st === "all" || g.status === st) && (!q || [g.title, g.city, g.venue, g.type, g.by].join(" ").toLowerCase().includes(q.toLowerCase())))
    .slice().sort((a, b) => a.date.localeCompare(b.date));
  const reopen = async (g) => {
    try {
      await updateGig(g, { status: "open", photographer: null, photographerUid: null, confirmedAt: null });
      try {
        await sendNotificationEvent({ type: "booking_reopened", gigId: g.id }, auth.currentUser);
      } catch (error) {
        console.error("The function was reopened but its push notifications could not be sent.", error);
        toast("Function reopened, but its push notifications could not be sent.");
        return;
      }
      toast(`${g.title} is open again.`);
    } catch (error) { toast(`Could not reopen the function: ${error.message}`); }
  };
  const del = async (g) => {
    if (!window.confirm(`Delete “${g.title}”?`)) return;
    try {
      const result = await removeGig(g);
      toast(result.notificationSent === false && g.status === "confirmed"
        ? "Function deleted, but its push notification could not be delivered."
        : "Function deleted.");
    }
    catch (error) { toast(`Could not delete the function: ${error.message}`); }
  };
  return (
    <>
      <div className={s.top}><div><h2>Functions</h2><p>Functions posted on the website’s live board.</p></div></div>
      <div className={s.panel}>
        <div className={s.panelH}>
          <h3>Functions ({gigs.length})</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select className={s.search} style={{ minWidth: 140 }} value={st} onChange={(e) => setSt(e.target.value)}>
              <option value="all">All statuses</option><option value="open">Open</option><option value="confirmed">Confirmed</option>
            </select>
            <input className={s.search} placeholder="Search title, city…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className={s.tblWrap}>
          <table className={s.tbl}>
            <thead><tr><th>Function</th><th>Date</th><th>Location</th><th>Budget</th><th>Posted by</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.id}>
                  <td style={{ minWidth: 200 }}><b>{g.title}</b><br /><small className={s.muted}>{g.type} · {(g.needs || []).join(", ")}</small></td>
                  <td className={s.nowrap}>{new Date(g.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}<br /><small className={s.muted}>{g.time} · {g.hours} hrs</small></td>
                  <td>{g.venue}, <b>{g.city}</b></td>
                  <td className={s.nowrap}>{inr(g.budget)}</td>
                  <td>{g.by}</td>
                  <td>{g.status === "confirmed" ? <><span className={cx(s.pill, s.pOk)}>Confirmed</span><br /><small className={s.muted}>{g.photographer}</small></> : <span className={cx(s.pill, s.pOpen)}>Open</span>}</td>
                  <td><div className={s.acts}>
                    {g.status === "confirmed" && <button className={cx(s.btn, s.btnSm, s.btnG)} onClick={() => reopen(g)}>Reopen</button>}
                    <button className={cx(s.btn, s.btnSm, s.btnDel)} onClick={() => del(g)}>Delete</button>
                  </div></td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={7} className={s.empty}>{gigs.length ? "No match." : "No functions yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
