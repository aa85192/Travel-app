import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MoreHorizontal, MapPin, Clock, CircleDollarSign, Edit2, Trash2, Copy,
  ListChecks, Plus, X, Check,
} from 'lucide-react';
import { Spot, MOOD_META } from '../../types';
import { PhotoThumbnail } from '../common/PhotoThumbnail';
import { LocalPhoto } from '../common/LocalPhoto';
import { openInNaverMap } from '../../utils/deepLink';
import { useUIStore } from '../../stores/uiStore';
import { useTripStore } from '../../stores/tripStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DayWeather, weatherEmoji, fetchSpotWeather } from '../../services/weatherService';

interface SpotCardProps {
  spot: Spot;
  dayNumber: number;
  index: number;
  dayDate?: string;  // YYYY-MM-DD，用來查該景點當天天氣
}

// 天氣chip 馬卡龍配色（平面無陰影）
function weatherChipStyle(code: number): { bg: string; color: string } {
  if (code === 0)  return { bg: '#FFF7CC', color: '#7A5F00' }; // 晴：奶油黃
  if (code <= 2)   return { bg: '#FFF7CC', color: '#7A5F00' }; // 晴時多雲
  if (code <= 3)   return { bg: '#E8ECFF', color: '#2D3A8A' }; // 多雲：薰衣草
  if (code <= 48)  return { bg: '#F0F0F0', color: '#555555' }; // 霧：灰
  if (code <= 65)  return { bg: '#D4F5EF', color: '#1A5A50' }; // 雨：薄荷
  if (code <= 77)  return { bg: '#EDE8FF', color: '#3A2A8A' }; // 雪：淡紫
  if (code <= 86)  return { bg: '#D4F5EF', color: '#1A5A50' }; // 陣雨
  return { bg: '#FED7DD', color: '#9C2B58' };                   // 雷雨：粉
}

// 數字徽章馬卡龍色
const BADGE_COLORS = ['#FF6FA3', '#8896F5', '#3DBDAD', '#E8A830', '#9B8FF5', '#E87DAA'];

// 標籤馬卡龍色（背景、文字、邊框）
const TAG_PALETTE = [
  { bg: '#FED7DD', text: '#9C2B58', border: '#FFACBB' },
  { bg: '#E8ECFF', text: '#2D3A8A', border: '#AAB6FB' },
  { bg: '#D4F5EF', text: '#1A5A50', border: '#99F2E6' },
  { bg: '#FFF7CC', text: '#7A5F00', border: '#FFE4A0' },
  { bg: '#FFE8D6', text: '#8A4020', border: '#FFD4B8' },
  { bg: '#EDE8FF', text: '#3A2A8A', border: '#C5B8FF' },
];

// ────────────────────────────────────────────────────────────────
// Inline todo list rendered inside the expanded SpotCard.
// Tap circle → toggle done; tap text → edit inline; tap × → delete.
// ────────────────────────────────────────────────────────────────
interface SpotTodoListProps {
  spot: Spot;
  dayNumber: number;
}

const SpotTodoList: React.FC<SpotTodoListProps> = ({ spot, dayNumber }) => {
  const { addSpotTodo, toggleSpotTodo, updateSpotTodo, deleteSpotTodo } = useTripStore();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  const todos = spot.todos ?? [];
  const doneCount = todos.filter((t) => t.done).length;

  useEffect(() => {
    if (editingId) editRef.current?.focus();
  }, [editingId]);

  const handleAdd = () => {
    if (!draft.trim()) return;
    addSpotTodo(dayNumber, spot.id, draft);
    setDraft('');
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (editingText.trim()) {
      updateSpotTodo(dayNumber, spot.id, editingId, editingText);
    }
    setEditingId(null);
    setEditingText('');
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl border border-milk-tea-100 p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-milk-tea-500 flex items-center">
          <ListChecks size={12} className="mr-1.5" />
          待辦清單
        </p>
        {todos.length > 0 && (
          <span className="text-[10px] font-bold text-milk-tea-400 font-mono">
            {doneCount}/{todos.length}
          </span>
        )}
      </div>

      {todos.length > 0 && (
        <div className="space-y-1">
          {todos.map((t) => (
            <div key={t.id} className="flex items-center group">
              <button
                onClick={() => toggleSpotTodo(dayNumber, spot.id, t.id)}
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
                style={{
                  borderColor: t.done ? '#FF8FAF' : '#FFBFCA',
                  backgroundColor: t.done ? '#FF8FAF' : 'transparent',
                }}
                aria-label={t.done ? '標記為未完成' : '標記為已完成'}
              >
                {t.done && <Check size={12} className="text-white" strokeWidth={3} />}
              </button>

              {editingId === t.id ? (
                <input
                  ref={editRef}
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') { setEditingId(null); setEditingText(''); }
                  }}
                  className="flex-1 ml-2 mr-1 text-xs bg-milk-tea-50 border border-milk-tea-200 rounded-lg px-2 py-1 focus:outline-none focus:border-milk-tea-400 text-milk-tea-800"
                />
              ) : (
                <button
                  onClick={() => startEdit(t.id, t.text)}
                  className={`flex-1 ml-2 mr-1 text-left text-xs leading-snug py-0.5 transition-colors ${
                    t.done
                      ? 'line-through text-milk-tea-300'
                      : 'text-milk-tea-800 hover:text-milk-tea-600'
                  }`}
                >
                  {t.text}
                </button>
              )}

              <button
                onClick={() => deleteSpotTodo(dayNumber, spot.id, t.id)}
                className="flex-shrink-0 p-1 text-milk-tea-200 hover:text-red-400 transition-colors"
                aria-label="刪除"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center pt-1 border-t border-milk-tea-50">
        <Plus size={12} className="text-milk-tea-300 flex-shrink-0 ml-0.5" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="新增待辦事項…"
          className="flex-1 ml-1.5 text-xs bg-transparent border-none focus:outline-none placeholder:text-milk-tea-300 text-milk-tea-800 py-1"
        />
        {draft.trim() && (
          <button
            onClick={handleAdd}
            className="flex-shrink-0 px-2 py-0.5 bg-milk-tea-500 text-white rounded-md text-[10px] font-bold active:scale-95 transition-transform"
          >
            加入
          </button>
        )}
      </div>
    </div>
  );
};

export const SpotCard: React.FC<SpotCardProps> = ({ spot, dayNumber, index, dayDate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mainPhotoFailed, setMainPhotoFailed] = useState(false);
  const [dayWeather, setDayWeather] = useState<DayWeather | null>(null);
  const [weatherLoaded, setWeatherLoaded] = useState(false);

  useEffect(() => {
    if (!dayDate) return;
    setWeatherLoaded(false);
    fetchSpotWeather(spot.lat, spot.lng, dayDate).then(w => {
      setDayWeather(w);
      setWeatherLoaded(true);
    });
  }, [spot.lat, spot.lng, dayDate]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { openModal, addToast } = useUIStore();
  const { deleteSpot } = useTripStore();
  const { cardDensity } = useSettingsStore();
  const pad = cardDensity === 'compact' ? 'p-2.5 space-x-2.5' : cardDensity === 'spacious' ? 'p-5 space-x-5' : 'p-4 space-x-4';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('spot-edit', { tripId: 'current', dayNumber, spotId: spot.id });
    setShowMenu(false);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('spot-copy', { tripId: 'current', dayNumber, spotId: spot.id });
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const confirmDelete = () => {
    deleteSpot(dayNumber, spot.id);
    addToast('景點已刪除', 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      // 漸進顯示但延遲封頂在 5 張卡 (250ms)，避免長 day 末張要等超過 1 秒
      transition={{ duration: 0.25, delay: Math.min(index, 5) * 0.05 }}
      className="bg-white rounded-3xl shadow-sm border border-milk-tea-100 hover:shadow-md transition-all"
    >
      <div
        className={`flex items-start cursor-pointer active:scale-[0.99] transition-transform ${pad}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="relative">
          {(!spot.photo || mainPhotoFailed) && spot.photoIds?.[0] ? (
            <div className="w-16 h-16 rounded-photo overflow-hidden border-2 border-milk-tea-200 shadow-sm flex-shrink-0 bg-milk-tea-100">
              <LocalPhoto photoId={spot.photoIds[0]} className="w-full h-full object-cover" />
            </div>
          ) : (
            <PhotoThumbnail
              src={spot.photo}
              alt={spot.name}
              size="md"
              onError={() => setMainPhotoFailed(true)}
            />
          )}
          <div
            className="absolute -top-2 -left-2 w-7 h-7 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-milk-tea-50 shadow-sm"
            style={{ backgroundColor: BADGE_COLORS[index % BADGE_COLORS.length] }}
          >
            {index + 1}
          </div>
          {spot.mood && (
            <div
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-base bg-white shadow-md border-2 border-milk-tea-50"
              title={MOOD_META[spot.mood].label}
            >
              {MOOD_META[spot.mood].emoji}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 mr-2">
              <h3 className="text-base font-bold text-milk-tea-900 truncate font-display">{spot.name}</h3>
              {spot.nameLocal && (
                <p className="text-[11px] text-milk-tea-300 truncate -mt-0.5">{spot.nameLocal}</p>
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 text-milk-tea-300 hover:text-milk-tea-500 hover:bg-milk-tea-50 rounded-lg transition-all"
              >
                <MoreHorizontal size={20} />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                      }} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-xl border border-milk-tea-100 z-30 py-2 overflow-hidden"
                    >
                      <button 
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm text-milk-tea-700 hover:bg-milk-tea-50 flex items-center"
                      >
                        <Edit2 size={14} className="mr-2" /> 編輯景點
                      </button>
                      <button 
                        onClick={handleCopy}
                        className="w-full px-4 py-2 text-left text-sm text-milk-tea-700 hover:bg-milk-tea-50 flex items-center"
                      >
                        <Copy size={14} className="mr-2" /> 複製到其他天
                      </button>
                      <div className="h-px bg-milk-tea-100 my-1" />
                      <button 
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 size={14} className="mr-2" /> 刪除景點
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center text-xs text-milk-tea-400 mt-1">
            <MapPin size={12} className="mr-1" />
            <span className="truncate">{spot.address}</span>
          </div>

          {/* 底列：時間 / 費用 / 天氣chip（同一行，不重疊） */}
          <div className="flex items-center mt-2 text-[10px] font-bold text-milk-tea-500 uppercase tracking-wider">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex items-center flex-shrink-0">
                <Clock size={12} className="mr-1" />
                {spot.duration} 分鐘
              </div>
              {spot.cost !== undefined && (
                <div className="flex items-center flex-shrink-0">
                  <CircleDollarSign size={12} className="mr-1" />
                  ₩ {spot.cost.toLocaleString()}
                </div>
              )}
            </div>

            {/* 天氣chip：有資料→顯示天氣；超出預報範圍→顯示佔位符 */}
            {dayDate && weatherLoaded && (
              dayWeather ? (
                (() => {
                  const { bg, color } = weatherChipStyle(dayWeather.code);
                  return (
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://www.windy.com/?rain,${spot.lat},${spot.lng},12`,
                          '_blank', 'noopener'
                        );
                      }}
                      className="flex-shrink-0 flex flex-col items-center px-2 py-1 rounded-lg cursor-pointer active:scale-95 transition-transform ml-2"
                      style={{ backgroundColor: bg }}
                    >
                      <span className="text-sm leading-none">{weatherEmoji(dayWeather.code)}</span>
                      <div className="flex items-center space-x-0.5 mt-0.5">
                        <span className="text-[8px] font-bold" style={{ color }}>{dayWeather.precipProb}%</span>
                        <span className="text-[8px] opacity-30" style={{ color }}>·</span>
                        <span className="text-[8px] font-bold" style={{ color }}>{dayWeather.tempMax}°/{dayWeather.tempMin}°</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div
                  className="flex-shrink-0 flex flex-col items-center px-2 py-1 rounded-lg opacity-25 ml-2"
                  style={{ backgroundColor: '#F0F0F0' }}
                >
                  <span className="text-sm leading-none">🗓️</span>
                  <span className="text-[8px] font-bold text-gray-400 mt-0.5">預報中</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-milk-tea-50 bg-milk-tea-50/30 overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              <SpotTodoList spot={spot} dayNumber={dayNumber} />

              {spot.photoIds && spot.photoIds.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {spot.photoIds.map((id) => (
                    <div key={id} className="aspect-square rounded-xl overflow-hidden bg-milk-tea-100">
                      <LocalPhoto photoId={id} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {spot.moodNote && (
                <div className="text-xs text-milk-tea-700 bg-white/90 p-3 rounded-2xl border border-milk-tea-200 flex items-start gap-2">
                  {spot.mood && <span className="text-base leading-none">{MOOD_META[spot.mood].emoji}</span>}
                  <span className="font-medium">{spot.moodNote}</span>
                </div>
              )}

              {spot.notes && (
                <div className="text-xs text-milk-tea-600 bg-white/80 p-3 rounded-2xl border border-milk-tea-100 italic">
                  "{spot.notes}"
                </div>
              )}
              
              {spot.tags && spot.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {spot.tags.map((tag, i) => {
                    const c = TAG_PALETTE[i % TAG_PALETTE.length];
                    return (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium border"
                        style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}

              {spot.openingHours && (
                <div className="text-[10px] text-milk-tea-400 font-bold flex items-center uppercase tracking-wider">
                  <Clock size={12} className="mr-1.5" />
                  營業時間: {spot.openingHours}
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openInNaverMap({ lat: spot.lat, lng: spot.lng, name: spot.name });
                  }}
                  className="flex-1 py-2.5 bg-milk-tea-500 text-white rounded-2xl text-xs font-bold hover:bg-milk-tea-600 transition-all shadow-md shadow-milk-tea-100 active:scale-95"
                >
                  在 Naver Map 查看
                </button>
                <button className="px-4 py-2.5 bg-white border border-milk-tea-200 text-milk-tea-500 rounded-2xl text-xs font-bold hover:bg-milk-tea-50 transition-all active:scale-95">
                  分享
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="刪除景點"
        message={`確定要從 Day ${dayNumber} 中刪除「${spot.name}」嗎？此操作無法復原。`}
        confirmText="確定刪除"
        variant="danger"
      />
    </motion.div>
  );
};
