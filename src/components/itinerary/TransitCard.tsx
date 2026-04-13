import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Navigation, Car, ExternalLink, Loader2, Map } from 'lucide-react';
import { Transit, TransportMode } from '../../types';
import { TransportIcon } from '../common/TransportIcon';
import { openNaverMapDirections, openUberToDestination, openKakaoMapDirections } from '../../utils/deepLink';
import { useTripStore } from '../../stores/tripStore';
import { useUIStore } from '../../stores/uiStore';
import { fetchDrivingRoute } from '../../services/osrmService';
import { fetchUberEstimate, milesToMeters } from '../../services/uberService';

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


interface LiveEstimate {
  duration: number;
  distance: number;
  isReal: boolean;   // true = 真實 API 資料, false = Haversine 估算
  fareStr?: string;  // Uber API 格式化車資，如 "₩5,000-₩7,000"
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

  // 從 OSRM 取得的即時路線（key = TransportMode）
  const [liveData, setLiveData] = useState<Partial<Record<TransportMode, LiveEstimate>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // 優先嘗試 Uber API（車資字串）
      const uberRes = await fetchUberEstimate(
        originCoords.lat, originCoords.lng,
        destinationCoords.lat, destinationCoords.lng,
      );
      if (cancelled) return;

      const next: Partial<Record<TransportMode, LiveEstimate>> = {};

      // Uber 車資字串：有數字的才保留（排除 "Metered" 等無法顯示的字串）
      const fareStr = uberRes?.estimate && /\d/.test(uberRes.estimate)
        ? uberRes.estimate : undefined;

      // Uber 在韓國為計程表車型，duration/distance 可能為 null/undefined
      // 有完整路線資料時才用 Uber；否則一律用 OSRM 取路線（備援）
      if (uberRes && uberRes.duration != null && uberRes.distance != null) {
        next.taxi = { duration: Math.round(uberRes.duration / 60), distance: milesToMeters(uberRes.distance), isReal: true, fareStr };
        next.uber = { duration: Math.round(uberRes.duration / 60), distance: milesToMeters(uberRes.distance), isReal: true, fareStr };
      } else {
        // OSRM 備援（Uber 無路線資料，或 API 失敗）
        const driveRes = await fetchDrivingRoute(
          originCoords.lat, originCoords.lng,
          destinationCoords.lat, destinationCoords.lng,
        );
        if (!cancelled && driveRes) {
          next.taxi = { ...driveRes, isReal: true, fareStr };
          next.uber = { ...driveRes, isReal: true, fareStr };
        }
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

  // 首爾計程車費：基本 ₩4,800（1.6km 內），之後 ₩763/km（Uber API 不可用時的備援）
  const computeTaxiCost = (distanceMeters: number): number => {
    const km = distanceMeters / 1000;
    return Math.round(4800 + Math.max(0, km - 1.6) * 763);
  };
  const isTaxiMode = transit.selectedMode === 'taxi' || transit.selectedMode === 'uber';
  // fareStr 優先（Uber API 真實車資），否則用公式計算
  const fareStr    = isTaxiMode ? (currentEst?.fareStr ?? null) : null;
  const displayCost = !fareStr && isTaxiMode && currentEst
    ? computeTaxiCost(currentEst.distance)
    : (!fareStr ? storedEst?.cost : null);

  return (
    <div className="relative pl-12 py-2">
      {/* Timeline connector */}
      <div className="absolute left-[21px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-milk-tea-300" />

      <div className="bg-white/40 rounded-xl p-3 border border-milk-tea-200/50 space-y-3">
        {/* Mode selector */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {[
              { id: 'walking',  btnModes: ['walking'] as TransportMode[],       label: '步行',          showBothIcons: false },
              { id: 'transit',  btnModes: ['bus', 'subway'] as TransportMode[], label: '公車 / 地鐵',   showBothIcons: true  },
              { id: 'taxi',     btnModes: ['taxi', 'uber'] as TransportMode[],  label: '計程車 / Uber', showBothIcons: false },
            ].map(({ id, btnModes, label, showBothIcons }) => {
              const active = btnModes.includes(transit.selectedMode);
              const color = MODE_COLORS[btnModes[0]];
              const iconsToShow = showBothIcons ? btnModes : [btnModes[0]];
              const isWide = iconsToShow.length > 1;
              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  onClick={() => updateTransitMode(dayNumber, transit.id, btnModes[0])}
                  style={active ? { backgroundColor: color.bg, color: color.text } : {}}
                  className={`${isWide ? 'px-1.5' : 'w-7'} h-7 rounded-full flex items-center justify-center gap-0.5 transition-all active:scale-90 ${
                    active
                      ? 'shadow-sm scale-110'
                      : 'bg-milk-tea-100 text-milk-tea-400 hover:bg-milk-tea-200'
                  }`}
                >
                  {iconsToShow.map(m => (
                    <TransportIcon key={m} mode={m} className={isWide ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                  ))}
                </button>
              );
            })}
          </div>

          {/* 時間顯示（公車/地鐵無法估算，不顯示） */}
          <div className="text-right">
            {transit.selectedMode !== 'bus' && transit.selectedMode !== 'subway' && (
              loading && !currentEst ? (
                <Loader2 size={12} className="animate-spin text-milk-tea-300 ml-auto" />
              ) : currentEst ? (
                <span className="text-[10px] text-milk-tea-400 font-mono">
                  約 {currentEst.duration} 分・{(currentEst.distance / 1000).toFixed(1)} km
                  {fareStr ? (
                    <span className="ml-1 text-milk-tea-300">{fareStr}</span>
                  ) : displayCost ? (
                    <span className="ml-1 text-milk-tea-300">₩{displayCost.toLocaleString()}</span>
                  ) : null}
                  <span className={`ml-1 text-[9px] ${currentEst.isReal ? 'text-[#3DBDAD]' : 'text-milk-tea-300'}`}>
                    {currentEst.isReal ? '● 實測' : '○ 估算'}
                  </span>
                </span>
              ) : null
            )}
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
