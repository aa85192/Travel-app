function SettingsScreen() {
  const [hue, setHue] = useState(340);
  const [dark, setDark] = useState(false);

  return (
    <div style={{ paddingBottom: 32, background: "#FFF8FA", minHeight: "100%" }}>
      <header style={{ padding: "52px 24px 14px" }}>
        <h2 style={{ margin: 0, fontFamily: "Nunito", fontWeight: 800, fontSize: 22, color: "#6B1A3C" }}>設定</h2>
      </header>

      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* profile card */}
        <Card padding={18} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="../../assets/stickers/bear-sparkle.png" style={{ width: 56, height: 56, objectFit: "contain" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 16, color: "#6B1A3C" }}>Cindy</div>
            <div style={{ fontSize: 11, color: "#ADA0A5" }}>ENFJ · 25 · 高雄 → 首爾</div>
          </div>
        </Card>

        {/* theme hue picker */}
        <Card padding={16}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#3A2E32", marginBottom: 12 }}>主題色 🎨</div>
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 12px" }}>
            <div style={{
              width: 140, height: 140, borderRadius: 9999,
              background: `conic-gradient(from 0deg, hsl(0,80%,75%), hsl(60,80%,75%), hsl(120,80%,75%), hsl(180,80%,75%), hsl(240,80%,75%), hsl(300,80%,75%), hsl(360,80%,75%))`,
              position: "relative",
              boxShadow: "0 4px 20px rgba(255,111,163,0.18)",
            }}>
              <div style={{
                position: "absolute", inset: 12, borderRadius: 9999, background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 9999, background: `hsl(${hue},85%,72%)`, border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }} />
              </div>
              <div style={{
                position: "absolute", left: "50%", top: 0,
                transform: `rotate(${hue}deg) translate(-50%, -2px)`,
                transformOrigin: "0 70px",
                width: 18, height: 18, borderRadius: 9999, background: `hsl(${hue},85%,72%)`,
                border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }} />
            </div>
          </div>
          <input type="range" min="0" max="360" value={hue} onChange={e => setHue(+e.target.value)}
            style={{ width: "100%", accentColor: `hsl(${hue},85%,72%)` }} />
          <div style={{ textAlign: "center", marginTop: 4, fontFamily: "DM Mono", fontSize: 11, color: "#ADA0A5" }}>hue {hue}°</div>
        </Card>

        {/* row settings */}
        <Card padding={0}>
          {[
            { icon: "🌙", label: "深色模式", toggle: true, value: dark, onToggle: () => setDark(d => !d) },
            { icon: "🐻", label: "熊熊圖示", value: "已自訂 6 張" },
            { icon: "🔒", label: "更改密碼", value: "" },
            { icon: "☁️", label: "雲端同步", value: "已連線" },
            { icon: "📤", label: "匯出資料", value: "" },
          ].map((r, i, arr) => (
            <div key={r.label} onClick={r.onToggle}
              style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: i === arr.length - 1 ? "none" : "1px solid #FED7DD", cursor: r.onToggle ? "pointer" : "default" }}>
              <span style={{ fontSize: 18, marginRight: 12 }}>{r.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#3A2E32" }}>{r.label}</span>
              {r.toggle ? (
                <div style={{ width: 38, height: 22, borderRadius: 9999, background: r.value ? "#FF6FA3" : "#FED7DD", position: "relative", transition: "background 200ms" }}>
                  <div style={{ position: "absolute", top: 2, left: r.value ? 18 : 2, width: 18, height: 18, borderRadius: 9999, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 200ms" }} />
                </div>
              ) : (
                <span style={{ fontSize: 11, color: "#ADA0A5" }}>{r.value} ›</span>
              )}
            </div>
          ))}
        </Card>

        {/* footer sticker */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <img src="../../assets/stickers/bear-laptop.png" style={{ width: 130, height: 100, objectFit: "contain" }} />
          <p style={{ margin: "4px 0 0", fontSize: 10, color: "#ADA0A5" }}>Cindy's World v1.0 · made with 🎀</p>
        </div>
      </div>
    </div>
  );
}

window.SettingsScreen = SettingsScreen;
