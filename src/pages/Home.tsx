import React, { useMemo, useState, useRef } from 'react';
import { Download, Upload, MapPin, ChevronRight, Wallet, Plane,
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
    direction: '去程', airline: 'Air Busan', flightNumber: 'BX796', cabin: '經濟艙',
    from: { code: 'KHH', name: '高雄國際機場' },
    to:   { code: 'PUS', name: '金海國際機場' },
    departure: '14:15', arrival: '17:55', duration: '2h 40m',
    date: '2026.05.10',
    passengers: [
      { name: 'YU-HSIN LIANG', carryOn: '10 kg', checked: '15 kg' },
      { name: 'YU-XIN LO',     carryOn: '10 kg', checked: '15 kg' },
    ],
  },
  {
    direction: '回程', airline: 'Jeju Air', flightNumber: '7C6255', cabin: '經濟艙',
    from: { code: 'PUS', name: '金海國際機場' },
    to:   { code: 'KHH', name: '高雄國際機場' },
    departure: '14:15', arrival: '16:00', duration: '2h 45m',
    date: '2026.05.13',
    passengers: [
      { name: 'YU-HSIN LIANG', carryOn: '10 kg', checked: '15 kg' },
      { name: 'YU-XIN LO',     carryOn: '10 kg', checked: '15 kg' },
    ],
  },
];

/* ── Apple Wallet 極簡航班卡 ── */
function FlightCard() {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    const d = touchStartX.current - e.changedTouches[0].clientX;
    if (d >  50 && idx < FLIGHTS.length - 1) setIdx(i => i + 1);
    if (d < -50 && idx > 0)                  setIdx(i => i - 1);
  };
  const f = FLIGHTS[idx];

  return (
    <div>
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl overflow-hidden border border-gray-100"
            style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}
          >
            {/* 頂部：航空公司 + 方向 */}
            <div className="px-5 pt-4 pb-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-milk-tea-50 flex items-center justify-center">
                  <Plane className="w-3.5 h-3.5 text-milk-tea-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{f.airline}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{f.flightNumber}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-milk-tea-500 bg-milk-tea-50 px-2.5 py-0.5 rounded-full">
                  {f.direction}
                </span>
                <span className="text-[10px] text-gray-300">{f.cabin}</span>
              </div>
            </div>

            {/* 路線 */}
            <div className="px-5 py-4 flex items-center">
              {/* 出發 */}
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 mb-0.5">{f.date}</p>
                <p className="text-3xl font-semibold text-gray-900 font-mono tabular-nums leading-none">{f.departure}</p>
                <p className="text-lg font-bold text-gray-800 mt-1 leading-none">{f.from.code}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{f.from.name}</p>
              </div>

              {/* 中間箭頭 */}
              <div className="flex flex-col items-center px-4">
                <p className="text-[10px] text-gray-300 mb-2">{f.duration}</p>
                <div className="flex items-center w-20">
                  <div className="flex-1 h-px bg-gray-200" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-0.5" />
                  <Plane className="w-3 h-3 text-gray-300 mx-0.5 rotate-0" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-0.5" />
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </div>

              {/* 抵達 */}
              <div className="flex-1 text-right">
                <p className="text-[11px] text-gray-400 mb-0.5 opacity-0">-</p>
                <p className="text-3xl font-semibold text-gray-900 font-mono tabular-nums leading-none">{f.arrival}</p>
                <p className="text-lg font-bold text-gray-800 mt-1 leading-none">{f.to.code}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight text-right">{f.to.name}</p>
              </div>
            </div>

            {/* 撕票線 */}
            <div className="flex items-center mx-0 overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-milk-tea-50 -ml-2.5 flex-shrink-0" />
              <div className="flex-1 border-t border-dashed border-gray-200" />
              <div className="w-5 h-5 rounded-full bg-milk-tea-50 -mr-2.5 flex-shrink-0" />
            </div>

            {/* 旅客行李 */}
            <div className="px-5 py-3.5 space-y-1.5">
              {f.passengers.map(p => (
                <div key={p.name} className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-500 font-medium truncate flex-1 mr-3">{p.name}</p>
                  <div className="flex items-center space-x-2.5 text-[11px] text-gray-400 flex-shrink-0">
                    <span>🎒 {p.carryOn}</span>
                    <span className="text-gray-200">·</span>
                    <span>🧳 {p.checked}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 指示點 */}
      <div className="flex justify-center space-x-1.5 mt-3">
        {FLIGHTS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === idx ? 'w-5 bg-milk-tea-500' : 'w-1.5 bg-milk-tea-200'
            }`} />
        ))}
      </div>
    </div>
  );
}

/* ── 圓餅圖 ── */
function DonutChart({ data, total }: { data: { color: string; percent: number }[]; total: number }) {
  const cx = 44, cy = 44, r = 32, sw = 12, C = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width={88} height={88} viewBox="0 0 88 88" className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FED7DD" strokeWidth={sw} />
      <g transform={`rotate(-90,${cx},${cy})`}>
        {data.map((s, i) => {
          const off = -cum * C; cum += s.percent;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
            strokeWidth={sw} strokeDasharray={`${s.percent * C} ${C}`} strokeDashoffset={off} />;
        })}
      </g>
      <text x={cx} y={cy-5} textAnchor="middle" fontSize="7" fill="#E8538C" fontWeight="bold">已花</text>
      <text x={cx} y={cy+8} textAnchor="middle" fontSize="10" fill="#9C2B58" fontWeight="bold" fontFamily="monospace">
        {total >= 10000 ? `${(total/10000).toFixed(1)}萬` : total.toLocaleString()}
      </text>
    </svg>
  );
}

/* ── 商家分類 ── */
function MerchantsSection({ trip, onUpdateTrip }: { trip: Trip; onUpdateTrip: (t: Trip) => void }) {
  const categories: MerchantCategory[] = trip.merchantCategories ?? [
    { id: 'mc1', name: '咖啡廳', emoji: '☕', color: '#FFD4B8' },
    { id: 'mc2', name: '衣服',   emoji: '👗', color: '#AAB6FB' },
  ];
  const [editing, setEditing] = useState<{ id: string; name: string; emoji: string } | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏪');

  const PALETTE = ['#FFD4B8','#AAB6FB','#99F2E6','#FFFEE1','#C5B8FF','#B8DCFF','#FFE4A0','#FFACBB'];
  const save = (id: string) => {
    if (!editing) return;
    onUpdateTrip({ ...trip, merchantCategories: categories.map(c => c.id === id ? { ...c, name: editing.name, emoji: editing.emoji } : c) });
    setEditing(null);
  };
  const remove = (id: string) => onUpdateTrip({ ...trip, merchantCategories: categories.filter(c => c.id !== id) });
  const add = () => {
    if (!newName.trim()) return;
    onUpdateTrip({ ...trip, merchantCategories: [...categories, { id: `mc_${Date.now()}`, name: newName.trim(), emoji: newEmoji, color: PALETTE[categories.length % PALETTE.length] }] });
    setNewName(''); setNewEmoji('🏪'); setAddMode(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-milk-tea-300 text-center">點選分類可未來加入商家資訊</p>
      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl p-4 border border-milk-tea-100 shadow-sm relative">
            <button onClick={() => remove(cat.id)} className="absolute top-2 right-2 text-milk-tea-200 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {editing?.id === cat.id ? (
              <div className="space-y-1.5">
                <input value={editing.emoji} onChange={e => setEditing({ ...editing, emoji: e.target.value })}
                  className="w-10 text-center text-xl bg-milk-tea-50 border border-milk-tea-100 rounded-lg p-1" maxLength={2} />
                <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                  className="w-full text-sm bg-milk-tea-50 border border-milk-tea-100 rounded-lg px-2 py-1" autoFocus />
                <div className="flex space-x-1.5 pt-1">
                  <button onClick={() => save(cat.id)} className="flex-1 py-1 bg-milk-tea-500 text-white rounded-lg flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditing(null)} className="flex-1 py-1 bg-milk-tea-100 text-milk-tea-400 rounded-lg flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl mb-1.5">{cat.emoji}</div>
                <p className="text-sm font-bold text-milk-tea-800">{cat.name}</p>
                <p className="text-[10px] text-milk-tea-300 mt-0.5">尚無商家</p>
                <button onClick={() => setEditing({ id: cat.id, name: cat.name, emoji: cat.emoji })}
                  className="flex items-center space-x-0.5 text-[10px] text-milk-tea-300 hover:text-milk-tea-500 mt-1.5 transition-colors">
                  <Edit2 className="w-2.5 h-2.5" /><span>編輯</span>
                </button>
              </>
            )}
          </div>
        ))}
        {addMode ? (
          <div className="bg-white rounded-2xl p-4 border border-milk-tea-200 shadow-sm space-y-1.5">
            <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} maxLength={2}
              className="w-10 text-center text-xl bg-milk-tea-50 border border-milk-tea-100 rounded-lg p-1" />
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="分類名稱" autoFocus
              className="w-full text-sm bg-milk-tea-50 border border-milk-tea-100 rounded-lg px-2 py-1" />
            <div className="flex space-x-1.5 pt-1">
              <button onClick={add} className="flex-1 py-1 bg-milk-tea-500 text-white rounded-lg flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setAddMode(false); setNewName(''); }} className="flex-1 py-1 bg-milk-tea-100 text-milk-tea-400 rounded-lg flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddMode(true)}
            className="bg-milk-tea-50 rounded-2xl border-2 border-dashed border-milk-tea-200 flex flex-col items-center justify-center space-y-1 hover:border-milk-tea-400 transition-colors min-h-[110px]">
            <Plus className="w-5 h-5 text-milk-tea-300" />
            <span className="text-xs text-milk-tea-400 font-bold">新增分類</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 住宿 ── */
function AccommodationSection({ trip }: { trip: Trip }) {
  const hotels = trip.days.flatMap(d =>
    d.spots.filter(s => s.category === 'hotel').map(s => ({ ...s, date: d.date, dayNumber: d.dayNumber }))
  );
  if (!hotels.length) return (
    <div className="flex flex-col items-center py-8 text-milk-tea-300">
      <BedDouble className="w-10 h-10 opacity-30 mb-2" />
      <p className="text-xs">尚無住宿安排</p>
      <p className="text-[10px] text-milk-tea-200 mt-1">在行程中新增「住宿」類型景點</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {hotels.map(h => (
        <div key={h.id} className="bg-white rounded-2xl p-4 border border-milk-tea-100 shadow-sm flex items-center space-x-3">
          {h.photo
            ? <img src={h.photo} alt={h.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            : <div className="w-14 h-14 rounded-xl bg-milk-tea-100 flex items-center justify-center flex-shrink-0"><BedDouble className="w-6 h-6 text-milk-tea-300" /></div>
          }
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

/* ── 景點 ── */
function AttractionsSection({ trip }: { trip: Trip }) {
  const spots = trip.days.flatMap(d =>
    d.spots.filter(s => s.category === 'attraction').map(s => ({ ...s, date: d.date, dayNumber: d.dayNumber }))
  );
  if (!spots.length) return (
    <div className="flex flex-col items-center py-8 text-milk-tea-300">
      <Compass className="w-10 h-10 opacity-30 mb-2" />
      <p className="text-xs">尚無景點安排</p>
      <p className="text-[10px] text-milk-tea-200 mt-1">在行程中新增「景點」類型景點</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {spots.map(s => (
        <div key={s.id} className="bg-white rounded-2xl p-4 border border-milk-tea-100 shadow-sm flex items-center space-x-3">
          {s.photo
            ? <img src={s.photo} alt={s.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            : <div className="w-14 h-14 rounded-xl bg-accent-coral/30 flex items-center justify-center flex-shrink-0"><Compass className="w-6 h-6 text-milk-tea-400" /></div>
          }
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

/* ── pill 選單設定 ── */
const SECTIONS = [
  { id: 'flight',        label: '航班資訊', Icon: Plane     },
  { id: 'expenses',      label: '已花費用', Icon: Wallet    },
  { id: 'accommodation', label: '住宿資訊', Icon: BedDouble },
  { id: 'merchants',     label: '商家',     Icon: Store     },
  { id: 'attractions',   label: '景點',     Icon: Compass   },
] as const;

/* ── 主元件 ── */
export const Home: React.FC<HomeProps> = ({ trip, onUpdateTrip, onNavigate }) => {
  const { addToast } = useUIStore();
  const [activeSection, setActiveSection] = useState<string>('flight');

  const daysUntil = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(trip.startDate).getTime() - today.getTime()) / 86400000);
  }, [trip.startDate]);

  const { expensesByCategory, totalExpenses } = useMemo(() => {
    const shared = trip.expenses.filter(e => e.isShared !== false);
    const map: Record<string, number> = {};
    shared.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    const sorted = Object.entries(map)
      .map(([cat, amount]) => ({ cat, amount, color: CATEGORY_COLORS[cat] || '#D2A97D', label: CATEGORY_LABELS[cat] || cat }))
      .sort((a, b) => b.amount - a.amount);
    return { expensesByCategory: sorted, totalExpenses: sorted.reduce((s, x) => s + x.amount, 0) };
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

  return (
    <div className="pb-24 min-h-screen bg-milk-tea-50">

      {/* Header */}
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

      <div className="px-6 space-y-4 mt-2">

        {/* Card 1：行程（固定） */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          onClick={() => onNavigate('itinerary')}
          className="relative h-52 rounded-3xl overflow-hidden shadow-lg cursor-pointer"
        >
          <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4">
            {daysUntil > 0
              ? <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">還有 {daysUntil} 天</div>
              : daysUntil === 0
              ? <div className="bg-accent-coral/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">今天出發！</div>
              : <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">旅行中</div>
            }
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

        {/* 橢圓 pill 選單（橫排小型） */}
        <div className="flex space-x-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {SECTIONS.map(({ id, label, Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                  active
                    ? 'bg-milk-tea-500 text-white shadow-sm'
                    : 'bg-white text-milk-tea-500 border border-milk-tea-200 hover:border-milk-tea-400'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* 選單內容 Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {activeSection === 'flight' && <FlightCard />}

            {activeSection === 'expenses' && (
              <div className="bg-white rounded-3xl shadow-sm border border-milk-tea-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-extrabold text-milk-tea-800">共用費用</p>
                  <button onClick={() => onNavigate('budget')}
                    className="text-[10px] text-milk-tea-400 hover:text-milk-tea-600 flex items-center">
                    明細 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
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
                      {expensesByCategory.slice(0, 4).map(e => {
                        const pct = totalExpenses > 0 ? Math.round((e.amount / totalExpenses) * 100) : 0;
                        return (
                          <div key={e.cat} className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                            <span className="text-xs text-milk-tea-700 font-medium truncate flex-1">{e.label}</span>
                            <span className="text-[10px] font-mono text-milk-tea-400">{pct}%</span>
                          </div>
                        );
                      })}
                      <div className="pt-1 border-t border-milk-tea-100">
                        <p className="text-[10px] text-milk-tea-400">
                          {trip.expenses.filter(e => e.isShared !== false).length} 筆·
                          <span className="font-mono font-bold text-milk-tea-600 ml-0.5">
                            {trip.expenses[0]?.currency || 'KRW'} {totalExpenses.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'accommodation' && <AccommodationSection trip={trip} />}
            {activeSection === 'merchants'     && <MerchantsSection trip={trip} onUpdateTrip={onUpdateTrip} />}
            {activeSection === 'attractions'   && <AttractionsSection trip={trip} />}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};
