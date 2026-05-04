function App() {
  const [tab, setTab] = useState("home");

  const TABS = [
    { id: "home",       slug: "home",       label: "首頁" },
    { id: "itinerary",  slug: "itinerary",  label: "行程" },
    { id: "todo",       slug: "LIST",       label: "待辦" },
    { id: "map",        slug: "MAP",        label: "地圖" },
    { id: "budget",     slug: "COST",       label: "預算" },
    { id: "settings",   slug: "SETTING",    label: "設定" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFF8FA", overflow: "hidden", borderRadius: 38 }}>
      <main style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
        {tab === "home"      && <HomeScreen onNavigate={setTab} />}
        {tab === "itinerary" && <ItineraryScreen />}
        {tab === "map"       && <MapScreen />}
        {tab === "budget"    && <BudgetScreen />}
        {tab === "settings"  && <SettingsScreen />}
        {tab === "todo"      && (
          <div style={{ padding: "52px 24px", display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
            <h2 style={{ margin: 0, fontFamily: "Nunito", fontWeight: 800, fontSize: 22, color: "#6B1A3C", alignSelf: "flex-start" }}>待辦</h2>
            <img src="../../assets/stickers/bear-receipt.png" style={{ width: 180, height: 180, objectFit: "contain", marginTop: 60 }} />
            <p style={{ margin: "10px 0 0", fontFamily: "Nunito", fontWeight: 800, fontSize: 16, color: "#6B1A3C" }}>收到!</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ADA0A5" }}>把出發前要做的事情列下來吧～</p>
            <button style={{ marginTop: 16, padding: "10px 22px", background: "#FF6FA3", color: "#fff", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 20px rgba(255,172,187,.3)" }}>＋ 新增待辦</button>
          </div>
        )}
      </main>

      {/* bottom nav */}
      <nav style={{
        flexShrink: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderTop: "1px solid #FED7DD", padding: "8px 4px 14px",
        display: "flex", justifyContent: "space-around",
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: "none", border: "none", padding: "4px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", flex: 1 }}>
              <BearIcon slug={t.slug} size={26} active={active} />
              <span style={{ fontSize: 9, fontWeight: 800, color: active ? "#FF6FA3" : "#FFACBB", marginTop: 2 }}>{t.label}</span>
              <span style={{ width: 4, height: 4, borderRadius: 9999, background: active ? "#FF8FAF" : "transparent", marginTop: 1 }} />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

window.App = App;
