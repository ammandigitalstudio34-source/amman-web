// Static data used across the site.

export const CITIES = {
  Chennai: [13.08, 80.27], Coimbatore: [11.02, 76.96], Madurai: [9.93, 78.12],
  Tiruchirappalli: [10.79, 78.70], Salem: [11.66, 78.15], Tirunelveli: [8.71, 77.76],
  Vellore: [12.92, 79.13], Erode: [11.34, 77.72], Thanjavur: [10.79, 79.14],
  Puducherry: [11.94, 79.81], Bengaluru: [12.97, 77.59], Kanyakumari: [8.08, 77.54],
};
export const CITY_NAMES = Object.keys(CITIES);

export const TYPES = [
  "Wedding", "Engagement", "Reception", "Birthday", "Baby Shower", "Puberty Ceremony",
  "Housewarming", "Temple Festival", "Corporate Event", "Ear Piercing", "Portrait", "Product Shoot",
];

// function type (board / post form)  ->  photographer tag (featured filters)
export const TYPE_TO_TAG = {
  Wedding: "Wedding", Reception: "Wedding", Engagement: "Wedding", Birthday: "Birthday", "Ear Piercing": "Birthday",
  "Baby Shower": "Baby Shoot", "Corporate Event": "Events", "Temple Festival": "Events", Housewarming: "Events",
  "Puberty Ceremony": "Events", Portrait: "Portrait", "Product Shoot": "Products",
};
// photographer tag  ->  function type (used by "Book Now")
export const TAG_TO_TYPE = { Events: "Corporate Event", "Baby Shoot": "Baby Shower", Products: "Product Shoot" };

export const FP_FILTERS = ["All", "Wedding", "Birthday", "Events", "Portrait", "Baby Shoot", "Products"];

const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export { day };

// Real functions only (posted with "Post a function"). Old demo functions had ids 1-8 — strip them from saved data.
export const withoutDemoGigs = (list) => (Array.isArray(list) ? list.filter((g) => !(typeof g.id === "number" && g.id <= 8)) : []);

export const SCENES = {
  park: "radial-gradient(circle at 20% 30%,#f6e7a855,transparent 25%),radial-gradient(circle at 80% 20%,#d7e98a55,transparent 22%),linear-gradient(160deg,#9db35a,#5d7a2e 55%,#2f4519)",
  flowers: "radial-gradient(circle at 15% 25%,#ff9ec4cc,transparent 14%),radial-gradient(circle at 30% 70%,#ff7fb0aa,transparent 12%),radial-gradient(circle at 80% 15%,#ffb3d1bb,transparent 14%),radial-gradient(circle at 70% 60%,#ffd1e1aa,transparent 12%),linear-gradient(160deg,#6f9a4a,#3e6a2a 60%,#24401a)",
  city: "linear-gradient(0deg,#8b8f97 0%,#8b8f9700 40%),repeating-linear-gradient(90deg,#9aa0a8 0 28px,#b2b6bc 28px 46px,#a3a8ae 46px 80px),linear-gradient(180deg,#efe2cf,#d4c8b6)",
  garden: "radial-gradient(circle at 25% 25%,#e8f2a066,transparent 22%),radial-gradient(circle at 85% 40%,#c8e07a55,transparent 20%),linear-gradient(160deg,#7fa64a,#4a7a2e 55%,#25421a)",
  studio: "radial-gradient(circle at 50% 35%,#ffffffaa,transparent 45%),linear-gradient(160deg,#d9cfe9,#a89cc2)",
  sunset: "radial-gradient(circle at 70% 75%,#ffb36baa,transparent 40%),linear-gradient(180deg,#f3c58f,#d57a6a 60%,#6a3b5c)",
};

// Storage keys — shared with the admin page so both see the same data
export const KEYS = {
  gigs: "lenscall_gigs_v1",
  city: "lenscall_city",
  profiles: "es_profiles",
  myId: "es_my_id",
  chats: "es_chats",
  chatMeta: "es_chat_meta",
  seenUser: "es_chat_seen_user",
  seenAdmin: "es_chat_seen_admin",
  favs: "es_favs",
};
