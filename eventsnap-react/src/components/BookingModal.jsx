import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { CITIES, CITY_NAMES, TAG_TO_TYPE, day } from "../data";
import { daysUntil } from "../utils";
import { Arrow } from "./Icons";

export default function BookingModal() {
  const { bookingWith: profile, closeBooking, authUser, signInWithGooglePopup, addGig, gigs, toast } = useApp();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      title: "",
      city: CITIES[profile.city] ? profile.city : "Chennai",
      venue: "",
      date: day(7),
      time: "10:00",
    });
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) closeBooking();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [profile, busy, closeBooking]);

  if (!profile || !form) return null;

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.venue.trim() || !form.date || !form.time) {
      toast("Please enter the function name, location, date and time.");
      return;
    }
    if (daysUntil(form.date) < 0) {
      toast("The function date can't be in the past.");
      return;
    }
    if (profile.busyDates?.includes(form.date) || gigs.some((gig) => (
      gig.requestedPhotographerUid === (profile.ownerUid || profile.id)
      && gig.date === form.date
      && (gig.status === "confirmed" || gig.status === "busy")
    ))) {
      toast(`${profile.n} is unavailable on that date. Please choose another date.`);
      return;
    }

    setBusy(true);
    try {
      const customer = authUser || await signInWithGooglePopup();
      const saved = await addGig({
        title: form.title.trim(),
        type: TAG_TO_TYPE[profile.tags?.[0]] || profile.tags?.[0] || "Wedding",
        city: form.city,
        venue: form.venue.trim(),
        date: form.date,
        time: form.time,
        hours: 4,
        budget: Math.max(500, Number(profile.price) || 5000),
        needs: ["Photo"],
        by: customer.displayName || customer.email || "EventSnap client",
        requestedPhotographerUid: profile.ownerUid || profile.id,
        requestedPhotographerName: profile.n,
        phone: "",
        notes: "",
        status: "open",
      });
      if (!saved) return;
      closeBooking();
      toast(`Booking request sent to ${profile.n}. It will appear in their profile.`);
    } catch (error) {
      toast(`Could not book ${profile.n}: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg open" role="dialog" aria-modal="true" aria-labelledby="bookingTitle" onClick={(event) => event.target === event.currentTarget && !busy && closeBooking()}>
      <form className="booking-modal" onSubmit={submit} noValidate>
        <button type="button" className="jm-x" aria-label="Close booking form" onClick={closeBooking} disabled={busy}>×</button>
        <span className="eyebrow">Book a photographer</span>
        <h3 id="bookingTitle">Function details for <span>{profile.n}</span></h3>
        <p className="sub">Add the event details and send a booking request directly to this photographer.</p>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="bookingTitleInput">Function name</label>
            <input id="bookingTitleInput" autoFocus maxLength={100} placeholder="e.g. Priya's Wedding" value={form.title} onChange={set("title")} />
          </div>
          <div className="field">
            <label htmlFor="bookingCity">City</label>
            <select id="bookingCity" value={form.city} onChange={set("city")}>{CITY_NAMES.map((city) => <option key={city}>{city}</option>)}</select>
          </div>
          <div className="field">
            <label htmlFor="bookingVenue">Venue / area</label>
            <input id="bookingVenue" maxLength={120} placeholder="e.g. T. Nagar" value={form.venue} onChange={set("venue")} />
          </div>
          <div className="field">
            <label htmlFor="bookingDate">Date</label>
            <input id="bookingDate" type="date" min={day(0)} value={form.date} onChange={set("date")} />
          </div>
          <div className="field">
            <label htmlFor="bookingTime">Time</label>
            <input id="bookingTime" type="time" value={form.time} onChange={set("time")} />
          </div>
        </div>
        <p className="booking-price">Photographer's listed price: <b>₹{(Number(profile.price) || 5000).toLocaleString("en-IN")}</b> per event</p>
        <div className="jm-actions">
          <button type="button" className="jm-ghost" onClick={closeBooking} disabled={busy}>Cancel</button>
          <button type="submit" className="jm-primary" disabled={busy}>
            {busy ? "Sending request…" : authUser ? "Book now" : "Continue with Google"}
            {!busy && <Arrow size={18} />}
          </button>
        </div>
        {!authUser && <p className="booking-signin">Sign in with Google to send your booking request.</p>}
      </form>
    </div>
  );
}
