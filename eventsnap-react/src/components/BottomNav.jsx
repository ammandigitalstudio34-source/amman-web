import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { CITY_NAMES } from "../data";
import { daysUntil, goPage, initials, nearestCity, scrollToId } from "../utils";
import { Check, Person, Pin } from "./Icons";

/* Phone-only bottom bar (hidden above 600px by CSS) + location picker sheet */
export default function BottomNav({ page = "home" }) {
  const { city, setLocation, photographers, gigs, myProfile, joinOpen, setJoinOpen, toast } = useApp();
  const [active, setActive] = useState("home");
  const [sheet, setSheet] = useState(false);
  const [finding, setFinding] = useState(false);

  // highlight the current page
  useEffect(() => { if (!sheet && !joinOpen) setActive(page === "home" ? "home" : page === "post" ? "post" : ""); }, [page, sheet, joinOpen]);

  useEffect(() => {
    if (!sheet) return;
    const k = (e) => e.key === "Escape" && setSheet(false);
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k);
  }, [sheet]);

  const pickCity = (c) => {
    setSheet(false); setLocation(c); scrollToId("photographers");
    const n = photographers.filter((p) => p.city === c).length;
    toast(n ? `Showing ${n} photographer${n === 1 ? "" : "s"} in ${c}.` : `No photographers in ${c} yet.`);
  };
  const gps = () => {
    if (!navigator.geolocation) return toast("Location isn't available on this device.");
    setFinding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setFinding(false); pickCity(nearestCity(pos.coords.latitude, pos.coords.longitude)); },
      () => { setFinding(false); toast("Couldn't get your location — please pick a city from the list."); },
      { timeout: 10000 }
    );
  };

  const go = (k) => {
    if (k === "home") { goPage("home"); setActive("home"); }
    if (k === "post") { goPage("post"); setActive("post"); }
    if (k === "location") { setSheet(true); setActive("location"); }
    if (k === "profile") { setActive("profile"); setJoinOpen(true); }
  };

  return (
    <>
      <nav className="bn" aria-label="Mobile menu">
        <button type="button" className={"bn-i" + (active === "home" ? " active" : "")} onClick={() => go("home")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3z" /></svg><span>Home</span>
        </button>
        <button type="button" className={"bn-i" + (active === "post" ? " active" : "")} onClick={() => go("post")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg><span>Post</span>
        </button>
        <button type="button" className={"bn-i" + (active === "location" ? " active" : "")} onClick={() => go("location")}>
          <Pin size={24} /><span>{city}</span>
        </button>
        <button type="button" className={"bn-i" + (active === "profile" ? " active" : "") + (myProfile ? " has-av" : "")} onClick={() => go("profile")}>
          <span className="bn-av">
            {myProfile ? (myProfile.photo ? <img src={myProfile.photo} alt="" /> : <span style={{ fontSize: ".7rem", fontWeight: 800 }}>{initials(myProfile.name)}</span>) : <Person size={24} />}
          </span>
          <span>{myProfile ? "My Profile" : "Profile"}</span>
        </button>
      </nav>

      <div className={"ls-bg" + (sheet ? " open" : "")} role="dialog" aria-modal="true" aria-labelledby="lsTitle" onClick={(e) => e.target === e.currentTarget && setSheet(false)}>
        {sheet && (
          <div className="ls">
            <div className="ls-grab" />
            <div className="ls-head">
              <h3 id="lsTitle">Choose your <span>location</span></h3>
              <button type="button" className="jm-x" style={{ position: "static" }} aria-label="Close" onClick={() => setSheet(false)}>×</button>
            </div>
            <button type="button" className="ls-gps" onClick={gps}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="8" /></svg>
              {finding ? "Finding you…" : "Use my current location"}
            </button>
            <div className="ls-list">
              {CITY_NAMES.map((c) => {
                const ph = photographers.filter((p) => p.city === c).length;
                const fn = gigs.filter((g) => g.city === c && g.status === "open" && daysUntil(g.date) >= 0).length;
                return (
                  <button type="button" key={c} className={"ls-c" + (c === city ? " on" : "")} onClick={() => pickCity(c)}>
                    <span className="pin"><Pin size={18} /></span>
                    <span><b>{c}</b><small>{ph} photographer{ph === 1 ? "" : "s"} · {fn} open function{fn === 1 ? "" : "s"}</small></span>
                    <Check size={20} sw={3} className="tick" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
