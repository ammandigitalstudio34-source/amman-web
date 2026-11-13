import { useApp } from "../AppContext";
import { CITY_NAMES, FP_FILTERS, SCENES } from "../data";
import { inr, useImageExists } from "../utils";
import { Arrow, Baby, Box, Bubble, Cake, Calendar, Check, CameraFill, Crowd, Grid, Heart, Person, Pin, Rings, Spark, StarFilled, VerifiedTick } from "./Icons";

const FILTER_ICONS = {
  All: <Grid size={22} />, Wedding: <Rings size={24} />, Birthday: <Cake size={22} />, Events: <Calendar size={22} sw={2} />,
  Portrait: <Person size={22} />, "Baby Shoot": <Baby size={24} />, Products: <Box size={22} />,
};

function PhotographerCard({ p, index }) {
  const { favs, toggleFav, bookPhotographer, openChat, unreadFor } = useApp();
  const src = p.photo || (p.img ? "/" + p.img : "");
  const hasPhoto = useImageExists(src);
  const vars = { "--skin": p.skin, "--hair": p.hair, "--shirt": p.shirt, "--cam": "#141418" };
  const fav = favs.includes(p.n);
  const unread = unreadFor(p);
  return (
    <article className="pc" style={{ animationDelay: index * 60 + "ms" }}>
      <div className={"pc-photo" + (hasPhoto ? " has-photo" : "")} style={{ "--scene": SCENES[p.scene], ...(hasPhoto ? { backgroundImage: `url('${src}')` } : null) }}>
        <svg viewBox="0 0 220 200" style={vars} aria-hidden="true"><use href="#shooter" /></svg>
        <span className={"pc-ver" + (p.pending ? " pending" : "")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2 20 5v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V5z" /><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#22b35e" strokeWidth="2.6" strokeLinecap="round" /></svg>
          {p.pending ? "Pending" : "Verified"}
        </span>
        <button className={"pc-heart" + (fav ? " on" : "")} aria-label={`Save ${p.n}`} onClick={() => toggleFav(p.n)}><Heart size={18} filled={fav} /></button>
      </div>
      <div className="pc-body">
        <div className="pc-top">
          <div className="pc-av" style={{ "--avbg": p.av }}>
            {p.photo ? <img src={p.photo} alt="" /> : <svg width="56" height="56" viewBox="0 0 60 60" style={vars}><use href="#headshot" /></svg>}
            <i />
          </div>
          <div className="pc-name">
            <b title={p.n}><em>{p.n}</em>{!p.pending && <VerifiedTick />}</b>
            <div className="pc-rate"><span style={{ color: "#f5b301" }}>★</span><strong>{p.r}</strong> ({p.rv} reviews)</div>
          </div>
          <div className="pc-price"><b>{inr(p.price)}</b><small>/ event</small></div>
        </div>
        <div className="pc-loc">
          <Pin size={13} style={{ display: "inline", verticalAlign: -1, color: "#7b2ff7" }} /> {p.loc}, <b>{p.city}</b>{p.km != null ? ` • ${p.km} km away` : ""}
        </div>
        <div className="pc-tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
        <div className="pc-btns">
          <button className="pc-book" onClick={() => bookPhotographer(p)}><Calendar size={18} />Book Now</button>
          <button className="pc-msg" onClick={() => openChat(p)}><Bubble size={20} />Message{unread > 0 && <span className="badge">{unread}</span>}</button>
        </div>
      </div>
    </article>
  );
}

export default function Featured() {
  const { photographers, fpFilter, setFpFilter, fpCity, setFpCity, fpShowAll, setFpShowAll, setLocation, setJoinOpen } = useApp();

  const filtered = photographers.filter((p) => (fpFilter === "All" || p.tags.includes(fpFilter)) && (fpCity === "All" || p.city === fpCity));
  const total = filtered.length, joined = filtered.filter((p) => p.registered).length;
  const list = fpShowAll ? filtered : filtered.slice(0, 4);

  const pickCity = (c) => { setFpCity(c); setFpShowAll(false); if (c !== "All") setLocation(c); };
  const clear = () => { setFpCity("All"); setFpFilter("All"); setFpShowAll(false); };

  return (
    <section className="fp" id="photographers">
      <div className="wrap">
        <div className="fp-head reveal">
          <span className="es-pill"><StarFilled />Our Talented Professionals</span>
          <Spark style={{ left: "calc(50% - 470px)", top: 14 }} />
          <h2>Featured <span>Photographers</span></h2>
          <Spark style={{ right: "calc(50% - 470px)", top: 14 }} flip />
          <p>Discover verified and highly rated photographers near you</p>
        </div>

        <div className="fp-bar">
          <label className="fp-loc"><Pin /><span className="sr">Location</span>
            <select value={fpCity} onChange={(e) => pickCity(e.target.value)} aria-label="Filter photographers by location">
              <option value="All">All locations</option>
              {CITY_NAMES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <div className="fp-filters" role="tablist">
            {FP_FILTERS.map((f) => (
              <button key={f} className={"fp-f" + (fpFilter === f ? " active" : "")} onClick={() => { setFpFilter(f); setFpShowAll(false); }}>
                {FILTER_ICONS[f]}{f}
              </button>
            ))}
          </div>
          {total > 4 && <button className="fp-all" onClick={() => setFpShowAll(!fpShowAll)}>{fpShowAll ? "Show Less " : "View All "}<Arrow size={18} /></button>}
        </div>

        <div className="fp-locrow">
          <p className="fp-result">
            {fpCity === "All" && fpFilter === "All" ? <>Showing photographers from <b>all locations</b></> : <>
              <b>{total}</b> photographer{total === 1 ? "" : "s"}
              {fpCity !== "All" && <> in <b>{fpCity}</b></>}
              {fpFilter !== "All" && <> for <b>{fpFilter}</b></>}
              {joined > 0 && <span className="fp-new">{joined} newly joined</span>}
              <button type="button" className="fp-clear" onClick={clear}>Clear ×</button>
            </>}
          </p>
        </div>

        <div className="fp-grid">
          {total === 0 ? (
            <div className="fp-empty">
              <Pin size={46} />
              <h4>No photographers{fpCity !== "All" ? ` in ${fpCity}` : ""}{fpFilter !== "All" ? ` for ${fpFilter}` : ""} yet</h4>
              <p>Are you a photographer there? Create your profile and you'll show up here. Clients can also post the function and we'll alert photographers nearby.</p>
              <div><button type="button" className="pc-book" onClick={() => setJoinOpen(true)}>Join as a photographer</button><a href="#post" className="pc-msg">Post a function</a></div>
            </div>
          ) : list.map((p, i) => <PhotographerCard key={p.id || p.n} p={p} index={i} />)}
        </div>
        {list.length > 1 && <p className="fp-swipe">Swipe to see more <Arrow size={14} style={{ display: "inline" }} /></p>}

        <div className="fp-join reveal">
          <div className="jb">
            <svg className="jb-city" viewBox="0 0 600 260" preserveAspectRatio="xMaxYMax slice" aria-hidden="true"><path fill="currentColor" d="M0 260V200h30v-30h24v40h20v-70h30v60h18v-90h12v-20h8v20h12v110h26v-50h34v60h20v-120h40v130h24v-70h28v80h30v-40h30v50h30v-100h36v110h30v-60h40V260z" /><rect y="236" width="600" height="24" fill="#1a0f26" /></svg>
            <svg className="jb-man" viewBox="0 0 220 200" aria-hidden="true" style={{ "--skin": "#0c0712", "--hair": "#0c0712", "--shirt": "#0c0712", "--cam": "#0c0712" }}><use href="#shooter" /><path d="M168 132c18-6 34 6 40 30l6 38h-50z" fill="#0c0712" /></svg>
            <div className="jb-ico">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8" /></svg>
            </div>
            <div className="jb-txt">
              <h3>Are you a <span>Photographer?</span></h3>
              <p className="s">Join EventSnap and get more local bookings!</p>
              <ul>
                {["Get nearby job alerts", "Grow your business", "Manage bookings easily"].map((t) => (
                  <li key={t}><i><Check size={12} sw={4} style={{ color: "#fff" }} /></i>{t}</li>
                ))}
              </ul>
            </div>
            <a href="#pros" className="jb-btn" onClick={(e) => { e.preventDefault(); setJoinOpen(true); }}>Become a Photographer <Arrow size={18} /></a>
          </div>
          <div className="trust">
            <h4>Trusted by Thousands</h4>
            <div className="trust-row">
              <div><Crowd size={44} /><b>10K+</b><span>Happy Customers</span></div>
              <div><CameraFill size={40} /><b>3K+</b><span>Verified Photographers</span></div>
              <div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 20 5v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V5z" /><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <b>4.8<span style={{ display: "inline", fontSize: "1.4rem", color: "var(--purple)" }}>★</span></b><span>Platform Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
