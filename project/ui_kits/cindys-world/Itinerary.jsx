function ItineraryScreen() {
  const [day, setDay] = useState(1);
  const d = TRIP.days.find(x => x.n === day);

  return (
    <div style={{ paddingBottom: 32, background: "#FFF8FA", minHeight: "100%" }}>
      <header style={{ padding: "52px 24px 14px" }}>
        <h2 style={{ margin: 0, fontFamily: "Nunito", fontWeight: 800, fontSize: 22, color: "#6B1A3C" }}>{TRIP.title}</h2>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#ADA0A5" }}>{TRIP.startDate} → {TRIP.endDate} · 5 天</p>
      </header>

      <div style={{ display: "flex", gap: 8, padding: "0 24px 14px", overflowX: "auto" }}>
        {TRIP.days.map(x => (
          <button key={x.n} onClick={() => setDay(x.n)}
            style={{
              flexShrink: 0,
              padding: "8px 14px", borderRadius: 14, border: "none",
              background: day === x.n ? "#FF6FA3" : "#fff",
              color: day === x.n ? "#fff" : "#FF6FA3",
              boxShadow: day === x.n ? "0 0 20px rgba(255,172,187,.3)" : "0 2px 8px rgba(255,111,163,.06)",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 64,
            }}>
            <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.75 }}>DAY</span>
            <span style={{ fontFamily: "DM Mono", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{x.n}</span>
            <span style={{ fontSize: 9, marginTop: 2, opacity: 0.85 }}>{x.date.slice(5)}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={{ margin: "4px 0 0", fontFamily: "Nunito", fontWeight: 800, fontSize: 17, color: "#6B1A3C" }}>{d.title}</h3>

        {d.spots.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
            <img src="../../assets/stickers/bear-sit.png" style={{ width: 120, height: 120 }} />
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#ADA0A5" }}>這天還沒安排～</p>
            <button style={{ marginTop: 12, padding: "8px 18px", background: "#FF6FA3", color: "#fff", border: "none", borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>＋ 新增景點</button>
          </div>
        ) : d.spots.map((s, i) => (
          <React.Fragment key={s.id}>
            <SpotCard spot={s} index={i} />
            {i < d.transits.length && <TransitCard t={d.transits[i]} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function SpotCard({ spot, index }) {
  const color = CATEGORY_COLORS[spot.cat];
  return (
    <Card padding={0} style={{ overflow: "hidden" }}>
      <div style={{ position: "relative", height: 130 }}>
        <img src={spot.photo} referrerPolicy="no-referrer" alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 50%)" }} />
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
          <Pill variant="glass" style={{ fontSize: 10, padding: "3px 10px" }}>
            {CATEGORY_EMOJI[spot.cat]} {CATEGORY_LABELS[spot.cat]}
          </Pill>
        </div>
        <div style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 9999, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#FF6FA3", fontFamily: "DM Mono" }}>{index + 1}</div>
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 10, color: "#fff" }}>
          <div style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>{spot.name}</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{spot.ko} · {spot.hours}</div>
        </div>
      </div>
      <div style={{ padding: "12px 16px 14px" }}>
        <p style={{ margin: 0, fontSize: 12, color: "#5A4452", lineHeight: 1.5 }}>{spot.notes}</p>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {spot.tags.map(t => (
            <span key={t} style={{ fontSize: 10, fontWeight: 700, color: "#5A4452", background: color + "55", padding: "3px 9px", borderRadius: 9999 }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px dashed #FED7DD" }}>
          <span style={{ fontSize: 10, color: "#ADA0A5" }}>⏱ {spot.duration}min · ⭐ {spot.rating}</span>
          <span style={{ fontFamily: "DM Mono", fontSize: 12, fontWeight: 700, color: "#9C2B58" }}>
            {spot.cost === 0 ? "免費" : `KRW ${spot.cost.toLocaleString()}`}
          </span>
        </div>
      </div>
    </Card>
  );
}

const TRANSPORT = {
  walking: { color: "#99F2E6", emoji: "🚶", label: "步行" },
  bus:     { color: "#AAB6FB", emoji: "🚌", label: "公車" },
  subway:  { color: "#C5B8FF", emoji: "🚇", label: "地鐵" },
  taxi:    { color: "#FFFEE1", emoji: "🚕", label: "計程車" },
};

function TransitCard({ t }) {
  const m = TRANSPORT[t.mode];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 22 }}>
      <div style={{ width: 1, alignSelf: "stretch", borderLeft: "2px dashed #E0D0D5", marginLeft: 11 }} />
      <div style={{
        flex: 1, background: m.color + "70", border: "1px solid " + m.color, borderRadius: 14,
        padding: "8px 12px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>{m.emoji}</span>
        <div style={{ flex: 1, fontSize: 11 }}>
          <div style={{ fontWeight: 700, color: "#3A2E32" }}>{m.label} · {t.duration}分</div>
          <div style={{ color: "#5A4452", opacity: 0.7, fontSize: 10 }}>{t.desc}</div>
        </div>
        {t.cost && <span style={{ fontFamily: "DM Mono", fontSize: 11, fontWeight: 700, color: "#5A4452" }}>₩{t.cost}</span>}
      </div>
    </div>
  );
}

window.ItineraryScreen = ItineraryScreen;
