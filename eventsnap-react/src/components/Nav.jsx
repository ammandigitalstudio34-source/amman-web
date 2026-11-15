import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { Chevron, LogoMark, Search } from "./Icons";

export default function Nav({ page = "home" }) {
  const { myProfile, authUser, setJoinOpen } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const join = (e) => { e.preventDefault(); setOpen(false); setJoinOpen(true); };
  const close = () => setOpen(false);
  // left drawer: lock page scroll while open, close with Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", k); };
  }, [open]);
  const focusSearch = () => { if (page !== "home") { window.location.hash = "#/"; setTimeout(() => document.getElementById("hsCity")?.focus(), 80); } else { window.scrollTo({ top: 0, behavior: "smooth" }); document.getElementById("hsCity")?.focus({ preventScroll: true }); } };

  return (
    <header className={"nav" + (scrolled || page !== "home" ? " scrolled" : "")} id="nav">
      <div className="nav-inner">
        <a href="#/" className="es-logo" aria-label="EventSnap home">
          <LogoMark />
          <span><b>Event<em>Snap</em></b><small>Plan • Find • Capture</small></span>
        </a>
        <div className={"nav-backdrop" + (open ? " open" : "")} onClick={close} aria-hidden="true" />
        <nav className={"nav-links" + (open ? " open" : "")} id="navLinks">
          <div className="drawer-head">
            <a href="#/" className="es-logo" onClick={close}><LogoMark /><span><b>Event<em>Snap</em></b><small>Plan • Find • Capture</small></span></a>
            <button type="button" className="drawer-x" aria-label="Close menu" onClick={close}>×</button>
          </div>
          <a href="#/" className={page === "home" ? "active" : ""} onClick={close}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3z" /></svg>Home
          </a>
          <div className="dd">
            <a href="#/photographers" className={["photographers", "post", "board"].includes(page) ? "active" : ""} onClick={close}><Search size={19} />Find Photographers<Chevron size={14} /></a>
            <div className="dd-menu"><div>
              <a href="#/photographers" onClick={close}>
                <svg className="dd-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /></svg>
                <span>Find photographers<small>Browse photographers by city</small></span></a>
              <a href="#/post" onClick={close}>
                <svg className="dd-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M8 2v4M16 2v4M12 10v7M8.5 13.5h7" /></svg>
                <span>Post a function<small>Nearby photographers get alerted</small></span></a>
              <a href="#/board" onClick={close}>
                <svg className="dd-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" opacity=".7" /><rect x="3" y="13" width="8" height="8" rx="2" opacity=".7" /><rect x="13" y="13" width="8" height="8" rx="2" /></svg>
                <span>Live function board<small>Open functions near you</small></span></a>
              <a href="#pros" onClick={join}>
                <svg className="dd-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="8" r="4" /><path d="M1.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5v.5h-15zM19 7v3h3v2h-3v3h-2v-3h-3v-2h3V7z" /></svg>
                <span>Join as a photographer<small>Earn from functions in your area</small></span></a>
            </div></div>
          </div>
          <a href="#/how" className={page === "how" ? "active" : ""} onClick={close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>How It Works
          </a>
          <a href="#/about" className={page === "about" ? "active" : ""} onClick={close}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.7" /><path d="M2 19c0-3.6 3.1-6 7-6s7 2.4 7 6v1H2zM16.5 13.2c3 .1 5.5 2 5.5 5V20h-4.5v-1c0-2.3-.4-4.2-1-5.8z" /></svg>About
          </a>
          <a href="#/contact" className={page === "contact" ? "active" : ""} onClick={close}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.3V17h16V7.3l-8 5.4z" /><path d="M4 6.5h16L12 12z" /></svg>Contact
          </a>
        </nav>
        <div className="nav-actions">
          <button className="icon-btn" aria-label="Search photographers" onClick={focusSearch}><Search size={22} sw={2.4} /></button>
          <a href="#pros" className="pill-out" onClick={join}>{authUser ? "Google account" : "Login"}</a>
          <a href="#pros" className="pill-purple" onClick={join}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="4" /><path d="M1.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5v.5h-15zM19 7v3h3v2h-3v3h-2v-3h-3v-2h3V7z" /></svg>
            {myProfile ? "My Profile" : "Sign Up"}
          </a>
          <button className="menu-btn" aria-label="Open menu" onClick={() => setOpen((o) => !o)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
