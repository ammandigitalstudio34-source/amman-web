const PAINS = [
  ["Distance kills bookings.", "Travel time, fuel and stay costs make far-away functions unprofitable."],
  ["Date clashes are common.", "Muhurtham days bring five enquiries for the same morning."],
  ["Local talent sits idle.", "Skilled freelancers near the venue never hear about the work."],
];

export default function Problem() {
  return (
    <section className="problem">
      <div className="wrap split">
        <div className="reveal">
          <span className="eyebrow">Why EventSnap exists</span>
          <blockquote style={{ marginTop: 18 }}>
            "I had two weddings booked on the same Sunday, 400 km apart. I could only be at one. Turning a family away felt terrible."
            <small>— Every photographer, at least once a season</small>
          </blockquote>
        </div>
        <ul className="pain-list reveal">
          {PAINS.map(([t, d], i) => (
            <li key={t}><span className="n">0{i + 1}</span><div><b>{t}</b><br /><span style={{ color: "var(--muted)" }}>{d}</span></div></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
