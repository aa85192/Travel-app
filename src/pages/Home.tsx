import React, { useMemo, useState, useRef } from 'react';
import { Download, Upload, MapPin, ChevronRight, Wallet, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip } from '../types';
import { useUIStore } from '../stores/uiStore';

interface HomeProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onNavigate: (tab: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#AAB6FB',
  attraction: '#FFACBB',
  cafe:       '#FFD4B8',
  shopping:   '#C5B8FF',
  hotel:      '#B8DCFF',
  transport:  '#AAB6FB',
  activity:   '#FFE4A0',
  other:      '#FF8FAF',
};
const CATEGORY_LABELS: Record<string, string> = {
  restaurant: '餐廳', attraction: '景點', cafe: '咖啡廳',
  shopping: '購物', hotel: '住宿', transport: '交通',
  activity: '活動', other: '其他',
};

/* ── 航班資料 ── */
const FLIGHTS = [
  {
    direction: '去程',
    airline: 'Air Busan',
    flightNumber: 'BX796',
    cabin: '經濟艙',
    from: { code: 'KHH', name: '高雄國際機場' },
    to: { code: 'PUS', name: '金海國際機場' },
    departure: '14:15',
    arrival: '17:55',
    duration: '2h 40m',
    passengers: [
      { name: 'YU-HSIN LIANG', carryOn: '10 kg', checked: '15 kg' },
      { name: 'YU-XIN LO', carryOn: '10 kg', checked: '15 kg' },
    ],
    gradientFrom: '#4F46E5',
    gradientTo: '#7C3AED',
  },
  {
    direction: '回程',
    airline: 'Jeju Air',
    flightNumber: '7C6255',
    cabin: '經濟艙',
    from: { code: 'PUS', name: '金海國際機場' },
    to: { code: 'KHH', name: '高雄國際機場' },
    departure: '14:15',
    arrival: '16:00',
    duration: '2h 45m',
    passengers: [
      { name: 'YU-HSIN LIANG', carryOn: '10 kg', checked: '15 kg' },
      { name: 'YU-XIN LO', carryOn: '10 kg', checked: '15 kg' },
    ],
    gradientFrom: '#EA580C',
    gradientTo: '#F59E0B',
  },
];

/* ── 甜甜圈圓餅圖 ── */
function DonutChart({ data, total }: {
  data: { color: string; percent: number }[];
  total: number;
}) {
  const cx = 44, cy = 44, r = 32, sw = 12;
  const C = 2 * Math.PI * r;
  let cum = 0;

  return (
    <svg width={88} height={88} viewBox="0 0 88 88" className="flex-shrink-0">
      {/* 背景環 */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FED7DD" strokeWidth={sw} />
      {/* 資料環：以 -90° 旋轉讓起點在 12 點鐘 */}
      <g transform={`rotate(-90, ${cx}, ${cy})`}>
        {data.map((seg, i) => {
          const offset = -cum * C;
          cum += seg.percent;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={`${seg.percent * C} ${C}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </g>
      {/* 中心文字 */}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="7" fill="#E8538C" fontWeight="bold">
        已花
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fill="#9C2B58" fontWeight="bold" fontFamily="monospace">
        {total >= 10000 ? `${(total / 10000).toFixed(1)}萬` : total.toLocaleString()}
      </text>
    </svg>
  );
}

/* ── 航班卡片滑動器 ── */
function FlightCardSlider() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && index < FLIGHTS.length - 1) setIndex(i => i + 1);
    if (diff < -50 && index > 0) setIndex(i => i - 1);
  };

  const flight = FLIGHTS[index];

  return (
    <div>
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: index === 0 ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: index === 0 ? 40 : -40 }}
            transition={{ duration: 0.22 }}
            className="rounded-3xl overflow-hidden shadow-lg"
            style={{ background: `linear-gradient(135deg, ${flight.gradientFrom}, ${flight.gradientTo})` }}
          >
            {/* Top row: direction badge + airline + flight */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {flight.direction}
                  </span>
                  <span className="text-white/80 text-xs font-medium">{flight.cabin}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-extrabold text-base leading-tight">{flight.airline}</p>
                  <p className="text-white/70 text-xs font-mono">{flight.flightNumber}</p>
                </div>
              </div>

              {/* Route row */}
              <div className="flex items-center justify-between">
                {/* Departure */}
                <div className="text-left">
                  <p className="text-white text-3xl font-extrabold font-mono leading-none">{flight.departure}</p>
                  <p className="text-white font-bold text-lg mt-0.5">{flight.from.code}</p>
                  <p className="text-white/60 text-[10px] mt-0.5 max-w-[90px] leading-tight">{flight.from.name}</p>
                </div>

                {/* Duration + arrow */}
                <div className="flex flex-col items-center flex-1 mx-3">
                  <p className="text-white/70 text-[10px] mb-1">{flight.duration}</p>
                  <div className="flex items-center w-full">
                    <div className="flex-1 h-px bg-white/30" />
                    <Plane className="w-4 h-4 text-white mx-1.5 flex-shrink-0" />
                    <div className="flex-1 h-px bg-white/30" />
                  </div>
                </div>

                {/* Arrival */}
                <div className="text-right">
                  <p className="text-white text-3xl font-extrabold font-mono leading-none">{flight.arrival}</p>
                  <p className="text-white font-bold text-lg mt-0.5">{flight.to.code}</p>
                  <p className="text-white/60 text-[10px] mt-0.5 max-w-[90px] leading-tight text-right">{flight.to.name}</p>
                </div>
              </div>
            </div>

            {/* Dashed divider */}
            <div className="mx-5 border-t border-dashed border-white/25 my-2" />

            {/* Baggage section */}
            <div className="px-5 pb-4 space-y-1.5">
              {flight.passengers.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <p className="text-white/80 text-[11px] font-medium truncate flex-1 mr-2">{p.name}</p>
                  <div className="flex items-center space-x-2 text-[11px] text-white/70 flex-shrink-0">
                    <span>🎒 {p.carryOn}</span>
                    <span className="text-white/30">·</span>
                    <span>🧳 {p.checked}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center space-x-2 mt-3">
        {FLIGHTS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index
                ? 'w-4 bg-milk-tea-500'
                : 'w-1.5 bg-milk-tea-300/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── 主元件 ── */
export const Home: React.FC<HomeProps> = ({ trip, onUpdateTrip, onNavigate }) => {
  const { addToast } = useUIStore();

  /* 倒數天數 */
  const daysUntil = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    return Math.ceil((start.getTime() - today.getTime()) / 86400000);
  }, [trip.startDate]);

  /* 費用統計 */
  const { expensesByCategory, totalExpenses } = useMemo(() => {
    const map: Record<string, number> = {};
    trip.expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    const sorted = Object.entries(map)
      .map(([cat, amount]) => ({ cat, amount, color: CATEGORY_COLORS[cat] || '#D2A97D', label: CATEGORY_LABELS[cat] || cat }))
      .sort((a, b) => b.amount - a.amount);
    const total = sorted.reduce((s, x) => s + x.amount, 0);
    return { expensesByCategory: sorted, totalExpenses: total };
  }, [trip.expenses]);

  const pieData = expensesByCategory.map(e => ({
    color: e.color,
    percent: totalExpenses > 0 ? e.amount / totalExpenses : 0,
  }));

  /* 匯出 / 匯入 */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `milktea_trip_${trip.id}.json`; a.click();
    URL.revokeObjectURL(url);
    addToast('行程已匯出', 'success');
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { onUpdateTrip(JSON.parse(ev.target?.result as string)); addToast('行程匯入成功！', 'success'); }
      catch { addToast('匯入失敗，請檢查檔案格式。', 'error'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-24 min-h-screen bg-milk-tea-50">

      {/* ── Header ── */}
      <header className="px-6 pt-10 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-milk-tea-900">奶茶旅伴 🧋</h1>
          <p className="text-milk-tea-400 text-xs font-medium mt-0.5">MilkTea Travel</p>
        </div>
        <div className="flex space-x-2">
          <label className="w-9 h-9 bg-white rounded-full shadow-sm flex items-center justify-center border border-milk-tea-100 cursor-pointer">
            <Upload className="w-4 h-4 text-milk-tea-500" />
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={handleExport} className="w-9 h-9 bg-white rounded-full shadow-sm flex items-center justify-center border border-milk-tea-100">
            <Download className="w-4 h-4 text-milk-tea-500" />
          </button>
        </div>
      </header>

      <div className="px-6 space-y-4 mt-2">

        {/* ── Card 1：目前行程 ── */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          onClick={() => onNavigate('itinerary')}
          className="relative h-52 rounded-3xl overflow-hidden shadow-lg cursor-pointer"
        >
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* 倒數 badge */}
          <div className="absolute top-4 right-4">
            {daysUntil > 0 ? (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">
                還有 {daysUntil} 天
              </div>
            ) : daysUntil === 0 ? (
              <div className="bg-accent-coral/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">
                今天出發！
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">
                旅行中
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center text-[10px] font-bold bg-white/20 backdrop-blur-md w-fit px-2 py-0.5 rounded-full mb-2">
              <MapPin className="w-3 h-3 mr-1" />
              {trip.destination}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-xl font-extrabold leading-tight">{trip.title}</h3>
                <p className="text-xs opacity-75 mt-0.5">{trip.startDate} → {trip.endDate}・{trip.days.length} 天</p>
              </div>
              <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                <span className="text-xs font-bold">行程</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Card 2：航班資訊 ── */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Plane className="w-4 h-4 text-milk-tea-500" />
            <h2 className="text-sm font-extrabold text-milk-tea-800">航班資訊</h2>
          </div>
          <FlightCardSlider />
        </div>

        {/* ── Card 3：已花金額 + 圓餅圖 ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-milk-tea-100 p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Wallet className="w-4 h-4 text-milk-tea-500" />
            <h2 className="text-sm font-extrabold text-milk-tea-800">已花費用</h2>
            <button
              onClick={() => onNavigate('budget')}
              className="ml-auto text-[10px] text-milk-tea-400 hover:text-milk-tea-600 flex items-center"
            >
              查看明細 <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          {trip.expenses.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-milk-tea-300">
              <Wallet className="w-10 h-10 opacity-30 mb-2" />
              <p className="text-xs">尚無支出紀錄</p>
              <button
                onClick={() => onNavigate('budget')}
                className="mt-3 px-4 py-1.5 bg-milk-tea-100 text-milk-tea-500 rounded-full text-xs font-bold"
              >
                新增支出
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-5">
              {/* 圓餅圖 */}
              <DonutChart data={pieData} total={totalExpenses} />

              {/* 分類列表 */}
              <div className="flex-1 space-y-1.5 min-w-0">
                {expensesByCategory.slice(0, 4).map((e) => {
                  const pct = totalExpenses > 0 ? Math.round((e.amount / totalExpenses) * 100) : 0;
                  return (
                    <div key={e.cat} className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: e.color }}
                      />
                      <span className="text-xs text-milk-tea-700 font-medium truncate flex-1">{e.label}</span>
                      <span className="text-[10px] font-mono text-milk-tea-400 flex-shrink-0">{pct}%</span>
                    </div>
                  );
                })}
                {expensesByCategory.length > 4 && (
                  <p className="text-[10px] text-milk-tea-300 pl-4">
                    +{expensesByCategory.length - 4} 個類別
                  </p>
                )}
                <div className="pt-1 border-t border-milk-tea-100">
                  <p className="text-[10px] text-milk-tea-400">
                    共 {trip.expenses.length} 筆・
                    <span className="font-mono font-bold text-milk-tea-600">
                      {trip.expenses[0]?.currency || 'KRW'} {totalExpenses.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
