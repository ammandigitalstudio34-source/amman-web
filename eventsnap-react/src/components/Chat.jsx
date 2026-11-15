import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "../AppContext";
import { dayLabel, hhmm, inr } from "../utils";
import { Send } from "./Icons";

/* No automatic replies: a message appears only when someone really sends it
   (the customer here, the photographer from their own profile, or the admin page). */
export default function Chat() {
  const {
    authUser, signInAsGuest, chatWith: p, closeChat, conversations, selectedConversation, messages, selectConversation, returnToInbox,
    sendChat, markSeen, bookPhotographer, toast,
  } = useApp();
  const [text, setText] = useState("");
  const bodyRef = useRef(null), inputRef = useRef(null);
  const list = messages;

  useEffect(() => { if (p && (!p.mine || selectedConversation)) setTimeout(() => inputRef.current?.focus(), 80); }, [p?.n, selectedConversation?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedConversation) markSeen().catch((error) => toast(`Could not update message status: ${error.message}`));
  }, [selectedConversation?.id, list.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [list.length, p?.n]);
  useEffect(() => {
    if (!p) return;
    const k = (e) => e.key === "Escape" && closeChat();
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k);
  }, [p, closeChat]);

  if (!p) return null;
  const phone = p.phone ? String(p.phone).replace(/\D/g, "") : "";
  const hello = encodeURIComponent(`Hi ${p.n}, I found you on EventSnap. I'd like to book you for a function.`);
  const note = p.mine ? "This is your inbox — messages customers send to your profile appear here."
    : phone ? "Tap WhatsApp or Call above to reach this photographer directly." : "";
  const quick = p.mine
    ? ["Yes, I'm available on that date 👍", `My price is ${inr(p.price)} per event.`, "Please share the venue and timing.", "Sorry, I'm already booked that day."]
    : ["Are you available on my date?", "What is your price?", "Can you share your portfolio?", "Do you do video / drone?", "Where are you based?"];
  const send = async (value) => {
    try {
      await sendChat(value);
      setText("");
    } catch (error) {
      toast(`Could not send this message: ${error.message}`);
    }
  };
  const inbox = p.mine && !selectedConversation;
  const photographerThreads = conversations.filter((conversation) => conversation.photographerUid === p.ownerUid);

  let lastDay = "";
  return (
    <div className="chat-bg open" onClick={(e) => e.target === e.currentTarget && closeChat()}>
      <div className="chat" role="dialog" aria-modal="true" aria-labelledby="chatName">
        <header className="chat-head">
          <div className="chat-av">
            {p.photo ? <img src={p.photo} alt="" /> : <svg width="42" height="42" viewBox="0 0 60 60" style={{ "--skin": p.skin, "--hair": p.hair, "--shirt": p.shirt }}><use href="#headshot" /></svg>}
          </div>
          <div className="chat-who">
            <b id="chatName">{inbox ? `${p.n} · Inbox` : p.mine ? selectedConversation.customerName || "Customer" : p.n}</b>
            <span><i /><em>{inbox ? "Your private customer conversations" : p.mine ? `Replying as ${p.n}` : `${p.loc}, ${p.city} · usually replies within a few hours`}</em></span>
          </div>
          <div className="chat-acts">
            {p.mine && selectedConversation && <button type="button" aria-label="Back to inbox" onClick={returnToInbox}>←</button>}
            {phone && !p.mine && <>
              <a href={`https://wa.me/91${phone}?text=${hello}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2s-1 .3-3.4-.7a11.6 11.6 0 0 1-4.7-4.2c-.4-.6-1-1.7-1-3s.7-1.9 1-2.2.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.2-.3.3-.1.6a8.5 8.5 0 0 0 1.6 2 7.8 7.8 0 0 0 2.3 1.4c.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3s0 .7-.1 1.3z" /></svg>
              </a>
              <a href={`tel:+91${phone}`} title="Call" aria-label="Call">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" /></svg>
              </a>
            </>}
            {!p.mine && (
              <button type="button" title="Book Now" aria-label={`Book ${p.n}`} onClick={() => { const ph = p; closeChat(); bookPhotographer(ph); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>
          <button className="chat-x" aria-label="Close chat" onClick={closeChat}>×</button>
        </header>
        {note && !inbox && <div className="chat-note">{note}</div>}
        <div className="chat-body" ref={bodyRef} aria-live="polite">
          {inbox ? (
            photographerThreads.length
              ? photographerThreads.map((conversation) => (
                <button className="chat-inbox-item" key={conversation.id} type="button" onClick={() => selectConversation(conversation)}>
                  <b>{conversation.customerName || "Customer"}</b>
                  <span>{conversation.lastMessageText || "No messages yet"}</span>
                  <time>{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : ""}</time>
                </button>
              ))
              : <div className="chat-empty"><b>No messages yet</b>Customer messages to your profile will appear here.</div>
          ) : !list.length && (
            <div className="chat-empty"><b>Start the conversation</b>Send a message to {p.n}.</div>
          )}
          {!inbox && list.map((m, i) => {
            const d = dayLabel(m.t), showDay = d !== lastDay; lastDay = d;
            return (
              <div key={m.id || i} style={{ display: "contents" }}>
                {showDay && <div className="chat-day">{d}</div>}
                <div className={"msg " + (m.from === "me" ? "me" : "them")}>
                  {m.text.split("\n").map((line, j) => <span key={j}>{j > 0 && <br />}{line}</span>)}
                  <time>{hhmm(m.t)}</time>
                </div>
              </div>
            );
          })}
        </div>
        {!inbox && <>
          <div className="chat-quick">{quick.map((q) => <button type="button" key={q} onClick={() => send(q)}>{q}</button>)}</div>
          <form className="chat-form" autoComplete="off" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input ref={inputRef} placeholder={p.mine ? "Reply to your customer…" : "Type a message…"} maxLength={500} aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} />
            <button type="submit" aria-label="Send"><Send /></button>
          </form>
          {!authUser && (
            <div className="chat-signin">
              <p role="status">Guest chat is enabled — your message will be sent publicly.</p>
              <button type="button" onClick={() => signInAsGuest().catch((error) => toast(`Could not continue as guest: ${error.message}`))}>
                Continue as guest
              </button>
            </div>
          )}
        </>}
      </div>
    </div>
  );
}
