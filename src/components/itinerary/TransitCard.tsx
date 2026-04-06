import React from 'react';
import { motion } from 'motion/react';
import { Navigation, Car, ExternalLink } from 'lucide-react';
import { Transit, TransportMode } from '../../types';
import { TransportIcon } from '../common/TransportIcon';
import { openNaverMapDirections, openUberToDestination } from '../../utils/deepLink';

interface TransitCardProps {
  transit: Transit;
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

export const TransitCard: React.FC<TransitCardProps> = ({
  transit,
  destinationName,
  destinationCoords,
}) => {
  if (!transit) return null;
  const estimate = transit.estimates[transit.selectedMode];
  const modes: TransportMode[] = ['walking', 'bus', 'subway', 'taxi'];

  return (
    <div className="relative pl-12 py-2">
      {/* Timeline connector */}
      <div className="absolute left-[21px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-milk-tea-300" />

      <div className="bg-white/40 rounded-xl p-3 border border-milk-tea-200/50 space-y-3">
        {/* Mode selector + rough estimate */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {modes.map((m) => (
              <div
                key={m}
                title={MODE_LABELS[m]}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  m === transit.selectedMode
                    ? 'bg-milk-tea-500 text-white shadow-sm'
                    : 'bg-milk-tea-100 text-milk-tea-400'
                }`}
              >
                <TransportIcon mode={m} className="w-3.5 h-3.5" />
              </div>
            ))}
          </div>
          {estimate && (
            <span className="text-[10px] text-milk-tea-400 font-mono">
              約 {estimate.duration} 分鐘・{(estimate.distance / 1000).toFixed(1)} km
              <span className="ml-1 text-milk-tea-300">（估算）</span>
            </span>
          )}
        </div>

        {/* Primary action: Naver Map */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => openNaverMapDirections({ ...destinationCoords, name: destinationName })}
          className="w-full py-2.5 bg-[#2DB400] text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-sm"
        >
          <Navigation className="w-4 h-4" />
          <span>在 Naver Map 查詢路線</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </motion.button>

        {/* Secondary: Uber */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => openUberToDestination({ ...destinationCoords, name: destinationName })}
          className="w-full py-2 bg-milk-tea-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 opacity-80"
        >
          <Car className="w-3.5 h-3.5" />
          <span>Uber 叫車前往</span>
        </motion.button>
      </div>
    </div>
  );
};
