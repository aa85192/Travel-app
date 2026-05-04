function BudgetScreen() {
  const total = TRIP.expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = Math.round(total / TRIP.participants.length);

  return (
    <div style={{ paddingBottom: 32, background: "#FFF8FA", minHeight: "100%" }}>
      <header style={{ padding: "52px 24px 14px" }}>
        <h2 style={{ margin: 0, fontFamily: "Nunito", fontWeight: 800, fontSize: 22, color: "#6B1A3C" }}>預算</h2>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#ADA0A5" }}>5 筆共用支出</p>
      </header>

      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* summary */}
        <Card padding={18} style={{ background: "linear-gradient(135deg, #FFD4B8 0%, #FFACBB 100%)", border: "none" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#fff", opacity: 0.85, fontWeight: 700 }}>本次旅行總花費</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: "DM Mono", fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{(total/10000).toFixed(1)}萬</span>
            <span style={{ fontSize: 13, color: "#fff", opacity: 0.85, fontWeight: 700 }}>KRW</span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#fff", opacity: 0.85 }}>每人約 ₩{perPerson.toLocaleString()}</p>
        </Card>

        {/* split with whom */}
        <Card padding={14}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ADA0A5", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>同行夥伴</div>
          <div style={{ display: "flex", gap: 10 }}>
            {TRIP.participants.map(p => (
              <div key={p.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 44, height: 44, borderRadius: 9999, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{p.emoji}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#3A2E32" }}>{p.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* expense list */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#ADA0A5", letterSpacing: ".04em", textTransform: "uppercase", marginTop: 4 }}>支出明細</div>
        {TRIP.expenses.map(e => (
          <Card key={e.id} padding={14}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: e.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {CATEGORY_EMOJI[e.cat]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3A2E32" }}>{e.title}</div>
                <div style={{ fontSize: 10, color: "#ADA0A5" }}>{e.date} · {e.payer} 付款</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "DM Mono", fontSize: 14, fontWeight: 700, color: "#9C2B58" }}>₩{e.amount.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: "#ADA0A5" }}>分 3 人</div>
              </div>
            </div>
          </Card>
        ))}

        <button style={{ marginTop: 4, padding: "12px", background: "#FFF8FA", border: "2px dashed #FFBFCA", borderRadius: 18, color: "#FF8FAF", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          ＋ 新增支出
        </button>
      </div>
    </div>
  );
}

window.BudgetScreen = BudgetScreen;
