import { useState } from "react";
import { Check, LogoMark } from "./Icons";

/* Shown before the website opens: only photographers may enter.
   "Yes" opens the site (remembered for this browser tab), "No" keeps it closed. */
export default function Gate({ onYes }) {
  const [said, setSaid] = useState(null); // null = asking, "no" = blocked

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-logo"><LogoMark /><span>Event<em>Snap</em></span></div>

        {said !== "no" ? (
          <>
            <div className="gate-ico">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /><circle cx="12" cy="14" r="2.2" /></svg>
            </div>
            <h1>Are you a <span>photographer?</span></h1>
            <p>EventSnap is a network for photographers to share and pick up functions near them.</p>
            <div className="gate-btns">
              <button className="gate-yes" onClick={onYes} autoFocus><Check size={20} sw={3} />Yes, I'm a photographer</button>
              <button className="gate-no" onClick={() => setSaid("no")}>No</button>
            </div>
          </>
        ) : (
          <>
            <div className="gate-ico gate-ico-no">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></svg>
            </div>
            <h1>Sorry, this website is <span>only for photographers</span></h1>
            <p>EventSnap can't be opened unless you are a photographer.</p>
            <div className="gate-btns">
              <button key="back" className="gate-no" onClick={() => setSaid(null)}>← I'm a photographer, go back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
