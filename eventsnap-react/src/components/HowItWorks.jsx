import { Arrow, Calendar, Pin, Spark } from "./Icons";

const ArrowRight = () => (
  <svg className="hw-arrow" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
);

function Step({ n, title, text, icon }) {
  return (
    <div className="hw-card reveal">
      <span className="hw-num">{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="hw-ico">{icon}</div>
    </div>
  );
}

const Face = ({ bg, skin, shirt, hair, style }) => (
  <div className="ph-av" style={{ ...style, background: bg }}>
    <svg width="30" height="32" viewBox="0 0 30 32"><circle cx="15" cy="11" r="7" fill={skin} /><path d="M2 32c0-8 6-12 13-12s13 4 13 12z" fill={shirt} /><path d="M8 9c1-6 13-6 14 0-4-2-10-2-14 0z" fill={hair} /></svg>
  </div>
);

export default function HowItWorks() {
  return (
    <section className="hw" id="how">
      <svg className="hw-cam" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" aria-hidden="true" style={{ transform: "rotate(8deg)" }}>
        <path d="M14 26h20l8-13h36l8 13h20a8 8 0 0 1 8 8v50a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z" /><circle cx="60" cy="58" r="21" />
      </svg>
      <div className="wrap">
        <div className="hw-head reveal">
          <span className="es-pill">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2.5c3.6-.6 6.4.3 7 1 .7.6 1.6 3.4 1 7-.5 3-2.6 5.8-5.5 8l.5 3.5-3.5 2-2-3.5-3-3-3.5-2 2-3.5 3.5.5c2.2-2.9 5-5 8-5.5zM16 6.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM5 16c1.4-.2 2.8 1.2 2.6 2.6C7.4 20.4 4 21 2.5 21.5 3 20 3.6 16.6 5 16z" /></svg>
            Simple 4-Step Process
          </span>
          <Spark style={{ left: "calc(50% - 300px)", top: 22 }} />
          <h2>How It <span>Works?</span></h2>
          <Spark style={{ right: "calc(50% - 300px)", top: 22 }} flip />
          <p>Find and book the best photographers near your event in just a few clicks.</p>
        </div>

        <div className="hw-steps">
          <Step n="1" title="Post Your Event" text="Enter your function details like location, date and budget." icon={<Calendar size={48} sw={2} />} />
          <ArrowRight />
          <Step n="2" title="Find Nearby Photographers" text="Discover trusted photographers near your location." icon={<Pin size={46} />} />

          <div className="hw-phone-col">
            <svg className="squig" style={{ left: -70, top: -6 }} width="54" height="40" viewBox="0 0 54 40" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 30C8 14 12 8 15 20s6 14 12 0 8-14 10 2c1 8 6 2 12-8" /></svg>
            <svg className="squig" style={{ right: -62, top: -10 }} width="50" height="40" viewBox="0 0 50 40" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path d="M10 30l8-16M24 34l4-12M34 26l12 2M30 10l6-6" /></svg>
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="phone-status"><span>9:41</span><span>▂▄▆ ᯤ ▮</span></div>
                <svg className="phone-map" viewBox="0 0 230 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <rect width="230" height="340" fill="#eef1ea" />
                  <path d="M0 210c30-10 40 10 60 2s20-30 0-40" fill="#cfe3f5" />
                  <rect x="150" y="40" width="60" height="40" rx="6" fill="#dcebd3" />
                  <rect x="20" y="70" width="40" height="34" rx="6" fill="#dcebd3" />
                  <rect x="160" y="200" width="50" height="40" rx="6" fill="#dcebd3" />
                  <g stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round"><path d="M-10 60L240 110M-10 170L240 150M70 -10L100 350M170 -10L140 350M-10 260L240 240" /></g>
                  <g stroke="#fff" strokeWidth="3" fill="none"><path d="M30 0L50 340M200 0L215 340M0 120L230 200M0 300L230 290M120 0L118 340" /></g>
                  <g stroke="#f4dca6" strokeWidth="4" fill="none" strokeLinecap="round"><path d="M-10 170L240 150" /></g>
                </svg>
                <div className="radar" />
                <svg className="map-pin" width="40" height="46" viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1a9 9 0 0 0-9 9c0 6.5 9 16 9 16s9-9.5 9-16a9 9 0 0 0-9-9z" fill="currentColor" /><circle cx="12" cy="10" r="3.6" fill="#fff" /></svg>
                <Face style={{ left: 34, top: 62 }} bg="linear-gradient(160deg,#c9a27d,#7a5236)" skin="#5a3a26" shirt="#2f3b52" hair="#1d140e" />
                <Face style={{ right: 30, top: 52 }} bg="linear-gradient(160deg,#b9c4a5,#6b7a52)" skin="#6b4630" shirt="#e5e1d8" hair="#1d140e" />
                <Face style={{ left: 24, top: 162 }} bg="linear-gradient(160deg,#9db3c9,#4f6680)" skin="#7a5038" shirt="#7b2ff7" hair="#241811" />
                <Face style={{ right: 22, top: 156 }} bg="linear-gradient(160deg,#a8c49b,#4f7a45)" skin="#5e3d28" shirt="#1f2a1c" hair="#140e0a" />
                <div className="ph-card">
                  <div className="t">
                    <svg width="26" height="22" viewBox="0 0 72 58" style={{ flex: "none" }}><path d="M9 13h11l6-9h20l6 9h11a7 7 0 0 1 7 7v29a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7V20a7 7 0 0 1 7-7z" fill="#16121c" /><circle cx="36" cy="33" r="15" fill="#fff" /><circle cx="36" cy="33" r="9" fill="#16121c" /><rect x="54" y="18" width="7" height="4" rx="2" fill="#f2a93b" /></svg>
                    <span><b>5 Photographers Found</b><br />within 10 km</span>
                  </div>
                  <a href="#photographers">View Profiles <Arrow size={14} sw={3} /></a>
                </div>
              </div>
            </div>
          </div>

          <Step n="3" title="Chat & Confirm" text="Message photographers, compare offers and confirm your booking." icon={
            <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-4 3.5V14H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M19 8h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1v3.5L16 19H11a2 2 0 0 1-2-2v-1h6a4 4 0 0 0 4-4z" opacity=".75" /><circle cx="5.5" cy="8.5" r="1.2" fill="#efe6fe" /><circle cx="9" cy="8.5" r="1.2" fill="#efe6fe" /><circle cx="12.5" cy="8.5" r="1.2" fill="#efe6fe" /></svg>
          } />
          <ArrowRight />
          <Step n="4" title="Capture the Memories" text="Enjoy your event and get beautiful photos." icon={
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><rect x="2.5" y="3.5" width="19" height="17" rx="2.5" /><circle cx="8.5" cy="9" r="2" fill="currentColor" /><path d="M3 18l5.5-5.5 4 4 3-3 5.5 5.5" fill="currentColor" /></svg>
          } />
        </div>
      </div>
    </section>
  );
}
