// FlightCard — Apple-Wallet style swipeable boarding pass
function FlightCard() {
  const [idx, setIdx] = useState(0);
  const f = TRIP.flights[idx];
  return (
    <div>
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #FED7DD" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 12, background: "#FFF8FA", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF6FA3" }}>
              <Icon name="plane" size={14} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1416" }}>{f.airline}</div>
              <div style={{ fontFamily: "DM Mono", fontSize: 10, color: "#ADA0A5" }}>{f.num}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Pill variant="soft" style={{ padding: "3px 10px", fontSize: 11 }}>{f.dir}</Pill>
            <span style={{ fontSize: 10, color: "#D5C5CA" }}>{f.cabin}</span>
          </div>
        </div>

        <div style={{ padding: "16px 18px", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#ADA0A5", marginBottom: 2 }}>{f.date}</div>
            <div style={{ fontFamily: "DM Mono", fontSize: 28, fontWeight: 600, color: "#1A1416", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{f.dep}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#3A2E32", marginTop: 4, lineHeight: 1 }}>{f.from.code}</div>
            <div style={{ fontSize: 10, color: "#ADA0A5", marginTop: 2 }}>{f.from.name}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 14px" }}>
            <span style={{ fontSize: 10, color: "#D5C5CA", marginBottom: 6 }}>{f.dur}</span>
            <div style={{ display: "flex", alignItems: "center", width: 80 }}>
              <div style={{ flex: 1, height: 1, background: "#E0D0D5" }} />
              <div style={{ width: 5, height: 5, borderRadius: 5, background: "#D5C5CA", margin: "0 2px" }} />
              <Icon name="plane" size={11} color="#D5C5CA" />
              <div style={{ width: 5, height: 5, borderRadius: 5, background: "#D5C5CA", margin: "0 2px" }} />
              <div style={{ flex: 1, height: 1, background: "#E0D0D5" }} />
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "transparent", marginBottom: 2 }}>—</div>
            <div style={{ fontFamily: "DM Mono", fontSize: 28, fontWeight: 600, color: "#1A1416", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{f.arr}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#3A2E32", marginTop: 4, lineHeight: 1 }}>{f.to.code}</div>
            <div style={{ fontSize: 10, color: "#ADA0A5", marginTop: 2 }}>{f.to.name}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 18, height: 18, borderRadius: 9999, background: "#FFF8FA", marginLeft: -9 }} />
          <div style={{ flex: 1, borderTop: "1.5px dashed #E0D0D5" }} />
          <div style={{ width: 18, height: 18, borderRadius: 9999, background: "#FFF8FA", marginRight: -9 }} />
        </div>

        <div style={{ padding: "12px 18px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ color: "#5A4452", fontWeight: 600 }}>YU-HSIN LIANG</span>
            <span style={{ color: "#ADA0A5" }}>🎒 10kg · 🧳 15kg</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ color: "#5A4452", fontWeight: 600 }}>YU-XIN LO</span>
            <span style={{ color: "#ADA0A5" }}>🎒 10kg · 🧳 15kg</span>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
        {TRIP.flights.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{
              height: 6, borderRadius: 9999, border: "none", cursor: "pointer",
              width: i === idx ? 20 : 6,
              background: i === idx ? "#FF6FA3" : "#FFBFCA",
              transition: "all 300ms",
            }} />
        ))}
      </div>
    </div>
  );
}

// Donut chart for expenses
function Donut({ data, total }) {
  const cx = 44, cy = 44, r = 32, sw = 12, C = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width={88} height={88} viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FED7DD" strokeWidth={sw} />
      <g transform={`rotate(-90,${cx},${cy})`}>
        {data.map((s, i) => {
          const off = -cum * C; cum += s.percent;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
            strokeWidth={sw} strokeDasharray={`${s.percent * C} ${C}`} strokeDashoffset={off} />;
        })}
      </g>
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="8" fill="#E8538C" fontWeight="700">已花</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="11" fill="#9C2B58" fontWeight="700" fontFamily="DM Mono">
        {total >= 10000 ? `${(total/10000).toFixed(1)}萬` : total.toLocaleString()}
      </text>
    </svg>
  );
}

function HomeScreen({ onNavigate }) {
  const [section, setSection] = useState("flight");
  const SECTIONS = [
    { id: "flight",        label: "航班資訊", icon: "plane"  },
    { id: "expenses",      label: "已花費用", icon: "wallet" },
    { id: "accommodation", label: "住宿資訊", icon: "bed"    },
    { id: "merchants",     label: "商家",     icon: "store"  },
    { id: "attractions",   label: "景點",     icon: "compass"},
  ];

  const totals = TRIP.expenses.reduce((acc, e) => {
    acc.total += e.amount;
    acc.byCat[e.cat] = (acc.byCat[e.cat] || 0) + e.amount;
    return acc;
  }, { total: 0, byCat: {} });
  const sortedCats = Object.entries(totals.byCat)
    .map(([cat, amt]) => ({ cat, amt, color: CATEGORY_COLORS[cat], label: CATEGORY_LABELS[cat] }))
    .sort((a, b) => b.amt - a.amt);
  const pieData = sortedCats.map(e => ({ color: e.color, percent: e.amt / totals.total }));

  return (
    <div style={{ paddingBottom: 32, background: "#FFF8FA", minHeight: "100%" }}>
      {/* Header */}
      <header style={{ padding: "56px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontFamily: "Nunito", fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em", color: "#6B1A3C" }}>
          🎀✨Cindy's Paradise☁️💖
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          {["upload","download"].map(n => (
            <button key={n} style={{ width: 36, height: 36, borderRadius: 9999, background: "#fff", border: "1px solid #FED7DD", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#FF6FA3", cursor: "pointer" }}>
              <Icon name={n} size={15} />
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Hero trip card */}
        <div onClick={() => onNavigate("itinerary")} style={{ position: "relative", height: 192, borderRadius: 28, overflow: "hidden", boxShadow: "0 8px 32px rgba(255,111,163,0.12)", cursor: "pointer" }}>
          <img src={TRIP.cover} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.2) 50%, transparent)" }} />
          <div style={{ position: "absolute", top: 14, right: 14 }}>
            <Pill variant="glass">還有 {TRIP.daysUntil} 天</Pill>
          </div>
          <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, color: "#fff" }}>
            <Pill variant="glass" style={{ fontSize: 10, padding: "3px 10px" }} icon={<Icon name="pin" size={10} />}>{TRIP.destination}</Pill>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: "Nunito", fontWeight: 800, fontSize: 19, lineHeight: 1.1 }}>{TRIP.title}</h3>
                <p style={{ margin: "3px 0 0", fontSize: 11, opacity: 0.78 }}>{TRIP.startDate} → {TRIP.endDate} · 5 天</p>
              </div>
              <Pill variant="glass" style={{ fontSize: 11 }} icon={<span>›</span>}>行程</Pill>
            </div>
          </div>
        </div>

        {/* pill tabs */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {SECTIONS.map(s => (
            <Pill key={s.id} variant={section === s.id ? "primary" : "outline"}
              onClick={() => setSection(s.id)}
              icon={<Icon name={s.icon} size={11} />}>{s.label}</Pill>
          ))}
        </div>

        {/* section content */}
        {section === "flight" && <FlightCard />}
        {section === "expenses" && (
          <Card padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#3A2E32" }}>共用費用</span>
              <span style={{ fontSize: 10, color: "#ADA0A5", display: "inline-flex", alignItems: "center" }}>明細 ›</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Donut data={pieData} total={totals.total} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {sortedCats.slice(0, 4).map(e => (
                  <div key={e.cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: e.color }} />
                    <span style={{ flex: 1, fontSize: 12, color: "#5A4452", fontWeight: 500 }}>{e.label}</span>
                    <span style={{ fontFamily: "DM Mono", fontSize: 10, color: "#ADA0A5" }}>{Math.round(e.amt/totals.total*100)}%</span>
                  </div>
                ))}
                <div style={{ paddingTop: 6, borderTop: "1px solid #FED7DD", marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: "#ADA0A5" }}>5 筆 · </span>
                  <span style={{ fontFamily: "DM Mono", fontWeight: 700, color: "#C23E73", fontSize: 11 }}>KRW {totals.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>
        )}
        {section === "accommodation" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
            <img src="../../assets/stickers/bear-sleep.png" style={{ width: 130, height: 130, objectFit: "contain", opacity: 0.95 }} />
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#ADA0A5" }}>尚無收藏住宿</p>
            <button style={{ marginTop: 12, padding: "8px 18px", background: "#FED7DD", color: "#FF6FA3", border: "none", borderRadius: 9999, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>＋ 新增住宿</button>
          </div>
        )}
        {section === "merchants" && (
          <Card padding={16}>
            <p style={{ margin: "0 0 10px", fontSize: 10, color: "#ADA0A5" }}>收藏商家 IG / 小紅書 / Threads 連結</p>
            {[{ e: "☕", n: "咖啡廳", c: 4 }, { e: "👗", n: "衣服", c: 2 }].map(c => (
              <div key={c.n} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #FED7DD" }}>
                <span style={{ fontSize: 20, marginRight: 10 }}>{c.e}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#3A2E32" }}>{c.n}</div>
                  <div style={{ fontSize: 10, color: "#ADA0A5" }}>{c.c} 個連結</div>
                </div>
                <span style={{ color: "#ADA0A5" }}><Icon name="chevD" size={14} /></span>
              </div>
            ))}
            <button style={{ marginTop: 10, width: "100%", padding: "10px", background: "#FFF8FA", border: "2px dashed #FFBFCA", borderRadius: 14, color: "#FF8FAF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>＋ 新增分類</button>
          </Card>
        )}
        {section === "attractions" && (
          <Card padding={16}>
            <p style={{ margin: "0 0 10px", fontSize: 10, color: "#ADA0A5" }}>收藏景點 IG / 小紅書 連結</p>
            {[{ e: "🗺️", n: "景點", c: 6 }, { e: "🍜", n: "美食", c: 3 }].map(c => (
              <div key={c.n} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #FED7DD" }}>
                <span style={{ fontSize: 20, marginRight: 10 }}>{c.e}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#3A2E32" }}>{c.n}</div>
                  <div style={{ fontSize: 10, color: "#ADA0A5" }}>{c.c} 個連結</div>
                </div>
                <span style={{ color: "#ADA0A5" }}><Icon name="chevD" size={14} /></span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
