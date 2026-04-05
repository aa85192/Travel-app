import React, { useState } from 'react';
import { motion } from 'motion/react';
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

export const TransitCard: React.FC<TransitCardProps> = ({ 
  transit, 
  originName, 
  destinationName,
  originCoords,
  destinationCoords
}) => {
  const [mode, setMode] = useState<TransportMode>(transit.selectedMode);
  const estimate = transit.estimates[mode];

  const modes: TransportMode[] = ['walking', 'bus', 'subway', 'taxi'];

  const getModeColor = (m: TransportMode) => {
    switch (m) {
      case 'walking': return 'bg-transport-walk';
      case 'bus': return 'bg-transport-bus';
      case 'subway': return 'bg-transport-subway';
      case 'taxi': return 'bg-transport-taxi';
      default: return 'bg-milk-tea-200';
    }
  };

  return (
    <div className="relative pl-12 py-2">
      {/* Timeline connector line */}
      <div className="absolute left-[21px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-milk-tea-300" />
      
      <div className="bg-white/40 rounded-xl p-3 border border-milk-tea-200/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TransportIcon mode={mode} className="w-4 h-4 text-milk-tea-500" />
            <span className="text-sm font-mono font-bold text-milk-tea-800">
              {estimate?.duration || '--'} 分鐘
            </span>
            <span className="text-xs text-milk-tea-400">
              ・ {estimate ? (estimate.distance / 1000).toFixed(1) : '--'} km
            </span>
          </div>
        </div>

        <div className="flex space-x-1 mb-4">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-full flex items-center justify-center transition-all ${
                mode === m 
                  ? `${getModeColor(m)} text-white shadow-sm scale-105` 
                  : 'bg-milk-tea-100 text-milk-tea-400 hover:bg-milk-tea-200'
              }`}
            >
              <TransportIcon mode={m} className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          <button 
            onClick={() => openNaverMapDirections({ ...destinationCoords, name: destinationName })}
            className="flex-1 py-2 bg-[#2DB400] text-white rounded-lg text-[10px] font-bold flex items-center justify-center"
          >
            📍 Naver 導航
          </button>
          <button 
            onClick={() => openUberToDestination({ ...destinationCoords, name: destinationName })}
            className="flex-1 py-2 bg-neutral-dark text-white rounded-lg text-[10px] font-bold flex items-center justify-center"
          >
            🚗 Uber 叫車
          </button>
        </div>
      </div>
    </div>
  );
};
