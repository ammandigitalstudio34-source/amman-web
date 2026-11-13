import { useEffect, useRef, useState } from "react";
import { useApp } from "../AppContext";
import { CITY_NAMES, TYPES, day } from "../data";
import { daysUntil, scrollToId } from "../utils";
import { Arrow, Check } from "./Icons";

const NEEDS = [["Photo", "Photography"], ["Video", "Videography"], ["Drone", "Drone"], ["Candid", "Candid"], ["Album", "Album design"]];
const blank = (city) => ({ title: "", type: "Wedding", city, venue: "", date: day(7), time: "10:00", hours: 4, budget: "", needs: ["Photo"], name: "", phone: "", notes: "" });

export default function PostFunction() {
  const { city, authUser, signInWithGoogle, setLocation, addGig, setBoard, postPrefill, toast } = useApp();
  const [f, setF] = useState(() => blank(city));
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const refs = { title: useRef(null), venue: useRef(null), date: useRef(null), time: useRef(null), hours: useRef(null), budget: useRef(null), name: useRef(null), phone: useRef(null) };

  // prefill from hero search / categories / "Book Now"
  useEffect(() => {
    if (!postPrefill) return;
    const { focus, nonce, ...fields } = postPrefill; // eslint-disable-line no-unused-vars
    setF((cur) => {
      const next = { ...cur };
      for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== "") next[k] = v;
      if (next.date && daysUntil(next.date) < 0) next.date = day(7);
      return next;
    });
    if (focus) setTimeout(() => refs.title.current?.focus({ preventScroll: true }), 700);
  }, [postPrefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleNeed = (n) => setF({ ...f, needs: f.needs.includes(n) ? f.needs.filter((x) => x !== n) : [...f.needs, n] });

  const submit = async (e) => {
    e.preventDefault();
    if (!authUser) return toast("Sign in with Google before posting a function.");
    const missing = ["title", "venue", "date", "time", "hours", "budget", "name", "phone"].find((k) => !String(f[k]).trim());
    if (missing) { refs[missing].current?.focus(); return toast("Please fill in all the required details."); }
    if (f.phone.replace(/\D/g, "").length < 10) { refs.phone.current?.focus(); return toast("Please enter a valid 10-digit phone number."); }
    if (daysUntil(f.date) < 0) { refs.date.current?.focus(); return toast("The function date can't be in the past."); }
    const g = {
      id: Date.now(), title: f.title.trim(), type: f.type, city: f.city, venue: f.venue.trim(), date: f.date, time: f.time,
      hours: +f.hours, budget: +f.budget, needs: f.needs.length ? f.needs : ["Photo"], by: f.name.trim(),
      phone: f.phone, notes: f.notes.trim(), status: "open",
    };
    const signIn = async () => {
      setAuthBusy(true);
      setAuthError("");
      try { await signInWithGoogle(); }
      catch (error) { setAuthError(`Could not sign in: ${error.message}`); }
      finally { setAuthBusy(false); }
    };
    try {
      const saved = await addGig(g);
      if (!saved) return;
    } catch (error) {
      toast(`Could not post this function: ${error.message}`);
      return;
    }
    setLocation(g.city);
    setBoard({ type: "all", radius: "0", status: "open" });
    setF(blank(g.city));
    scrollToId("board");
    toast(`Posted! Photographers near ${g.city} are being alerted.`);
  };

  return (
    <section className="post" id="post">
      <div className="wrap split">
        <aside className="post-aside reveal">
          <span className="eyebrow">Post a function</span>
          <h2 style={{ marginTop: 10 }}>Can't make it?<br />Hand it over.</h2>
          <p className="lead" style={{ marginTop: 16 }}>Studios use EventSnap to keep a booking they'd otherwise lose. Families use it to find a photographer close to home.</p>
          <ul>
            {["Only ID-verified photographers with portfolios can confirm.", "Your phone number is shared only after a confirmation.", "Payment held safely until files are delivered.", "Free to post. 8% service fee only when a shoot is completed."]
              .map((t) => <li key={t}><Check size={20} sw={2.4} /><span>{t}</span></li>)}
          </ul>
        </aside>

        <form className="card reveal" id="postForm" onSubmit={submit} noValidate>
          <div className="form-grid">
            <div className="field full"><label htmlFor="fTitle">Function name</label><input id="fTitle" ref={refs.title} placeholder="e.g. Priya's Baby Shower" value={f.title} onChange={set("title")} /></div>
            <div className="field"><label htmlFor="fType">Function type</label><select id="fType" value={f.type} onChange={set("type")}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label htmlFor="fCity">Venue city</label><select id="fCity" value={f.city} onChange={set("city")}>{CITY_NAMES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field full"><label htmlFor="fVenue">Venue / area</label><input id="fVenue" ref={refs.venue} placeholder="e.g. Sri Murugan Mahal, RS Puram" value={f.venue} onChange={set("venue")} /></div>
            <div className="field"><label htmlFor="fDate">Date</label><input type="date" id="fDate" ref={refs.date} min={day(0)} value={f.date} onChange={set("date")} /></div>
            <div className="field"><label htmlFor="fTime">Start time</label><input type="time" id="fTime" ref={refs.time} value={f.time} onChange={set("time")} /></div>
            <div className="field"><label htmlFor="fHours">Duration (hours)</label><input type="number" id="fHours" ref={refs.hours} min="1" max="24" value={f.hours} onChange={set("hours")} /></div>
            <div className="field"><label htmlFor="fBudget">Budget (₹)</label><input type="number" id="fBudget" ref={refs.budget} min="500" step="100" placeholder="8000" value={f.budget} onChange={set("budget")} /></div>
            <div className="field full">
              <label>Coverage needed</label>
              <div className="chips">
                {NEEDS.map(([v, l]) => (
                  <label className="chip" key={v}><input type="checkbox" checked={f.needs.includes(v)} onChange={() => toggleNeed(v)} /><span>{l}</span></label>
                ))}
              </div>
            </div>
            <div className="field"><label htmlFor="fName">Your name / studio</label><input id="fName" ref={refs.name} placeholder="Ravi Studios" value={f.name} onChange={set("name")} /></div>
            <div className="field"><label htmlFor="fPhone">Phone</label><input id="fPhone" ref={refs.phone} type="tel" placeholder="98xxxxxx10" value={f.phone} onChange={set("phone")} /></div>
            <div className="field full">
              <label htmlFor="fNotes">Notes for the photographer <span style={{ fontWeight: 500, color: "var(--muted)" }}>(optional)</span></label>
              <textarea id="fNotes" placeholder="Dress code, key moments, raw file handover, etc." value={f.notes} onChange={set("notes")} />
            </div>
          </div>
          <div className="form-foot">
            <p>
              {authError && <span role="alert" style={{ display: "block", color: "#d93036" }}>{authError}</span>}
              By posting you agree that the confirming photographer may contact you about this function.
            </p>
            {authUser
              ? <button type="submit" className="btn btn-red">Post function <Arrow size={18} sw={2.4} /></button>
              : <button type="button" className="btn btn-red" onClick={signIn} disabled={authBusy}>
                {authBusy ? "Connecting to Google…" : "Sign in with Google to post"}
              </button>}
          </div>
        </form>
      </div>
    </section>
  );
}
