import React, { useMemo, useState, useRef } from 'react';
import { Download, Upload, MapPin, ChevronRight, Wallet, Plane, ChevronDown,
  BedDouble, Store, Compass, Edit2, Check, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip, MerchantCategory } from '../types';
import { useUIStore } from '../stores/uiStore';

interface HomeProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onNavigate: (tab: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#AAB6FB', attraction: '#FFACBB', cafe: '#FFD4B8',
  shopping: '#C5B8FF', hotel: '#B8DCFF', transport: '#AAB6FB',
  activity: '#FFE4A0', other: '#FF8FAF',
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
    to:   { code: 'PUS', name: '金海國際機場' },
    departure: '14:15',
    arrival:   '17:55',
    duration:  '2h 40m',
    passengers: [
      { name: 'YU-HSIN LIANG', carryOn: '10 kg', checked: '15 kg' },
      { name: 'YU-XIN LO',     carryOn: '10 kg', checked: '15 kg' },
    ],
    gradientFrom: '#4F46E5',
    gradientTo:   '#7C3AED',
  },
  {
    direction: '回程',
    airline: 'Jeju Air',
    flightNumber: '7C6255',
    cabin: '經濟艙',
    from: { code: 'PUS', name: '金海國際機場' },
    to:   { code: 'KHH', name: '高雄國際機場' },
    departure: '14:15',
    arrival:   '16:00',
    duration:  '2h 45m',
    passengers: [
      { name: 'YU-HSIN LIANG', carryOn: '10 kg', checked: '15 kg' },
      { name: 'YU-XIN LO',     carryOn: '10 kg', checked: '15 kg' },
    ],
    gradientFrom: '#EA580C',
    gradientTo:   '#F59E0B',
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FED7DD" strokeWidth={sw} />
      <g transform={`rotate(-90, ${cx}, ${cy})`}>
        {data.map((seg, i) => {
          const offset = -cum * C;
          cum += seg.percent;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={sw}
              strokeDasharray={`${seg.percent * C} ${C}`}
              strokeDashoffset={offset} />
          );
        })}
      </g>
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="7" fill="#E8538C" fontWeight="bold">已花</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fill="#9C2B58" fontWeight="bold" fontFamily="monospace">
        {total >= 10000 ? `${(total / 10000).toFixed(1)}萬` : total.toLocaleString()}
      </text>
    </svg>
  );
}

/* ── 航班卡片滑動器（保留原色調與風格）── */
function FlightCardSlider() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff >  50 && index < FLIGHTS.length - 1) setIndex(i => i + 1);
    if (diff < -50 && index > 0)                  setIndex(i => i - 1);
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
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-white text-3xl font-extrabold font-mono leading-none">{flight.departure}</p>
                  <p className="text-white font-bold text-lg mt-0.5">{flight.from.code}</p>
                  <p className="text-white/60 text-[10px] mt-0.5 max-w-[90px] leading-tight">{flight.from.name}</p>
                </div>
                <div className="flex flex-col items-center flex-1 mx-3">
                  <p className="text-white/70 text-[10px] mb-1">{flight.duration}</p>
                  <div className="flex items-center w-full">
                    <div className="flex-1 h-px bg-white/30" />
                    <Plane className="w-4 h-4 text-white mx-1.5 flex-shrink-0" />
                    <div className="flex-1 h-px bg-white/30" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-3xl font-extrabold font-mono leading-none">{flight.arrival}</p>
                  <p className="text-white font-bold text-lg mt-0.5">{flight.to.code}</p>
                  <p className="text-white/60 text-[10px] mt-0.5 max-w-[90px] leading-tight text-right">{flight.to.name}</p>
                </div>
              </div>
            </div>
            <div className="mx-5 border-t border-dashed border-white/25 my-2" />
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
      <div className="flex justify-center space-x-2 mt-3">
        {FLIGHTS.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-4 bg-milk-tea-500' : 'w-1.5 bg-milk-tea-300/50'
            }`} />
        ))}
      </div>
    </div>
  );
}

/* ── 商家分類卡片區 ── */
function MerchantsSection({ trip, onUpdateTrip }: { trip: Trip; onUpdateTrip: (t: Trip) => void }) {
  const categories: MerchantCategory[] = trip.merchantCategories ?? [
    { id: 'mc1', name: '咖啡廳', emoji: '☕', color: '#FFD4B8' },
    { id: 'mc2', name: '衣服',   emoji: '👗', color: '#AAB6FB' },
  ];
  const [editing, setEditing] = useState<{ id: string; name: string; emoji: string } | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏪');

  const save = (cat: MerchantCategory) => {
    if (!editing) return;
    onUpdateTrip({ ...trip, merchantCategories: categories.map(c => c.id === cat.id ? { ...c, name: editing.name, emoji: editing.emoji } : c) });
    setEditing(null);
  };
  const remove = (id: string) => {
    onUpdateTrip({ ...trip, merchantCategories: categories.filter(c => c.id !== id) });
  };
  const addCategory = () => {
    if (!newName.trim()) return;
    const PALETTE = ['#FFD4B8','#AAB6FB','#99F2E6','#FFFEE1','#C5B8FF','#B8DCFF','#FFE4A0','#FFACBB'];
    const color = PALETTE[categories.length % PALETTE.length];
    onUpdateTrip({ ...trip, merchantCategories: [...categories, { id: `mc_${Date.now()}`, name: newName.trim(), emoji: newEmoji, color }] });
    setNewName(''); setNewEmoji('🏪'); setAddMode(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl p-4 border border-milk-tea-100 shadow-sm relative">
            <button onClick={() => remove(cat.id)} className="absolute top-2 right-2 text-milk-tea-200 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {editing?.id === cat.id ? (
              <div className="space-y-2">
                <input
                  value={editing.emoji}
                  onChange={e => setEditing({ ...editing, emoji: e.target.value })}
                  className="w-12 text-center text-xl bg-milk-tea-50 border border-milk-tea-100 rounded-lg p-1"
                  maxLength={2}
                />
                <input
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  className="w-full text-sm bg-milk-tea-50 border border-milk-tea-100 rounded-lg px-2 py-1"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button onClick={() => save(cat)} className="flex-1 py-1 bg-milk-tea-500 text-white rounded-lg text-xs font-bold flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditing(null)} className="flex-1 py-1 bg-milk-tea-100 text-milk-tea-400 rounded-lg text-xs font-bold flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-2xl mb-1.5">{cat.emoji}</div>
                <p className="text-sm font-bold text-milk-tea-800 leading-tight">{cat.name}</p>
                <button onClick={() => setEditing({ id: cat.id, name: cat.name, emoji: cat.emoji })}
                  className="flex items-center space-x-0.5 text-[10px] text-milk-tea-300 hover:text-milk-tea-500 mt-1.5 transition-colors">
                  <Edit2 className="w-2.5 h-2.5" /><span>編輯</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {addMode ? (
          <div className="bg-white rounded-2xl p-4 border border-milk-tea-200 shadow-sm space-y-2">
            <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
              className="w-12 text-center text-xl bg-milk-tea-50 border border-milk-tea-100 rounded-lg p-1" maxLength={2} />
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="分類名稱" autoFocus
              className="w-full text-sm bg-milk-tea-50 border border-milk-tea-100 rounded-lg px-2 py-1" />
            <div className="flex space-x-2">
              <button onClick={addCategory} className="flex-1 py-1 bg-milk-tea-500 text-white rounded-lg text-xs font-bold flex items-center justify-center">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => { setAddMode(false); setNewName(''); }} className="flex-1 py-1 bg-milk-tea-100 text-milk-tea-400 rounded-lg text-xs font-bold flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddMode(true)}
            className="bg-milk-tea-50 rounded-2xl p-4 border-2 border-dashed border-milk-tea-200 flex flex-col items-center justify-center space-y-1 hover:border-milk-tea-400 transition-colors min-h-[100px]">
            <Plus className="w-5 h-5 text-milk-tea-300" />
            <span className="text-xs text-milk-tea-400 font-bold">新增分類</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 住宿資訊區 ── */
function AccommodationSection({ trip }: { trip: Trip }) {
  const hotels = trip.days.flatMap(d =>
    d.spots.filter(s => s.category === 'hotel').map(s => ({ ...s, date: d.date, dayNumber: d.dayNumber }))
  );
  if (hotels.length === 0)
    return (
      <div className="flex flex-col items-center py-6 text-milk-tea-300">
        <BedDouble className="w-10 h-10 opacity-30 mb-2" />
        <p className="text-xs">尚無住宿安排</p>
        <p className="text-[10px] text-milk-tea-200 mt-1">在行程中新增「住宿」類型景點</p>
      </div>
    );
  return (
    <div className="space-y-3">
      {hotels.map(h => (
        <div key={h.id} className="bg-white rounded-2xl p-4 border border-milk-tea-100 shadow-sm flex items-center space-x-3">
          {h.photo ? (
            <img src={h.photo} alt={h.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-milk-tea-100 flex items-center justify-center flex-shrink-0">
              <BedDouble className="w-6 h-6 text-milk-tea-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-milk-tea-900 truncate">{h.name}</p>
            <p className="text-[10px] text-milk-tea-400 mt-0.5">Day {h.dayNumber} · {h.date}</p>
            {h.address && <p className="text-[10px] text-milk-tea-300 truncate mt-0.5">{h.address}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 景點區 ── */
function AttractionsSection({ trip }: { trip: Trip }) {
  const spots = trip.days.flatMap(d =>
    d.spots.filter(s => s.category === 'attraction').map(s => ({ ...s, date: d.date, dayNumber: d.dayNumber }))
  );
  if (spots.length === 0)
    return (
      <div className="flex flex-col items-center py-6 text-milk-tea-300">
        <Compass className="w-10 h-10 opacity-30 mb-2" />
        <p className="text-xs">尚無景點安排</p>
        <p className="text-[10px] text-milk-tea-200 mt-1">在行程中新增「景點」類型景點</p>
      </div>
    );
  return (
    <div className="space-y-3">
      {spots.map(s => (
        <div key={s.id} className="bg-white rounded-2xl p-4 border border-milk-tea-100 shadow-sm flex items-center space-x-3">
          {s.photo ? (
            <img src={s.photo} alt={s.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-accent-coral/30 flex items-center justify-center flex-shrink-0">
              <Compass className="w-6 h-6 text-milk-tea-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-milk-tea-900 truncate">{s.name}</p>
            <p className="text-[10px] text-milk-tea-400 mt-0.5">Day {s.dayNumber} · {s.date}</p>
            {s.cost != null && <p className="text-[10px] font-mono text-milk-tea-500 mt-0.5">{s.currency || 'KRW'} {s.cost.toLocaleString()}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Pill 手風琴選單設定 ── */
const SECTIONS = [
  { id: 'flight',        label: '航班資訊', Icon: Plane,     accent: '#4F46E5' },
  { id: 'expenses',      label: '已花費用', Icon: Wallet,    accent: '#FF6FA3' },
  { id: 'accommodation', label: '住宿資訊', Icon: BedDouble, accent: '#AAB6FB' },
  { id: 'merchants',     label: '商家',     Icon: Store,     accent: '#99F2E6' },
  { id: 'attractions',   label: '景點',     Icon: Compass,   accent: '#FFD4B8' },
] as const;

/* ── 主元件 ── */
export const Home: React.FC<HomeProps> = ({ trip, onUpdateTrip, onNavigate }) => {
  const { addToast } = useUIStore();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const daysUntil = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    return Math.ceil((start.getTime() - today.getTime()) / 86400000);
  }, [trip.startDate]);

  /* 共用費用統計（首頁顯示用） */
  const { expensesByCategory, totalExpenses } = useMemo(() => {
    const shared = trip.expenses.filter(e => e.isShared !== false);
    const map: Record<string, number> = {};
    shared.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
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

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cindy_trip_${trip.id}.json`; a.click();
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

  const toggle = (id: string) => setOpenSection(prev => prev === id ? null : id);

  return (
    <div className="pb-24 min-h-screen bg-milk-tea-50">

      {/* ── Header ── */}
      <header className="px-6 pt-10 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-milk-tea-900">Cindy的王國</h1>
          <p className="text-milk-tea-400 text-xs font-medium mt-0.5">私人旅遊空間 👑</p>
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

      <div className="px-6 space-y-3 mt-2">

        {/* ── Card 1：目前行程（固定）── */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          onClick={() => onNavigate('itinerary')}
          className="relative h-52 rounded-3xl overflow-hidden shadow-lg cursor-pointer"
        >
          <img src={trip.coverImage} alt={trip.title}
            className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4">
            {daysUntil > 0 ? (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">還有 {daysUntil} 天</div>
            ) : daysUntil === 0 ? (
              <div className="bg-accent-coral/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">今天出發！</div>
            ) : (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">旅行中</div>
            )}
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center text-[10px] font-bold bg-white/20 backdrop-blur-md w-fit px-2 py-0.5 rounded-full mb-2">
              <MapPin className="w-3 h-3 mr-1" />{trip.destination}
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

        {/* ── Pill 選單列表 ── */}
        <div className="space-y-2 pt-1">
          {SECTIONS.map(({ id, label, Icon, accent }) => (
            <div key={id}>
              {/* Pill 按鈕 */}
              <button
                onClick={() => toggle(id)}
                className="w-full flex items-center justify-between bg-white border border-milk-tea-100 rounded-full px-5 py-3.5 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${accent}25` }}>
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                  </div>
                  <span className="text-sm font-bold text-milk-tea-800">{label}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-milk-tea-400 transition-transform duration-200 ${openSection === id ? 'rotate-180' : ''}`} />
              </button>

              {/* 展開內容 */}
              <AnimatePresence>
                {openSection === id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 pb-1 px-1">
                      {id === 'flight' && <FlightCardSlider />}

                      {id === 'expenses' && (
                        <div className="bg-white rounded-3xl border border-milk-tea-100 p-4">
                          {trip.expenses.filter(e => e.isShared !== false).length === 0 ? (
                            <div className="flex flex-col items-center py-4 text-milk-tea-300">
                              <Wallet className="w-10 h-10 opacity-30 mb-2" />
                              <p className="text-xs">尚無共用支出紀錄</p>
                              <button onClick={() => onNavigate('budget')}
                                className="mt-3 px-4 py-1.5 bg-milk-tea-100 text-milk-tea-500 rounded-full text-xs font-bold">
                                前往記帳
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-5">
                              <DonutChart data={pieData} total={totalExpenses} />
                              <div className="flex-1 space-y-1.5 min-w-0">
                                {expensesByCategory.slice(0, 4).map((e) => {
                                  const pct = totalExpenses > 0 ? Math.round((e.amount / totalExpenses) * 100) : 0;
                                  return (
                                    <div key={e.cat} className="flex items-center space-x-2">
                                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                                      <span className="text-xs text-milk-tea-700 font-medium truncate flex-1">{e.label}</span>
                                      <span className="text-[10px] font-mono text-milk-tea-400 flex-shrink-0">{pct}%</span>
                                    </div>
                                  );
                                })}
                                <div className="pt-1 border-t border-milk-tea-100 flex items-center justify-between">
                                  <p className="text-[10px] text-milk-tea-400">
                                    共用 {trip.expenses.filter(e => e.isShared !== false).length} 筆
                                  </p>
                                  <button onClick={() => onNavigate('budget')}
                                    className="text-[10px] text-milk-tea-400 hover:text-milk-tea-600 flex items-center">
                                    明細 <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {id === 'accommodation' && <AccommodationSection trip={trip} />}
                      {id === 'merchants'     && <MerchantsSection trip={trip} onUpdateTrip={onUpdateTrip} />}
                      {id === 'attractions'   && <AttractionsSection trip={trip} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
