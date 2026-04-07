import React from 'react';
import { motion } from 'motion/react';
import { Navigation, Car, ExternalLink } from 'lucide-react';
import { Transit, TransportMode } from '../../types';
import { TransportIcon } from '../common/TransportIcon';
import { openNaverMapDirections, openUberToDestination } from '../../utils/deepLink';
import { useTripStore } from '../../stores/tripStore';

interface TransitCardProps {
  transit: Transit;
  dayNumber: number;
  originName: string;
  destinationName: string;
  originCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
}

const MODE_LABELS: Record<TransportMode, string> = {
  walking: '步行',
  bus: '公車',
  subway: '地鐵',
  taxi: '計程車',
  uber: 'Uber',
};

// 各交通模式專屬馬卡龍色
const MODE_COLORS: Record<TransportMode, { bg: string; text: string }> = {
  walking: { bg: '#3DBDAD', text: '#fff' },   // 薄荷
  bus:     { bg: '#8896F5', text: '#fff' },   // 薰衣草
  subway:  { bg: '#9B8FF5', text: '#fff' },   // 紫
  taxi:    { bg: '#E8A830', text: '#fff' },   // 琥珀
  uber:    { bg: '#2D2030', text: '#fff' },   // 深梅
};

export const TransitCard: React.FC<TransitCardProps> = ({
  transit,
  dayNumber,
  destinationName,
  destinationCoords,
}) => {
  if (!transit) return null;

  const updateTransitMode = useTripStore((s) => s.updateTransitMode);
  const estimate = transit.estimates[transit.selectedMode];
  const modes: TransportMode[] = ['walking', 'bus', 'subway', 'taxi', 'uber'];

  return (
    <div className="relative pl-12 py-2">
      {/* Timeline connector */}
      <div className="absolute left-[21px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-milk-tea-300" />

      <div className="bg-white/40 rounded-xl p-3 border border-milk-tea-200/50 space-y-3">
        {/* Mode selector */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {modes.map((m) => {
              const active = m === transit.selectedMode;
              const color = MODE_COLORS[m];
              return (
                <button
                  key={m}
                  type="button"
                  title={MODE_LABELS[m]}
                  onClick={() => updateTransitMode(dayNumber, transit.id, m)}
                  style={active ? { backgroundColor: color.bg, color: color.text } : {}}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    active
                      ? 'shadow-sm scale-110'
                      : 'bg-milk-tea-100 text-milk-tea-400 hover:bg-milk-tea-200'
                  }`}
                >
                  <TransportIcon mode={m} className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
          {estimate && (
            <span className="text-[10px] text-milk-tea-400 font-mono">
              約 {estimate.duration} 分・{(estimate.distance / 1000).toFixed(1)} km
              {estimate.cost && (
                <span className="ml-1 text-milk-tea-300">₩{estimate.cost.toLocaleString()}</span>
              )}
            </span>
          )}
        </div>

        {/* 估算提示 */}
        <p className="text-[9px] text-milk-tea-300 -mt-1">
          ⚠️ 時間為系統估算，實際請以 Naver Map 查詢為準
        </p>

        {/* Primary action: Naver Map */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => openNaverMapDirections({ ...destinationCoords, name: destinationName })}
          className="w-full py-2.5 bg-milk-tea-500 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-sm hover:bg-milk-tea-600 transition-colors"
        >
          <Navigation className="w-4 h-4" />
          <span>在 Naver Map 查詢路線</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </motion.button>

        {/* Secondary: Uber */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => openUberToDestination({ ...destinationCoords, name: destinationName })}
          className="w-full py-2 bg-[#2D2030] text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity"
        >
          <Car className="w-3.5 h-3.5" />
          <span>Uber 叫車前往</span>
        </motion.button>
      </div>
    </div>
  );
};
