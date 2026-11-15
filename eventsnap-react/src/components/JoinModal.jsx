import { useEffect, useRef, useState } from "react";
import { useApp } from "../AppContext";
import { CITY_NAMES } from "../data";
import NotificationSettings from "./NotificationSettings";
import { fmtTime, initials, inr, readPhoto, scrollToId } from "../utils";
import { Arrow, Check } from "./Icons";

const TAGS = ["Wedding", "Birthday", "Events", "Portrait", "Baby Shoot", "Products"];
const EXPS = ["0–1 years", "1–3 years", "3–5 years", "5–10 years", "10+ years"];
const fmtPhone = (p) => String(p).replace(/(\d{5})(\d{5})/, "$1 $2");

function BookingList({ bookings, audience, onRespond, onDelete, respondingId, deletingId }) {
  if (!bookings.length) {
    return <p>No {audience === "photographer" ? "booking requests" : "bookings"} yet.</p>;
  }
  return (
    <ul>
      {bookings.map((booking) => {
        const status = booking.status === "confirmed" ? "Confirmed" : booking.status === "busy" ? "Busy" : "Pending";
        const date = booking.date
          ? new Date(`${booking.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : "";
        return (
          <li key={booking.id}>
            <b>{booking.title}</b>
            <span>{audience === "photographer"
              ? `Requested by ${booking.by || "EventSnap client"}`
              : `Photographer: ${booking.requestedPhotographerName || booking.photographer || "EventSnap photographer"}`}</span>
            <span>{booking.city} · {booking.venue}</span>
            <span>{date} · {fmtTime(booking.time)}</span>
            <em className={booking.status === "confirmed" ? "confirmed" : booking.status === "busy" ? "busy" : ""}>{status}</em>
            {audience === "customer" && booking.status === "confirmed" && (
              <span className="booking-response" role="status">
                {booking.photographer || booking.requestedPhotographerName || "The photographer"} confirmed your booking.
              </span>
            )}
            {audience === "customer" && booking.status === "busy" && (
              <span className="booking-response busy" role="status">
                {booking.photographer || booking.requestedPhotographerName || "The photographer"} is unavailable for this date. Please choose another date or photographer.
              </span>
            )}
            {audience === "photographer" && booking.status === "open" && (
              <div className="profile-booking-actions">
                <button type="button" onClick={() => onRespond(booking, "confirmed")} disabled={respondingId === booking.id}>
                  {respondingId === booking.id ? "Updating…" : "Confirm"}
                </button>
                <button type="button" onClick={() => onRespond(booking, "busy")} disabled={respondingId === booking.id}>
                  {respondingId === booking.id ? "Updating…" : "Busy"}
                </button>
              </div>
            )}
            <div className="profile-booking-actions">
              <button
                type="button"
                className="profile-delete-button"
                onClick={() => onDelete(booking, audience)}
                disabled={deletingId === booking.id}
              >
                {deletingId === booking.id ? "Deleting…" : "Delete booking"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function JoinModal() {
  const { joinOpen, setJoinOpen, city, authUser, authReady, signInWithGooglePopup, signOutGoogle, myProfile, gigs, conversations, isConversationUnread, selectConversation, createProfile, deleteMyProfile, deleteGig, respondToBooking, setFpFilter, setFpCity, setFpShowAll, setLocation, setBoard, toast } = useApp();
  const empty = () => ({ name: "", phone: "", city, area: "", tags: ["Wedding"], price: 5000, exp: "3–5 years" });
  const [step, setStep] = useState(1);
  const [f, setF] = useState(empty);
  const [bad, setBad] = useState({});
  const [isNew, setIsNew] = useState(false);
  const [photo, setPhoto] = useState("");
  const [createdProfile, setCreatedProfile] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [respondingId, setRespondingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const nameRef = useRef(null);

  // every time it opens: show your profile, or a fresh form
  useEffect(() => {
    if (!joinOpen || !authReady) return;
    if (myProfile) { setIsNew(false); setCreatedProfile(null); setStep(3); }
    else { setCreatedProfile(null); setStep(1); setBad({}); setF((cur) => ({ ...cur, city })); setTimeout(() => nameRef.current?.focus(), 60); }
    setAuthError("");
  }, [joinOpen, authReady, authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authUser) return;
    setF((current) => ({ ...current, name: current.name || authUser.displayName || "" }));
    setPhoto((current) => current || authUser.photoURL || "");
  }, [authUser]);

  useEffect(() => {
    if (!joinOpen) return;
    const k = (e) => e.key === "Escape" && setJoinOpen(false);
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k);
  }, [joinOpen, setJoinOpen]);

  if (!joinOpen) return null;
  const close = () => setJoinOpen(false);
  const set = (k) => (e) => setF({ ...f, [k]: k === "phone" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value });
  const toggleTag = (t) => setF({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] });
  const choosePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size >= 5 * 1024 * 1024) {
      toast("Profile photos must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }
    try { setPhoto(await readPhoto(file)); }
    catch (error) { toast(error.message); }
    e.target.value = "";
  };
  const googleSignIn = async () => {
    setAuthBusy(true);
    setAuthError("");
    try { await signInWithGooglePopup(); }
    catch (error) { setAuthError(`Could not sign in: ${error.message}`); }
    finally { setAuthBusy(false); }
  };
  const googleSignOut = async () => {
    try { await signOutGoogle(); close(); }
    catch (error) { toast(`Could not sign out: ${error.message}`); }
  };

  const next = (e) => {
    e.preventDefault();
    const b = {
      name: f.name.trim().length < 3, phone: !/^[6-9]\d{9}$/.test(f.phone),
      area: f.area.trim().length < 2, tags: f.tags.length === 0,
    };
    setBad(b);
    const first = Object.keys(b).find((k) => b[k]);
    if (first) { document.getElementById("j" + first[0].toUpperCase() + first.slice(1))?.focus(); return; }
    setStep(2);
  };
  const create = async () => {
    try {
      const saved = await createProfile({
        name: f.name.trim(), phone: f.phone, city: f.city, area: f.area.trim(), tags: f.tags, photo,
        price: Math.max(500, +f.price || 5000), exp: f.exp,
      });
      if (!saved) return;
      setCreatedProfile(saved);
    } catch (error) {
      toast(`Could not create your profile: ${error.message}`);
      return;
    }
    setIsNew(true); setStep(3);
    toast(`Welcome ${f.name.trim()}! Your photographer profile is live.`);
  };
  const resetForm = () => { setF(empty()); setBad({}); setPhoto(""); setCreatedProfile(null); };

  const seeCard = () => { close(); setFpFilter("All"); setFpShowAll(false); setFpCity(p.city); scrollToId("photographers"); };
  const findWork = () => { close(); setLocation(p.city); setBoard({ type: "all", radius: "0", status: "open" }); scrollToId("board"); };
  const del = async () => {
    if (!window.confirm("Delete your photographer profile?")) return;
    try {
      await deleteMyProfile(p.id);
      resetForm(); close(); toast("Your profile has been deleted.");
    } catch (error) {
      toast(`Could not delete your profile: ${error.message}`);
    }
  };

  const p = myProfile || createdProfile;
  const profileBookings = p
    ? gigs.filter((gig) => gig.requestedPhotographerUid === (p.ownerUid || p.id))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    : [];
  const profileConversations = p
    ? conversations.filter((conversation) => conversation.photographerUid === (p.ownerUid || p.id))
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
    : [];
  const unreadMessages = profileConversations.filter(isConversationUnread).length;
  const customerBookings = authUser
    ? gigs.filter((gig) => gig.ownerUid === authUser.uid && gig.requestedPhotographerUid)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    : [];
  const respond = async (booking, decision) => {
    setRespondingId(booking.id);
    try {
      await respondToBooking(booking, decision);
      toast(decision === "confirmed"
        ? `Confirmed ${booking.title}. Other requests for that date are marked busy.`
        : `Marked ${booking.title} and other requests for that date busy.`);
    } catch (error) {
      toast(`Could not update this booking: ${error.message}`);
    } finally {
      setRespondingId(null);
    }
  };
  const removeBooking = async (booking, audience) => {
    const item = audience === "photographer" ? "booking request" : "booking";
    const otherParty = audience === "photographer" ? "customer" : "photographer";
    if (!window.confirm(`Delete this ${item}? It will be removed for both you and the ${otherParty}.`)) return;
    setDeletingId(booking.id);
    try {
      const result = await deleteGig(booking);
      toast(result.notificationSent === false && booking.status === "confirmed"
        ? "Booking deleted, but its push notification could not be delivered."
        : "Booking deleted.");
    } catch (error) {
      toast(`Could not delete this booking: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };
  const err = (k, msg) => <span className="jm-err">{msg}</span>;

  return (
    <div className="modal-bg open" role="dialog" aria-modal="true" aria-labelledby="jTitle" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="jm">
        <button className="jm-x" aria-label="Close" onClick={close}>×</button>
        <div className="jm-steps">
          {["1 · Details", "2 · Confirm", "3 · Profile"].map((s, i) => <span key={s} className={i + 1 <= step ? "on" : ""}>{s}</span>)}
        </div>

        {step === 1 && !authReady && (
          <div>
            <h3 id="jTitle">Checking your <span>account</span></h3>
            <p className="sub">Checking your Google sign-in status…</p>
          </div>
        )}

        {step === 1 && authReady && !authUser && (
          <div>
            <h3 id="jTitle">Join as a <span>Photographer</span></h3>
            <p className="sub">Sign in with Google to create and manage your photographer profile.</p>
            {authError && <p role="alert" style={{ color: "#d93036", fontWeight: 600 }}>{authError}</p>}
            <div className="jm-actions">
              <button type="button" className="jm-primary" onClick={googleSignIn} disabled={authBusy}>
                {authBusy ? "Connecting to Google…" : "Continue with Google"}
              </button>
            </div>
          </div>
        )}

        {step === 1 && authReady && authUser && (
          <form onSubmit={next} noValidate>
            <NotificationSettings user={authUser} />
            <section className="profile-bookings" aria-labelledby="customerBookingsTitle">
              <h4 id="customerBookingsTitle">My bookings <span>{customerBookings.length}</span></h4>
              <BookingList bookings={customerBookings} audience="customer" onDelete={removeBooking} deletingId={deletingId} />
            </section>
            <h3 id="jTitle">Join as a <span>Photographer</span></h3>
            <p className="sub">Get alerts for functions near you. It takes less than a minute.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button type="button" className="jm-del" onClick={googleSignOut}>Log out</button>
            </div>
            <div className="field full">
              <label htmlFor="jPhoto">Profile photo <span style={{ fontWeight: 500, color: "var(--muted)" }}>(optional)</span></label>
              <input id="jPhoto" type="file" accept="image/*" onChange={choosePhoto} />
              {photo && <img src={photo} alt="Profile preview" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", marginTop: 8 }} />}
              {photo && <button type="button" className="jm-del" onClick={() => setPhoto(authUser.photoURL || "")}>
                {authUser.photoURL ? "Use Google photo instead" : "Remove photo"}
              </button>}
            </div>
            <div className="form-grid">
              <div className={"field full" + (bad.name ? " bad" : "")}>
                <label htmlFor="jName">Full name / studio name</label>
                <input id="jName" ref={nameRef} placeholder="e.g. Arun Photography" autoComplete="name" value={f.name} onChange={set("name")} />
                {err("name", "Please enter your name (at least 3 letters).")}
              </div>
              <div className={"field full" + (bad.phone ? " bad" : "")}>
                <label htmlFor="jPhone">Mobile number</label>
                <div className="jm-phone"><b>+91</b><input id="jPhone" type="tel" inputMode="numeric" maxLength={10} value={f.phone} onChange={set("phone")} /></div>
                {err("phone", "Enter a valid 10-digit mobile number.")}
              </div>
              <div className="field">
                <label htmlFor="jCity">Location (city)</label>
                <select id="jCity" value={f.city} onChange={set("city")}>{CITY_NAMES.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
              <div className={"field" + (bad.area ? " bad" : "")}>
                <label htmlFor="jArea">Area</label>
                <input id="jArea" placeholder="e.g. Tambaram" value={f.area} onChange={set("area")} />
                {err("area", "Enter your area.")}
              </div>
              <div className={"field full" + (bad.tags ? " bad" : "")}>
                <label>What do you shoot?</label>
                <div className="chips">
                  {TAGS.map((t) => <label className="chip" key={t}><input type="checkbox" checked={f.tags.includes(t)} onChange={() => toggleTag(t)} /><span>{t}</span></label>)}
                </div>
                {err("tags", "Pick at least one.")}
              </div>
              <div className="field"><label htmlFor="jPrice">Price per event (₹)</label><input id="jPrice" type="number" min="500" step="500" value={f.price} onChange={set("price")} /></div>
              <div className="field"><label htmlFor="jExp">Experience</label><select id="jExp" value={f.exp} onChange={set("exp")}>{EXPS.map((x) => <option key={x}>{x}</option>)}</select></div>
            </div>
            <div className="jm-actions"><button type="submit" className="jm-primary">Continue <Arrow size={18} /></button></div>
          </form>
        )}

        {step === 2 && (
          <div>
            <h3>Confirm your <span>details</span></h3>
            <p className="sub">Please check everything before we create your profile.</p>
            <dl className="jm-sum">
              <div><dt>Name</dt><dd>{f.name.trim()}</dd></div>
              <div><dt>Mobile no</dt><dd>+91 {fmtPhone(f.phone)}</dd></div>
              <div><dt>Location</dt><dd>{f.area.trim()}, {f.city}</dd></div>
              <div><dt>Shoots</dt><dd>{f.tags.join(", ")}</dd></div>
              <div><dt>Price</dt><dd>{inr(Math.max(500, +f.price || 5000))} / event</dd></div>
              <div><dt>Experience</dt><dd>{f.exp}</dd></div>
            </dl>
            <div className="jm-note">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ flex: "none", marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16.5v.5" strokeLinecap="round" /></svg>
              Your mobile number is shared with a client only after you confirm their function.
            </div>
            <div className="jm-actions">
              <button type="button" className="jm-ghost" onClick={() => setStep(1)}>← Edit</button>
              <button type="button" className="jm-primary" onClick={create}><Check size={18} sw={2.8} />Confirm &amp; Create Profile</button>
            </div>
          </div>
        )}

        {step === 3 && p && (
          <div className="jm-done">
            <div className="jm-ok"><Check size={38} sw={3} style={{ color: "#fff" }} /></div>
            <h3>{isNew ? <>Profile <span>created!</span></> : <>Your <span>profile</span></>}</h3>
            <p className="sub" style={{ marginBottom: 0 }}>Welcome to EventSnap. You'll get alerts for functions near you.</p>
            <div className="jm-card">
              <div className="jm-av">{p.photo ? <img src={p.photo} alt="" /> : initials(p.name)}<i /></div>
              <div style={{ minWidth: 0 }}>
                <b>{p.name} <span className="jm-badge" style={p.verified ? { background: "#22b35e" } : null}>{p.verified ? "VERIFIED" : "PENDING VERIFICATION"}</span></b>
                <div className="m">+91 {fmtPhone(p.phone)} · {p.area}, {p.city}</div>
                <div className="m">{inr(p.price)} / event · {p.exp} experience</div>
                <div className="tg">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
              </div>
            </div>
            <NotificationSettings user={authUser} />
            <section className="profile-bookings" aria-labelledby="profileMessagesTitle">
              <h4 id="profileMessagesTitle">Messages <span>{unreadMessages}</span></h4>
              {!profileConversations.length
                ? <p>No customer messages yet.</p>
                : <ul className="profile-message-list">
                  {profileConversations.map((conversation) => {
                    const unread = isConversationUnread(conversation);
                    return (
                      <li key={conversation.id} className={unread ? "profile-message-unread" : ""}>
                        <b>{conversation.customerName || "Customer"}</b>
                        <span>{conversation.lastMessageText || "No messages yet"}</span>
                        <time>{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : ""}</time>
                        {unread && <em className="profile-message-new">New</em>}
                        <div className="profile-booking-actions">
                          <button type="button" onClick={() => { close(); selectConversation(conversation); }}>Open chat</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>}
            </section>
            <section className="profile-bookings" aria-labelledby="profileBookingsTitle">
              <h4 id="profileBookingsTitle">Booking requests <span>{profileBookings.length}</span></h4>
              <BookingList bookings={profileBookings} audience="photographer" onRespond={respond} onDelete={removeBooking} respondingId={respondingId} deletingId={deletingId} />
            </section>
            <section className="profile-bookings" aria-labelledby="customerBookingsProfileTitle">
              <h4 id="customerBookingsProfileTitle">My bookings <span>{customerBookings.length}</span></h4>
              <BookingList bookings={customerBookings} audience="customer" onDelete={removeBooking} deletingId={deletingId} />
            </section>
            <div className="jm-actions">
              <button type="button" className="jm-ghost" onClick={seeCard}>View my card</button>
              <button type="button" className="jm-primary" onClick={findWork}>Find functions near me</button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 22, flexWrap: "wrap" }}>
              <button type="button" className="jm-del" onClick={del}>Delete my profile</button>
              <button type="button" className="jm-del" onClick={googleSignOut}>Sign out of Google</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
