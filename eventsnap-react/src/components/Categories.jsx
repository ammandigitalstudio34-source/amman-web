import { useApp } from "../AppContext";
import { useImageExists } from "../utils";
import { Arrow, Box, Cake, Crowd, Feet, Person, Rings, StarFilled } from "./Icons";

const CATS = [
  { label: "Wedding", type: "Wedding", img: "/cat-wedding.jpg", Icon: Rings, bg: "radial-gradient(circle at 30% 20%,#ffd98a55,transparent 40%),linear-gradient(150deg,#b8742c,#7a2a22 60%,#3d1216)" },
  { label: "Birthday", type: "Birthday", img: "/cat-birthday.jpg", Icon: Cake, bg: "radial-gradient(circle at 70% 30%,#fff3b055,transparent 40%),linear-gradient(150deg,#f3a6c8,#c2507e 60%,#6b2342)" },
  { label: "Baby Shoot", type: "Baby Shower", img: "/cat-baby.jpg", Icon: Feet, bg: "radial-gradient(circle at 40% 30%,#fff8ec,transparent 55%),linear-gradient(150deg,#e9d8c2,#b9987a 60%,#6d5341)" },
  { label: "Events", type: "Corporate Event", img: "/cat-events.jpg", Icon: Crowd, bg: "conic-gradient(from 200deg at 50% 0%,transparent 0deg,#ff4fd855 20deg,transparent 40deg,#6b7bff66 60deg,transparent 80deg,#c04bff55 100deg,transparent 120deg),linear-gradient(180deg,#5a1aa8,#2a0b5c 55%,#0d0618)" },
  { label: "Portrait", type: "Portrait", img: "/cat-portrait.jpg", Icon: Person, bg: "radial-gradient(circle at 60% 30%,#e8c79a66,transparent 45%),linear-gradient(150deg,#7f9a52,#3f5a2a 60%,#1e2a14)" },
  { label: "Products", type: "Product Shoot", img: "/cat-products.jpg", Icon: Box, bg: "radial-gradient(circle at 50% 40%,#f1c27a44,transparent 50%),linear-gradient(150deg,#6a7a3a,#4a3420 55%,#1c120a)" },
];

function CatCard({ c, onPick }) {
  const has = useImageExists(c.img);
  return (
    <button className={"cat-card" + (has ? " has-photo" : "")} style={{ "--bg": c.bg, ...(has ? { backgroundImage: `url('${c.img}')` } : null) }} onClick={() => onPick(c)}>
      <div className="art"><c.Icon size={96} sw={1.4} /></div>
      <span><c.Icon size={24} />{c.label}</span>
    </button>
  );
}

export default function Categories() {
  const { prefillPost, toast } = useApp();
  const pick = (c) => { prefillPost({ type: c.type }); toast(`${c.label} selected — add your function details.`); };
  return (
    <section className="cat" id="categories">
      <div className="dots" style={{ left: 10 }} />
      <div className="dots" style={{ right: 10 }} />
      <div className="wrap">
        <div className="cat-head reveal">
          <span className="es-pill" style={{ color: "#5b1fd1" }}><StarFilled />Explore Categories</span>
          <h2>Popular <span>Photography</span> Categories</h2>
          <p>Find the right photographer for every occasion</p>
        </div>
        <div className="cat-grid reveal">{CATS.map((c) => <CatCard key={c.label} c={c} onPick={pick} />)}</div>
        <div className="cat-more"><a href="#post">Explore All Categories <Arrow size={18} /></a></div>
      </div>
    </section>
  );
}
