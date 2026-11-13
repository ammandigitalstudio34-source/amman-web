// Small inline SVG icons reused across components.
const S = (p) => ({ width: p.size || 20, height: p.size || 20, style: p.style, className: p.className, "aria-hidden": true });

export const Pin = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
);
export const PinOutline = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 1.8}><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z" /><circle cx="12" cy="9" r="2.6" /></svg>
);
export const Arrow = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Search = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2.6} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const Chevron = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
);
export const Check = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
export const Calendar = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2.2}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    <g fill="currentColor" stroke="none"><rect x="6.5" y="12.5" width="3" height="2.4" /><rect x="10.5" y="12.5" width="3" height="2.4" /><rect x="14.5" y="12.5" width="3" height="2.4" /><rect x="6.5" y="16.2" width="3" height="2.4" /><rect x="10.5" y="16.2" width="3" height="2.4" /></g>
  </svg>
);
export const Grid = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2.2}><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></svg>
);
export const Rings = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2}><circle cx="8.5" cy="14.5" r="5.5" /><circle cx="15.5" cy="14.5" r="5.5" /><path d="M13 3h5l-2.5 3.5z" fill="currentColor" /></svg>
);
export const Cake = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2}><path d="M3 21h18M5 21v-7h14v7M5 17c2 1.5 4-1.5 7 0s5-1.5 7 0M8 14v-3M12 14v-3M16 14v-3" /></svg>
);
export const Person = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.5" /><path d="M3 22c0-5 4-8 9-8s9 3 9 8z" /></svg>
);
export const Baby = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="8" /><path d="M12 5c-1-2 1-3 2-2" strokeLinecap="round" /><circle cx="9" cy="12" r=".8" fill="currentColor" /><circle cx="15" cy="12" r=".8" fill="currentColor" /><path d="M9.5 16c1.5 1.2 3.5 1.2 5 0" strokeLinecap="round" /></svg>
);
export const Feet = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="currentColor"><ellipse cx="7" cy="15" rx="3" ry="5" /><ellipse cx="17" cy="15" rx="3" ry="5" /><circle cx="5" cy="7.5" r="1.2" /><circle cx="7.6" cy="6.5" r="1.2" /><circle cx="19" cy="7.5" r="1.2" /><circle cx="16.4" cy="6.5" r="1.2" /></svg>
);
export const Box = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2.2} strokeLinejoin="round"><path d="M12 2 21 7v10l-9 5-9-5V7z" /><path d="m3 7 9 5 9-5M12 12v10" /></svg>
);
export const Crowd = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="3" /><circle cx="5" cy="9" r="2.3" /><circle cx="19" cy="9" r="2.3" /><path d="M6 21v-3a6 6 0 0 1 12 0v3zM0 21v-2a5 5 0 0 1 6.5-4.8A8 8 0 0 0 4.5 18v3zM24 21v-2a5 5 0 0 0-6.5-4.8 8 8 0 0 1 2 3.8v3z" /></svg>
);
export const Heart = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill={p.filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={p.sw || 2.4} strokeLinejoin="round"><path d="M12 21C5 15.5 2 12.2 2 8.3 2 5.4 4.3 3 7.1 3c2 0 3.7 1.1 4.9 3 1.2-1.9 2.9-3 4.9-3C19.7 3 22 5.4 22 8.3c0 3.9-3 7.2-10 12.7z" /></svg>
);
export const Bubble = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2.2} strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z" /><circle cx="8" cy="12" r=".8" fill="currentColor" /><circle cx="12" cy="12" r=".8" fill="currentColor" /><circle cx="16" cy="12" r=".8" fill="currentColor" /></svg>
);
export const Shield = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 1.8} strokeLinejoin="round" strokeLinecap="round"><path d="M12 2.5 20 5.5v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
);
export const Star = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 1.8} strokeLinejoin="round"><path d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
);
export const StarFilled = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24"><path d="m12 2 2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 16.8l-6.1 3.4 1.5-6.7-5.1-4.6 6.8-.7z" fill={p.color || "#f5b301"} /></svg>
);
export const Bolt = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 1.8} strokeLinejoin="round"><path d="M13.5 2 4.5 13.5h6.5L9.5 22l9-12h-6.5z" /></svg>
);
export const CameraFill = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="currentColor"><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /><circle cx="12" cy="14" r="2.2" /></svg>
);
export const Spark = ({ style, flip }) => (
  <svg className="spark" style={{ ...style, ...(flip ? { transform: "scaleX(-1)" } : null) }} viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" aria-hidden="true"><path d="M24 6l7 14M44 12l-6 13M6 28l16 4M10 46l14-6" /></svg>
);
export const VerifiedTick = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 1.5 2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3-1-3 2.6-1.9 1-3 3.2.1z" fill="#2d7ff9" /><path d="m8 12 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Send = (p) => (
  <svg {...S(p)} viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12.4 2-12.4 2z" /></svg>
);

export const LogoMark = ({ style, simple }) => (
  <svg viewBox="0 0 72 58" style={style} aria-hidden="true">
    <path d="M9 13h11l6-9h20l6 9h11a7 7 0 0 1 7 7v29a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7V20a7 7 0 0 1 7-7z" fill="#7b2ff7" />
    {!simple && <rect x="9" y="19" width="7" height="3.5" rx="1.75" fill="#fff" opacity=".75" />}
    <circle cx="36" cy="33" r="15.5" fill="#fff" />
    <circle cx="36" cy="33" r="10.5" fill="#15101c" />
    <circle cx="32" cy="29" r="3" fill="#fff" opacity=".85" />
  </svg>
);

/* photographer silhouette + headshot, coloured through CSS variables */
export const SvgDefs = () => (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
    <defs>
      <symbol id="shooter" viewBox="0 0 220 200">
        <path d="M40 200c4-46 28-70 70-76 26 0 48 8 66 26 16 16 22 32 24 50z" fill="var(--shirt)" />
        <path d="M118 104h22v26h-22z" fill="var(--skin)" />
        <ellipse cx="130" cy="78" rx="27" ry="31" fill="var(--skin)" />
        <path d="M103 74c-3-24 10-40 28-40s31 14 27 38c-2-8-6-14-12-17-12 2-28 8-43 19z" fill="var(--hair)" />
        <path d="M155 70c2 4 3 9 2 14l-4-1c0-5-1-9-2-12z" fill="var(--hair)" />
        <rect x="66" y="62" width="58" height="40" rx="7" fill="var(--cam)" />
        <rect x="84" y="54" width="20" height="10" rx="3" fill="var(--cam)" />
        <rect x="22" y="66" width="48" height="32" rx="5" fill="var(--cam)" />
        <rect x="14" y="62" width="14" height="40" rx="4" fill="var(--cam)" />
        <ellipse cx="14" cy="82" rx="4" ry="18" fill="#3b3b44" opacity=".9" />
        <rect x="34" y="68" width="4" height="28" fill="#555" opacity=".6" />
        <path d="M100 136c-14-6-24-18-28-34l18-6c4 12 10 20 22 24z" fill="var(--shirt)" />
        <ellipse cx="74" cy="98" rx="11" ry="9" fill="var(--skin)" />
        <path d="M150 140c-8-14-14-26-22-34l10-10c10 8 18 20 24 34z" fill="var(--shirt)" />
        <ellipse cx="124" cy="96" rx="9" ry="8" fill="var(--skin)" />
      </symbol>
      <symbol id="headshot" viewBox="0 0 60 60">
        <circle cx="30" cy="24" r="11" fill="var(--skin)" />
        <path d="M18 22c0-12 24-14 24 0-6-5-18-5-24 0z" fill="var(--hair)" />
        <path d="M6 60c0-14 10-22 24-22s24 8 24 22z" fill="var(--shirt)" />
      </symbol>
    </defs>
  </svg>
);
