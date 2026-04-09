import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreHorizontal, MapPin, Clock, CircleDollarSign, Edit2, Trash2, Copy } from 'lucide-react';
import { Spot } from '../../types';
import { PhotoThumbnail } from '../common/PhotoThumbnail';
import { openInNaverMap } from '../../utils/deepLink';
import { useUIStore } from '../../stores/uiStore';
import { useTripStore } from '../../stores/tripStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DayWeather, weatherEmoji } from '../../services/weatherService';

interface SpotCardProps {
  spot: Spot;
  dayNumber: number;
  index: number;
  dayWeather?: DayWeather;
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

export const SpotCard: React.FC<SpotCardProps> = ({ spot, dayNumber, index, dayWeather }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { openModal, addToast } = useUIStore();
  const { deleteSpot } = useTripStore();

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
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-3xl shadow-sm border border-milk-tea-100 overflow-hidden hover:shadow-md transition-all"
    >
      <div 
        className="p-4 flex items-start space-x-4 cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="relative">
          <PhotoThumbnail src={spot.photo} alt={spot.name} size="md" />
          <div
            className="absolute -top-2 -left-2 w-7 h-7 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-milk-tea-50 shadow-sm"
            style={{ backgroundColor: BADGE_COLORS[index % BADGE_COLORS.length] }}
          >
            {index + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-base font-bold text-milk-tea-900 truncate font-display">{spot.name}</h3>
            
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

          <div className="flex items-end justify-between mt-2">
            <div className="flex items-center space-x-3 text-[10px] font-bold text-milk-tea-500 uppercase tracking-wider">
              <div className="flex items-center">
                <Clock size={12} className="mr-1" />
                {spot.duration} 分鐘
              </div>
              {spot.cost !== undefined && (
                <div className="flex items-center">
                  <CircleDollarSign size={12} className="mr-1" />
                  ₩ {spot.cost.toLocaleString()}
                </div>
              )}
            </div>
            {/* 天氣橫向chip */}
            {dayWeather && (() => {
              const { bg, color } = weatherChipStyle(dayWeather.code);
              return (
                <div
                  className="flex flex-col items-center px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: bg }}
                >
                  <span className="text-base leading-none mb-1">{weatherEmoji(dayWeather.code)}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[8px] font-bold" style={{ color }}>
                      {dayWeather.precipProb}%
                    </span>
                    <span className="text-[8px] font-bold opacity-40" style={{ color }}>·</span>
                    <span className="text-[8px] font-bold" style={{ color }}>
                      {dayWeather.tempMax}°/{dayWeather.tempMin}°
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-milk-tea-50 bg-milk-tea-50/30"
          >
            <div className="pt-4 space-y-4">
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
