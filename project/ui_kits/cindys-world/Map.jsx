function MapScreen() {
  const spots = TRIP.days[0].spots;
  return (
    <div style={{ position: "relative", height: "100%", background: "#FFF8FA" }}>
      <header style={{ padding: "52px 24px 14px", position: "relative", zIndex: 2 }}>
        <h2 style={{ margin: 0, fontFamily: "Nunito", fontWeight: 800, fontSize: 22, color: "#6B1A3C" }}>地圖</h2>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#ADA0A5" }}>Day 1 · 古宮巡禮</p>
      </header>

      {/* faux map */}
      <div style={{ position: "absolute", left: 16, right: 16, top: 110, bottom: 96, borderRadius: 28, overflow: "hidden", border: "1px solid #FED7DD", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #F5EDEF 0%, #FFE9EE 50%, #FFD8E2 100%)" }} />
        {/* map vector flourishes */}
        <svg viewBox="0 0 400 600" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d="M0,240 C80,200 200,260 280,210 S400,230 420,210" stroke="#FFBFCA" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M0,360 C100,330 220,380 320,340 S400,350 420,340" stroke="#FED7DD" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M70,500 C130,460 260,520 360,470" stroke="#AAB6FB" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
          <circle cx="80" cy="240" r="80" fill="#99F2E6" opacity="0.3" />
          <circle cx="320" cy="160" r="50" fill="#FFFEE1" opacity="0.6" />
          <circle cx="280" cy="450" r="60" fill="#B8DCFF" opacity="0.4" />
          {/* path connecting spots */}
          <path d="M120,200 Q200,260 240,320 T160,440" stroke="#FF6FA3" strokeWidth="2.5" strokeDasharray="6 6" fill="none" strokeLinecap="round" />
        </svg>

        {/* pins */}
        {spots.map((s, i) => {
          const positions = [{ left: 100, top: 180 }, { left: 230, top: 300 }, { left: 140, top: 420 }];
          const pos = positions[i];
          return (
            <div key={s.id} style={{ position: "absolute", ...pos, transform: "translate(-50%, -100%)" }}>
              <div style={{
                position: "relative", padding: "6px 10px 6px 6px",
                background: "#fff", borderRadius: 9999, boxShadow: "0 4px 16px rgba(255,111,163,0.25)",
                display: "flex", alignItems: "center", gap: 6,
                border: "2px solid " + CATEGORY_COLORS[s.cat],
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9999, background: CATEGORY_COLORS[s.cat],
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>{s.emoji}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#3A2E32", lineHeight: 1 }}>{s.name}</div>
                  <div style={{ fontSize: 9, color: "#ADA0A5", marginTop: 1 }}>{i + 1}/{spots.length}</div>
                </div>
              </div>
              <div style={{
                width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
                borderTop: "8px solid " + CATEGORY_COLORS[s.cat],
                margin: "-1px auto 0", filter: "drop-shadow(0 2px 4px rgba(255,111,163,.15))",
              }} />
            </div>
          );
        })}
      </div>

      {/* bottom card */}
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, zIndex: 3 }}>
        <Card padding={14}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FFACBB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏯</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 14, color: "#3A2E32" }}>景福宮</div>
              <div style={{ fontSize: 10, color: "#ADA0A5" }}>경복궁 · 鍾路區社稷路 161</div>
            </div>
            <button style={{ width: 36, height: 36, borderRadius: 9999, background: "#FF6FA3", color: "#fff", border: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon name="chev" size={14} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

window.MapScreen = MapScreen;
