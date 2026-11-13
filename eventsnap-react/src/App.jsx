import { useEffect, useState } from "react";
import { AppProvider } from "./AppContext";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Categories from "./components/Categories";
import Featured from "./components/Featured";
import Problem from "./components/Problem";
import Board from "./components/Board";
import PostFunction from "./components/PostFunction";
import { Cta, Faq, Footer, ForPhotographers, Stories } from "./components/Sections";
import JoinModal from "./components/JoinModal";
import Chat from "./components/Chat";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";
import { SvgDefs } from "./components/Icons";
import Admin from "./admin/Admin";
import Gate from "./components/Gate";
import { useRoute } from "./utils";

/* fade-in on scroll for every .reveal element (re-run on every page change) */
function useReveal(dep) {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    const t = setTimeout(() => document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el)), 0);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [dep]);
}

const TITLES = {
  home: "EventSnap — Nearby Photographers for Every Function",
  photographers: "Find Photographers · EventSnap", post: "Post a Function · EventSnap", board: "Live Functions · EventSnap",
  how: "How It Works · EventSnap", about: "About · EventSnap", contact: "Contact · EventSnap",
};

function ContactCard() {
  return (
    <section className="contact-page">
      <div className="wrap">
        <div className="section-head reveal"><div><span className="eyebrow">Contact</span><h2>We're here to help.</h2></div>
          <p className="lead">Questions about bookings, payments or verification? Reach us any day, 9 AM – 9 PM.</p></div>
        <div className="contact-grid reveal">
          <a className="contact-card" href="mailto:hello@eventsnap.example"><b>Email</b><span>hello@eventsnap.example</span></a>
          <a className="contact-card" href="tel:+910000000000"><b>Phone</b><span>+91 00000 00000</span></a>
          <div className="contact-card"><b>Office</b><span>Chennai, Tamil Nadu</span></div>
        </div>
      </div>
    </section>
  );
}

function Site() {
  const page = useRoute();
  useReveal(page);
  useEffect(() => { document.title = TITLES[page] || TITLES.home; }, [page]);

  let content;
  switch (page) {
    case "photographers": content = <Featured />; break;
    case "post": content = <PostFunction />; break;
    case "board": content = <Board />; break;
    case "how": content = <HowItWorks />; break;
    case "about": content = <><Problem /><ForPhotographers /><Stories /></>; break;
    case "contact": content = <><ContactCard /><Faq /></>; break;
    // Home shows every section; each menu item also has its own page
    default: content = <>
      <Hero /><HowItWorks /><Categories /><Featured /><Problem /><Board /><PostFunction />
      <ForPhotographers /><Stories /><ContactCard /><Faq /><Cta />
    </>;
  }

  return (
    <>
      <SvgDefs />
      <Nav page={page} />
      <main className={page === "home" ? "" : "page"} key={page}>
        {page !== "home" && (
          <div className="back-home-bar">
            <a href="#/" className="back-home">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              Back to Home
            </a>
          </div>
        )}
        {content}
      </main>
      <Footer />
      <JoinModal />
      <Chat />
      <BottomNav page={page} />
      <Toast />
    </>
  );
}

export default function App() {
  const page = useRoute();
  // "Are you a photographer?" — asked each time the website is opened (remembered only while this tab stays open)
  const [allowed, setAllowed] = useState(() => { try { return sessionStorage.getItem("es_gate") === "yes"; } catch { return false; } });
  const allow = () => { try { sessionStorage.setItem("es_gate", "yes"); } catch { /* ignore */ } setAllowed(true); };
  useEffect(() => { if (page === "admin") document.title = "EventSnap Admin"; }, [page]);

  if (page === "admin") return <Admin />;
  if (!allowed) return <Gate onYes={allow} />;
  return <AppProvider><Site /></AppProvider>;
}
