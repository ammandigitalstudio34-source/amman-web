import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { CITY_NAMES, TYPES } from "../data";
import { daysUntil, fmtTime, inr, km } from "../utils";

function GigCard({ g, onConfirm }) {
  const d = new Date(g.date + "T00:00:00"), du = daysUntil(g.date);
  const when = du === 0 ? "Today" : du === 1 ? "Tomorrow" : `In ${du} days`;
  const urgent = g.status === "open" && du <= 3;
  const confirmed = g.status === "confirmed";
  return (
    <article className={"gig" + (confirmed ? " is-confirmed" : "")}>
      <div className="gig-date">
        <span className="m">{d.toLocaleString("en-IN", { month: "short" })}</span>
        <span className="d">{d.getDate()}</span>
        <span className="w">{d.toLocaleString("en-IN", { weekday: "short" })}</span>
      </div>
      <div className="gig-body">
        <div className="gig-tags">
          <span className="tag">{g.type}</span>
          <span className={"tag" + (urgent ? " urgent" : "")}>{when}</span>
        </div>
        <h3>{g.title}</h3>
        <div className="loc">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
          {g.city} · {g.venue}
        </div>
        <div className="loc" style={{ marginTop: 2 }}>
          <span className="dist">{g.dist === 0 ? "In your city" : g.dist + " km away"}</span> · {fmtTime(g.time)} · {g.hours} hrs
        </div>
        <div className="needs">{(g.needs || []).map((n) => <span key={n}>{n}</span>)}</div>
        <div className="gig-foot">
          <div className="price">{inr(g.budget)}<small>Posted by {g.by}</small></div>
          {confirmed
            ? <div className="confirmed-by">✓ {g.photographer}<br /><span style={{ fontWeight: 500, color: "var(--muted)" }}>is attending</span></div>
            : <button className="btn btn-dark btn-sm" onClick={() => onConfirm(g)}>Confirm &amp; attend</button>}
        </div>
      </div>
    </article>
  );
}

function ConfirmModal({ gig, onClose }) {
  const { authUser, myProfile, signInWithGoogle, setJoinOpen, confirmGig, toast } = useApp();
  const [agree, setAgree] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!agree) return toast("Please accept the attendance commitment.");
    try {
      const privateGig = await confirmGig(gig);
      if (!privateGig) return;
      onClose();
      toast(`Confirmed! ${gig.title} is yours.${privateGig.phone ? ` Contact: +91 ${privateGig.phone}` : ""}`);
    } catch (error) {
      toast(error.code === "permission-denied"
        ? "Sorry — this function was just taken."
        : `Could not confirm this function: ${error.message}`);
    }
  };
  const signIn = async () => {
    setAuthBusy(true);
    setAuthError("");
    try { await signInWithGoogle(); }
    catch (error) { setAuthError(`Could not sign in: ${error.message}`); }
    finally { setAuthBusy(false); }
  };

  return (
    <div className="modal-bg open" role="dialog" aria-modal="true" aria-labelledby="mTitle" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {!authUser ? (
        <div className="modal">
          <span className="eyebrow">Confirm &amp; attend</span>
          <h3 id="mTitle" style={{ marginTop: 6 }}>Sign in to continue</h3>
          <p>Sign in with Google using your verified photographer account to confirm this function.</p>
          {authError && <p role="alert" style={{ color: "#d93036" }}>{authError}</p>}
          <div className="actions">
            <button type="button" className="btn btn-sm" style={{ background: "var(--paper-2)" }} onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-red btn-sm" onClick={signIn} disabled={authBusy}>
              {authBusy ? "Connecting…" : "Sign in with Google"}
            </button>
          </div>
        </div>
      ) : !myProfile?.verified ? (
        <div className="modal">
          <span className="eyebrow">Confirm &amp; attend</span>
          <h3 id="mTitle" style={{ marginTop: 6 }}>Verified profile required</h3>
          <p>Create a photographer profile and wait for admin verification before confirming functions.</p>
          <div className="actions">
            <button type="button" className="btn btn-sm" style={{ background: "var(--paper-2)" }} onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-red btn-sm" onClick={() => { onClose(); setJoinOpen(true); }}>Open profile</button>
          </div>
        </div>
      ) : (
        <form className="modal" onSubmit={submit} noValidate>
          <span className="eyebrow">Confirm &amp; attend</span>
          <h3 id="mTitle" style={{ marginTop: 6 }}>Lock this function</h3>
          <div className="summary">
            <b>{gig.title}</b><br />{gig.city} · {gig.venue}<br />
            {new Date(gig.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {fmtTime(gig.time)} · {gig.hours} hrs<br />
            <span style={{ color: "var(--red)", fontWeight: 700 }}>{inr(gig.budget)}</span>{" "}
            <span style={{ color: "var(--muted)" }}>· you receive {inr(Math.round(gig.budget * 0.92))}</span>
          </div>
          <p>Confirm as <b>{myProfile.name}</b>.</p>
          <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I will attend on time, follow the brief and deliver raw files within 48 hours.</label>
          <div className="actions">
            <button type="button" className="btn btn-sm" style={{ background: "var(--paper-2)" }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-red btn-sm">Confirm &amp; attend</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Board() {
  const { city, authUser, setLocation, gigs, board, setBoard } = useApp();
  const [confirmGig, setConfirmGig] = useState(null);
  const radius = +board.radius;

  const list = gigs
    .filter((g) => daysUntil(g.date) >= 0)
    .filter((g) => !g.requestedPhotographerUid || g.requestedPhotographerUid === authUser?.uid)
    .map((g) => ({ ...g, dist: km(city, g.city) }))
    .filter((g) => board.status === "all" || g.status === board.status)
    .filter((g) => board.type === "all" || g.type === board.type)
    .filter((g) => g.dist <= radius)
    .sort((a, b) => a.dist - b.dist || a.date.localeCompare(b.date));

  const statusWord = board.status === "confirmed" ? "confirmed " : board.status === "open" ? "open " : "";

  return (
    <section className="board" id="board">
      <div className="wrap">
        <div className="section-head reveal">
          <div><span className="eyebrow">Live function board</span><h2>Functions waiting<br />for a photographer.</h2></div>
          <p className="lead">Choose a city to see only the functions there. Widen “Show” to include nearby cities, sorted by distance.</p>
        </div>

        <div className="toolbar">
          <div className="field-inline">
            <label htmlFor="myCity">I'm currently in</label>
            <select id="myCity" value={city} onChange={(e) => setLocation(e.target.value)}>{CITY_NAMES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="field-inline">
            <label htmlFor="typeFilter">Function type</label>
            <select id="typeFilter" value={board.type} onChange={(e) => setBoard({ ...board, type: e.target.value })}>
              <option value="all">All types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field-inline">
            <label htmlFor="radius">Show</label>
            <select id="radius" value={board.radius} onChange={(e) => setBoard({ ...board, radius: e.target.value })}>
              <option value="0">Only this city</option>
              <option value="50">Within 50 km</option>
              <option value="150">Within 150 km</option>
              <option value="300">Within 300 km</option>
              <option value="9999">All cities</option>
            </select>
          </div>
          <div className="tabs" role="tablist">
            {[["open", "Open"], ["confirmed", "Confirmed"], ["all", "All"]].map(([k, l]) => (
              <button key={k} className={"tab" + (board.status === k ? " active" : "")} onClick={() => setBoard({ ...board, status: k })}>{l}</button>
            ))}
          </div>
        </div>

        <div className="gig-grid">
          {list.length ? list.map((g) => <GigCard key={g.id} g={g} onConfirm={setConfirmGig} />) : (
            <div className="empty">
              <b style={{ color: "var(--paper)", fontFamily: "var(--serif)", fontSize: "1.3rem" }}>
                {radius === 0 ? `No ${statusWord}functions in ${city} right now.` : "No functions match these filters."}
              </b><br />
              {radius === 0 ? <>Choose <b>Within 50 km</b> or <b>All cities</b> under “Show” to see functions near {city}.</> : "Try a wider distance or another function type."}
            </div>
          )}
        </div>
      </div>
      {confirmGig && <ConfirmModal gig={confirmGig} onClose={() => setConfirmGig(null)} />}
    </section>
  );
}
