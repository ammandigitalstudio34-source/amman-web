import { useMemo, useRef, useState } from "react";
import { useApp } from "../AppContext";
import { CITY_NAMES, TYPES, day } from "../data";
import { useImageExists } from "../utils";
import { Arrow, Bolt, PinOutline, Pin, Search, Shield, Star } from "./Icons";

export default function Hero() {
  const { city, setLocation, showCityPhotographers, prefillPost } = useApp();
  const [type, setType] = useState("Wedding");
  const [date, setDate] = useState(day(8));
  const dateRef = useRef(null);
  const hasPhoto = useImageExists("/hero.jpg");

  // fairy-light bokeh shown until public/hero.jpg exists
  const bokeh = useMemo(() => Array.from({ length: 42 }, () => {
    const s = 6 + Math.random() * 34;
    return { left: Math.random() * 100 + "%", top: Math.random() * 95 + "%", width: s, height: s, "--d": 2 + Math.random() * 3 + "s", "--dl": -Math.random() * 4 + "s" };
  }), []);

  const dateText = date ? new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Pick a date";

  const submit = (e) => {
    e.preventDefault();
    prefillPost({ city, type, date }, { scroll: false, focus: false });
    showCityPhotographers(city, type, true);
  };
  const onCity = (c) => { setLocation(c); showCityPhotographers(c, type, false); };

  return (
    <section className={"es-hero" + (hasPhoto ? " has-photo" : "")} id="top">
      <div className="es-bg" aria-hidden="true" />
      <div className="es-bokeh" aria-hidden="true">{bokeh.map((s, i) => <span key={i} style={s} />)}</div>
      <div className="es-shade" aria-hidden="true" />

      <div className="es-content">
        <a href="#board" className="es-chip"><Pin />Find Photographers Near You<Arrow /></a>
        <h1>
          Plan Your Event,<br /><span className="p">Find</span> the Perfect<br />
          <span className="es-ul">Photographer!
            <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true"><path d="M3 17C70 6 190 1 297 8" fill="none" stroke="#8b45ff" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>
          </span>
        </h1>
        <p className="es-sub">From weddings to birthdays – discover, compare and book trusted photographers near your location.</p>

        <form className="es-search" onSubmit={submit}>
          <div className="es-f">
            <Pin size={30} />
            <div className="w"><label htmlFor="hsCity">Your Location</label>
              <select id="hsCity" value={city} onChange={(e) => onCity(e.target.value)}>
                {CITY_NAMES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="es-f">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" /><g fill="currentColor" stroke="none"><circle cx="8" cy="14" r="1.1" /><circle cx="12" cy="14" r="1.1" /><circle cx="16" cy="14" r="1.1" /><circle cx="8" cy="17.5" r="1.1" /><circle cx="12" cy="17.5" r="1.1" /><circle cx="16" cy="17.5" r="1.1" /></g></svg>
            <div className="w es-date"><label htmlFor="hsDate">Event Date</label>
              <input type="date" id="hsDate" ref={dateRef} min={day(0)} value={date} onChange={(e) => setDate(e.target.value)}
                onClick={() => { try { dateRef.current.showPicker(); } catch { /* not supported */ } }} />
              <span className="es-val">{dateText}</span>
            </div>
          </div>
          <div className="es-f">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /></svg>
            <div className="w"><label htmlFor="hsType">Event Type</label>
              <select id="hsType" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="es-btn"><Search size={24} sw={2.8} />Find Photographers<Arrow /></button>
        </form>
      </div>

      <div className="es-script" aria-hidden="true">
        <svg className="heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M12 21C5 15.5 2 12.2 2 8.3 2 5.4 4.3 3 7.1 3c2 0 3.7 1.1 4.9 3 1.2-1.9 2.9-3 4.9-3C19.7 3 22 5.4 22 8.3c0 3.9-3 7.2-10 12.7z" /></svg>
        Capture<span className="l2">Happiness...</span>
        <svg className="line" viewBox="0 0 240 30" preserveAspectRatio="none"><path d="M4 26C70 12 150 5 236 3" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" /></svg>
      </div>

      <div className="es-trust">
        <div className="es-t"><Shield size={44} /><span>Trusted<br />Professionals</span></div>
        <div className="es-t"><Star size={44} /><span>Real Reviews<br />&amp; Ratings</span></div>
        <div className="es-t"><Bolt size={44} /><span>Instant<br />Booking</span></div>
        <div className="es-t"><PinOutline size={44} /><span>Nearby<br />Photographers</span></div>
      </div>

      <svg className="es-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 30C300 70 620 6 960 22c200 10 340 34 480 8V90H0z" fill="#1c1822" opacity=".9" />
        <path d="M0 62C360 92 700 44 1040 56c170 6 290 22 400 12V90H0z" fill="#f8f5fe" />
      </svg>
    </section>
  );
}
