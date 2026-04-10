import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Navigation, Car, ExternalLink, Loader2, Map } from 'lucide-react';
import { Transit, TransportMode } from '../../types';
import { TransportIcon } from '../common/TransportIcon';
import { openNaverMapDirections, openUberToDestination, openKakaoMapDirections } from '../../utils/deepLink';
import { useTripStore } from '../../stores/tripStore';
import { useUIStore } from '../../stores/uiStore';
import { fetchWalkingRoute, fetchDrivingRoute } from '../../services/osrmService';

// Kakao Map 模式對應
const KAKAO_MODE: Partial<Record<TransportMode, 'car' | 'traffic' | 'walk' | 'bicycle'>> = {
  walking: 'walk',
  bus:     'traffic',
  subway:  'traffic',
  taxi:    'car',
  uber:    'car',
};

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
  walking: { bg: '#3DBDAD', text: '#fff' },
  bus:     { bg: '#8896F5', text: '#fff' },
  subway:  { bg: '#9B8FF5', text: '#fff' },
  taxi:    { bg: '#E8A830', text: '#fff' },
  uber:    { bg: '#2D2030', text: '#fff' },
};

// OSRM 可查的模式（公車/地鐵繼續用估算）
const OSRM_SUPPORTED: Partial<Record<TransportMode, 'walking' | 'driving'>> = {
  walking: 'walking',
  taxi: 'driving',
  uber: 'driving',
};

interface LiveEstimate {
  duration: number;
  distance: number;
  isReal: boolean;  // true = OSRM 真實資料, false = Haversine 估算
}

export const TransitCard: React.FC<TransitCardProps> = ({
  transit,
  dayNumber,
  originName,
  destinationName,
  originCoords,
  destinationCoords,
}) => {
  if (!transit) return null;

  const updateTransitMode = useTripStore((s) => s.updateTransitMode);
  const { setMapRoute, setNavigateTo } = useUIStore();

  const openMapPage = () => {
    setMapRoute({
      origin:      { ...originCoords,      name: originName },
      destination: { ...destinationCoords, name: destinationName },
      mode: transit.selectedMode,
    });
    setNavigateTo('map');
  };
  const modes: TransportMode[] = ['walking', 'bus', 'subway', 'taxi', 'uber'];

  // 從 OSRM 取得的即時路線（key = TransportMode）
  const [liveData, setLiveData] = useState<Partial<Record<TransportMode, LiveEstimate>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [walkRes, driveRes] = await Promise.all([
        fetchWalkingRoute(originCoords.lat, originCoords.lng, destinationCoords.lat, destinationCoords.lng),
        fetchDrivingRoute(originCoords.lat, originCoords.lng, destinationCoords.lat, destinationCoords.lng),
      ]);
      if (cancelled) return;

      const next: Partial<Record<TransportMode, LiveEstimate>> = {};

      if (walkRes) {
        next.walking = { ...walkRes, isReal: true };
      }
      if (driveRes) {
        const taxiEst = transit.estimates.taxi;
        next.taxi = { ...driveRes, isReal: true };
        next.uber = { ...driveRes, isReal: true };
      }

      setLiveData(next);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [originCoords.lat, originCoords.lng, destinationCoords.lat, destinationCoords.lng]);

  const getEstimate = (mode: TransportMode): { duration: number; distance: number; isReal: boolean } | null => {
    if (liveData[mode]) return liveData[mode]!;
    const stored = transit.estimates[mode];
    if (!stored) return null;
    return { duration: stored.duration, distance: stored.distance, isReal: false };
  };

  const currentEst = getEstimate(transit.selectedMode);
  const storedEst = transit.estimates[transit.selectedMode];

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

          {/* 時間顯示 */}
          <div className="text-right">
            {loading && !currentEst ? (
              <Loader2 size={12} className="animate-spin text-milk-tea-300 ml-auto" />
            ) : currentEst ? (
              <span className="text-[10px] text-milk-tea-400 font-mono">
                約 {currentEst.duration} 分・{(currentEst.distance / 1000).toFixed(1)} km
                {storedEst?.cost && (
                  <span className="ml-1 text-milk-tea-300">₩{storedEst.cost.toLocaleString()}</span>
                )}
                <span className={`ml-1 text-[9px] ${currentEst.isReal ? 'text-[#3DBDAD]' : 'text-milk-tea-300'}`}>
                  {currentEst.isReal ? '● 實測' : '○ 估算'}
                </span>
              </span>
            ) : null}
          </div>
        </div>

        {/* 查路線按鈕（主要：開啟地圖頁） */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openMapPage}
          className="w-full py-2.5 bg-milk-tea-500 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-sm"
        >
          <Map className="w-4 h-4" />
          <span>查路線</span>
        </motion.button>

        {/* 公車/地鐵 → Kakao Map（快速外開） */}
        {(transit.selectedMode === 'bus' || transit.selectedMode === 'subway') ? (
          <div className="flex space-x-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openKakaoMapDirections(
                { ...originCoords, name: originName },
                { ...destinationCoords, name: destinationName },
                KAKAO_MODE[transit.selectedMode] ?? 'traffic',
              )}
              className="flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm"
              style={{ backgroundColor: '#FAE100', color: '#3C1E1E' }}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Kakao Map</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openNaverMapDirections({ ...destinationCoords, name: destinationName })}
              className="flex-1 py-2 bg-milk-tea-100 text-milk-tea-600 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Naver Map</span>
            </motion.button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openNaverMapDirections({ ...destinationCoords, name: destinationName })}
              className="flex-1 py-2 bg-milk-tea-100 text-milk-tea-600 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Naver Map</span>
            </motion.button>
            {(transit.selectedMode === 'taxi' || transit.selectedMode === 'uber') && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => openUberToDestination({ ...destinationCoords, name: destinationName })}
                className="flex-1 py-2 bg-[#2D2030] text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Uber</span>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
