import { useState } from "react";
import { inr } from "../utils";
import { LogoMark } from "./Icons";

export function ForPhotographers() {
  const [count, setCount] = useState(6);
  const [avg, setAvg] = useState(8000);
  return (
    <section className="pros" id="pros">
      <div className="wrap">
        <div className="section-head reveal">
          <div><span className="eyebrow">For photographers</span><h2>Your city's functions,<br />on your phone.</h2></div>
          <p className="lead">Fill empty dates, build your portfolio and get paid fairly — without spending on ads.</p>
        </div>
        <div className="pro-grid reveal">
          <div className="pro-card">
            <div className="ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg></div>
            <h3>Work close to home</h3>
            <p>Set your travel radius. You only see functions you can actually reach — no long bus rides for a 3-hour shoot.</p>
          </div>
          <div className="pro-card">
            <div className="ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div>
            <h3>Guaranteed payment</h3>
            <p>The budget is held in escrow when you confirm. Upload the files, and it's in your account within 48 hours.</p>
          </div>
          <div className="pro-card">
            <div className="ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 2 3 6.5 7 .9-5.1 4.8 1.3 7L12 17.8 5.8 21.2l1.3-7L2 9.4l7-.9z" /></svg></div>
            <h3>Ratings that travel</h3>
            <p>Every completed function adds to your public EventSnap profile — a portfolio studios across the state can trust.</p>
          </div>
        </div>
        <div className="earn reveal">
          <div>
            <h3>What could your free weekends earn?</h3>
            <p className="lead">Move the sliders to estimate a month of EventSnap functions in your area.</p>
          </div>
          <div className="calc">
            <label>Functions per month <b>{count}</b></label>
            <input type="range" min="1" max="20" value={count} onChange={(e) => setCount(+e.target.value)} />
            <label>Average budget <b>{inr(avg)}</b></label>
            <input type="range" min="2000" max="30000" step="500" value={avg} onChange={(e) => setAvg(+e.target.value)} />
            <div className="total">{inr(Math.round(count * avg * 0.92))} <small>/ month after 8% fee</small></div>
          </div>
        </div>
      </div>
    </section>
  );
}

const QUOTES = [
  ["I'm based in Chennai and got a Tirunelveli wedding on the same day as a local one. An EventSnap photographer confirmed in 20 minutes. My client never knew there was a problem.", "MR", "#7b2ff7", "Manoj R.", "Studio owner, Chennai"],
  ["I used to wait for word-of-mouth. Now I cover 8–10 functions a month within 30 km of my house.", "SP", "#2f7d5b", "Sathya P.", "Freelance photographer, Coimbatore"],
  ["We needed someone for my grandmother's 80th birthday in our native village. Posted at night, confirmed by morning.", "LK", "#c98a1b", "Lakshmi K.", "Family client, Thanjavur"],
];
export function Stories() {
  return (
    <section>
      <div className="wrap">
        <div className="section-head reveal"><div><span className="eyebrow">Stories</span><h2>Bookings saved,<br />not cancelled.</h2></div></div>
        <div className="quotes reveal">
          {QUOTES.map(([q, ini, bg, n, r]) => (
            <div className="quote" key={n}>
              <p>"{q}"</p>
              <div className="who-q"><div className="avatar" style={{ background: bg }}>{ini}</div><div><b>{n}</b><span>{r}</span></div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  ["Who can confirm a function?", "Only photographers who have completed ID verification and uploaded at least 20 portfolio images. Studios can also restrict a function to photographers above a chosen rating."],
  ["What if the photographer cancels?", "The function goes straight back on the board with an \"urgent\" badge, nearby photographers are re-alerted, and the cancelling photographer's reliability score drops."],
  ["Who owns the photos?", "For studio hand-overs, all raw files and rights belong to the posting studio. For direct family bookings, usage terms are agreed in the function notes."],
  ["How much does EventSnap cost?", "Posting is free. An 8% service fee is deducted from the budget only after the shoot is completed and files are delivered."],
];
export function Faq() {
  return (
    <section id="faq" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="section-head reveal"><div><span className="eyebrow">FAQ</span><h2>Good questions.</h2></div></div>
        <div className="faq reveal">
          {FAQS.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </div>
    </section>
  );
}

export function Cta() {
  return (
    <section className="cta">
      <div className="wrap">
        <h2>Never turn down a function again.</h2>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#post" className="btn btn-dark">Post a function</a>
          <a href="#board" className="btn btn-ghost">Browse open functions</a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer id="contact">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a href="#top" className="es-logo" style={{ color: "var(--paper)", marginBottom: 16, fontFamily: "'Plus Jakarta Sans',var(--sans)" }}>
              <LogoMark simple style={{ width: 52, height: 42 }} />
              <span><b style={{ fontSize: "1.6rem" }}>Event<em>Snap</em></b><small>Plan • Find • Capture</small></span>
            </a>
            <p style={{ maxWidth: "32ch" }}>The relay network that keeps every function covered — by a photographer who's already nearby.</p>
          </div>
          <div><h4>Platform</h4><ul>
            <li><a href="#board">Live functions</a></li><li><a href="#post">Post a function</a></li><li><a href="#how">How it works</a></li>
            <li><a href="/admin" className="foot-admin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" style={{ display: "inline", verticalAlign: -2 }}><path d="M12 2.5 20 5.5v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z" /></svg> Admin panel</a></li>
          </ul></div>
          <div><h4>Photographers</h4><ul><li><a href="#pros">Join EventSnap</a></li><li><a href="#pros">Earnings</a></li><li><a href="#faq">Verification</a></li></ul></div>
          <div><h4>Contact</h4><ul><li>hello@eventsnap.example</li><li>+91 00000 00000</li><li>Chennai, Tamil Nadu</li></ul></div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 EventSnap. A concept project. · <a href="/admin" className="foot-admin">Admin login</a></span>
          <span>Made for photographers, by people who love functions.</span>
        </div>
      </div>
    </footer>
  );
}
