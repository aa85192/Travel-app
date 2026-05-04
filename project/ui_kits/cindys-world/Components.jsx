/* shared by all UI-kit screens */
const { useState, useMemo, useRef, useEffect } = React;

// ─── Bear nav icon ───────────────────────────────────────────────
const BearIcon = ({ slug, size = 28, active = false }) => (
  <img
    src={`../../assets/bear-icons/${slug}.png`}
    alt=""
    width={size}
    height={size}
    style={{
      display: "block",
      mixBlendMode: "multiply",
      objectFit: "contain",
      filter: active ? "none" : "saturate(0.6) opacity(0.55)",
      transform: active ? "translateY(-3px) scale(1.18)" : "none",
      transition: "transform 240ms cubic-bezier(.22,1,.36,1)",
    }}
  />
);

// ─── Pill ────────────────────────────────────────────────────────
const Pill = ({ children, variant = "soft", style, onClick, icon }) => {
  const variants = {
    primary: { background: "#FF6FA3", color: "#fff", border: "1px solid transparent" },
    outline: { background: "#fff", color: "#FF6FA3", border: "1px solid #FFBFCA" },
    soft:    { background: "#FFF8FA", color: "#FF6FA3", border: "1px solid #FED7DD" },
    glass:   { background: "rgba(255,255,255,0.22)", color: "#fff", border: "1px solid transparent", backdropFilter: "blur(8px)" },
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 14px", borderRadius: 9999,
        fontSize: 12, fontWeight: 700, fontFamily: "inherit",
        whiteSpace: "nowrap", cursor: "pointer",
        ...variants[variant], ...style,
      }}
    >
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      {children}
    </button>
  );
};

// ─── Card ────────────────────────────────────────────────────────
const Card = ({ children, padding = 16, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "#fff",
      border: "1px solid #FED7DD",
      borderRadius: 24,
      boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
      padding,
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Tiny lucide-style stroke icons (SVG inline; only chrome glyphs) ──
const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 2 }) => {
  const paths = {
    plane: "M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
    pin: "M12 22s-8-7-8-13a8 8 0 0 1 16 0c0 6-8 13-8 13z M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    chev: "M9 6l6 6-6 6",
    chevD: "M6 9l6 6 6-6",
    plus: "M12 5v14 M5 12h14",
    wallet: "M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z M3 10h18 M16 14h2",
    map: "M9 3l-6 3v15l6-3 6 3 6-3V3l-6 3-6-3z M9 3v15 M15 6v15",
    download: "M12 3v12 M7 10l5 5 5-5 M3 19h18",
    upload: "M12 19V7 M7 12l5-5 5 5 M3 19h18",
    edit: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    trash: "M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
    check: "M5 12l5 5L20 7",
    x: "M6 6l12 12 M18 6L6 18",
    bed: "M3 18V8 M21 18v-6 H3 M3 12h18 M7 12V8a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3",
    store: "M3 9l1-5h16l1 5 M5 9v11h14V9 M9 22V13h6v9",
    compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M16 8l-2 6-6 2 2-6 6-2z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name].split(" M ").map((p, i) => (
        <path key={i} d={i === 0 ? p : "M " + p} />
      ))}
    </svg>
  );
};

// ─── Trip data (matches src/data.ts shape) ───────────────────────
const TRIP = {
  title: "首爾五天四夜 ☕",
  destination: "Seoul, Korea",
  startDate: "2026-06-05",
  endDate: "2026-06-09",
  cover: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&q=80&w=1000",
  daysUntil: 32,
  days: [
    { n: 1, date: "2026-06-05", title: "古宮巡禮 🏯", spots: [
      { id: "s1", name: "景福宮", ko: "경복궁", cat: "attraction", emoji: "🏯",
        photo: "https://images.unsplash.com/photo-1538669715515-5c3758c07ba9?auto=format&fit=crop&q=80&w=800",
        hours: "09:00–18:00", duration: 120, cost: 3000, rating: 4.6,
        notes: "建議穿韓服免費入場！光化門守衛交接 10:00/14:00",
        tags: ["#宮殿","#韓服","#歷史"] },
      { id: "s2", name: "北村韓屋村", ko: "북촌한옥마을", cat: "attraction", emoji: "🏘️",
        photo: "https://images.unsplash.com/photo-1578469645742-46cae010e5d4?auto=format&fit=crop&q=80&w=800",
        hours: "全天開放", duration: 90, cost: 0, rating: 4.3,
        notes: "安靜散步，注意不要打擾居民",
        tags: ["#韓屋","#拍照","#散步"] },
      { id: "s3", name: "On Ne Sait Jamais", ko: "옹느세자매", cat: "cafe", emoji: "☕",
        photo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800",
        hours: "11:00–21:00", duration: 60, cost: 12000, rating: 4.5,
        notes: "澡堂風格咖啡廳，蒙布朗很有名！",
        tags: ["#咖啡廳","#甜點","#特色"] },
    ], transits: [
      { from: "s1", to: "s2", mode: "walking", duration: 15, distance: 1100, desc: "沿三清洞路步行" },
      { from: "s2", to: "s3", mode: "subway", duration: 25, distance: 4500, cost: 1400, desc: "安國站 → 漢江鎮站" },
    ]},
    { n: 2, date: "2026-06-06", title: "弘大 & 明洞 🛍️", spots: [], transits: [] },
    { n: 3, date: "2026-06-07", title: "漢江 & 樂天世界 🎡", spots: [], transits: [] },
    { n: 4, date: "2026-06-08", title: "仁寺洞 & 東大門 🌃", spots: [], transits: [] },
    { n: 5, date: "2026-06-09", title: "返程 ✈️", spots: [], transits: [] },
  ],
  flights: [
    { dir: "去程", airline: "Air Busan", num: "BX796", cabin: "經濟艙", date: "2026.06.05",
      from: { code: "KHH", name: "高雄國際機場" }, to: { code: "PUS", name: "金海國際機場" },
      dep: "14:15", arr: "17:55", dur: "2h 40m" },
    { dir: "回程", airline: "Jeju Air", num: "7C6255", cabin: "經濟艙", date: "2026.06.09",
      from: { code: "PUS", name: "金海國際機場" }, to: { code: "KHH", name: "高雄國際機場" },
      dep: "14:15", arr: "16:00", dur: "2h 45m" },
  ],
  expenses: [
    { id: "e1", title: "景福宮門票", amount: 9000, cat: "attraction", color: "#FFACBB", date: "06-05", payer: "我" },
    { id: "e2", title: "韓式烤肉晚餐", amount: 75000, cat: "restaurant", color: "#AAB6FB", date: "06-05", payer: "小美" },
    { id: "e3", title: "弘大咖啡廳", amount: 12000, cat: "cafe", color: "#FFD4B8", date: "06-06", payer: "我" },
    { id: "e4", title: "明洞美妝", amount: 38000, cat: "shopping", color: "#C5B8FF", date: "06-06", payer: "我" },
    { id: "e5", title: "民宿一晚", amount: 95000, cat: "hotel", color: "#B8DCFF", date: "06-06", payer: "阿強" },
  ],
  participants: [
    { id: "p1", name: "我", emoji: "🐱", color: "#FFACBB" },
    { id: "p2", name: "小美", emoji: "🐰", color: "#AAB6FB" },
    { id: "p3", name: "阿強", emoji: "🐻", color: "#99F2E6" },
  ],
};

const CATEGORY_COLORS = {
  restaurant: "#AAB6FB", attraction: "#FFACBB", cafe: "#FFD4B8",
  shopping: "#C5B8FF", hotel: "#B8DCFF", activity: "#FFE4A0",
};
const CATEGORY_LABELS = {
  restaurant: "餐廳", attraction: "景點", cafe: "咖啡廳",
  shopping: "購物", hotel: "住宿", activity: "活動",
};
const CATEGORY_EMOJI = {
  restaurant: "🍜", attraction: "🗺️", cafe: "☕",
  shopping: "🛍️", hotel: "🏨", activity: "🎡",
};

Object.assign(window, { useState, useMemo, useRef, useEffect, BearIcon, Pill, Card, Icon, TRIP, CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_EMOJI });
