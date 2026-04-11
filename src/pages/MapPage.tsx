import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Navigation, Car, Clock, Ruler, Banknote,
  Loader2, AlertCircle, Footprints, Bus, Train,
} from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { fetchKakaoCarRoute, vertexesToLatLng, KakaoRoute } from '../services/kakaoDirectionsService';
import { fetchOSRMRouteGeometry, OSRMRouteGeometry } from '../services/osrmService';
import { openKakaoMapDirections, openNaverMapDirections } from '../utils/deepLink';

type TravelMode = 'walking' | 'bus' | 'subway' | 'taxi' | 'uber';

const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;

// 模式標籤
const MODE_LABEL: Record<TravelMode, string> = {
  walking: '步行',
  bus: '公車',
  subway: '地鐵',
  taxi: '計程車',
  uber: 'Uber',
};

const MODE_COLOR: Record<TravelMode, string> = {
  walking: '#3DBDAD',
  bus:     '#8896F5',
  subway:  '#9B8FF5',
  taxi:    '#E8A830',
  uber:    '#2D2030',
};

// Kakao Map 深層連結模式對應
const KAKAO_DEEP_MODE: Record<TravelMode, 'car' | 'traffic' | 'walk' | 'bicycle'> = {
  walking: 'walk',
  bus:     'traffic',
  subway:  'traffic',
  taxi:    'car',
  uber:    'car',
};

const IS_TRANSIT = (mode: TravelMode) => mode === 'bus' || mode === 'subway';
const IS_DRIVING = (mode: TravelMode) => mode === 'taxi' || mode === 'uber';
const IS_WALKING = (mode: TravelMode) => mode === 'walking';

interface MapPageProps {
  onBack: () => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export const MapPage: React.FC<MapPageProps> = ({ onBack }) => {
  const { mapRouteRequest } = useUIStore();
  const mapRef     = useRef<HTMLDivElement>(null);
  const kakaoMap   = useRef<any>(null);
  // 紀錄目前畫在地圖上的所有 overlay（折線、標記），以便切換模式時清除
  const overlaysRef = useRef<any[]>([]);

  const [sdkReady, setSdkReady]         = useState(false);
  const [sdkError, setSdkError]         = useState(false);

  // 初始模式來自 TransitCard 的點擊；可在地圖頁切換
  const initialMode = (mapRouteRequest?.mode as TravelMode | undefined) ?? 'walking';
  const [mode, setMode] = useState<TravelMode>(initialMode);

  // 路線資料
  const [walkRoute, setWalkRoute]       = useState<OSRMRouteGeometry | null>(null);
  const [carRoute,  setCarRoute]        = useState<KakaoRoute | null>(null);
  const [carOSRM,   setCarOSRM]         = useState<OSRMRouteGeometry | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const req = mapRouteRequest;

  // 當有新的請求進來時，重設模式為新請求的模式
  useEffect(() => {
    if (mapRouteRequest?.mode) {
      setMode(mapRouteRequest.mode as TravelMode);
    }
  }, [mapRouteRequest]);

  // ── 載入 Kakao Maps JS SDK ─────────────────────────────────
  useEffect(() => {
    console.log('[MapPage] JS_KEY present:', !!JS_KEY, 'length:', JS_KEY?.length ?? 0);
    if (!JS_KEY) {
      console.error('[MapPage] VITE_KAKAO_JS_KEY not set');
      setSdkError(true);
      return;
    }

    if (window.kakao?.maps?.LatLng) {
      console.log('[MapPage] Kakao Maps SDK already loaded');
      setSdkReady(true);
      return;
    }

    console.log('[MapPage] Loading Kakao Maps SDK...');
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        console.log('[MapPage] Kakao Maps SDK fully ready');
        setSdkReady(true);
      });
    };
    script.onerror = (e) => {
      console.error('[MapPage] Failed to load Kakao Maps SDK', e);
      setSdkError(true);
    };
    document.head.appendChild(script);
  }, []);

  // ── 初始化地圖（只執行一次） ─────────────────────────────
  useEffect(() => {
    if (!sdkReady || !mapRef.current || !req || kakaoMap.current) return;

    const { origin, destination } = req;
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;

    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(midLat, midLng),
      level: 7,
    });
    kakaoMap.current = map;
  }, [sdkReady, req]);

  // ── 清除地圖上所有 overlay ────────────────────────────────
  function clearOverlays() {
    for (const ov of overlaysRef.current) {
      try { ov.setMap(null); } catch { /* noop */ }
    }
    overlaysRef.current = [];
  }

  // ── 繪製起終點標記 + 自動縮放 ────────────────────────────
  function drawMarkersAndFit(map: any, origin: any, destination: any) {
    const oOverlay = makeMarker(origin.lat, origin.lng, '#3DBDAD', '출발');
    const dOverlay = makeMarker(destination.lat, destination.lng, '#E8538C', '도착');
    oOverlay.setMap(map);
    dOverlay.setMap(map);
    overlaysRef.current.push(oOverlay, dOverlay);

    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(new window.kakao.maps.LatLng(origin.lat, origin.lng));
    bounds.extend(new window.kakao.maps.LatLng(destination.lat, destination.lng));
    map.setBounds(bounds);
  }

  // ── 主 effect：根據模式繪製對應路線 ───────────────────────
  useEffect(() => {
    if (!sdkReady || !req || !kakaoMap.current) return;

    const map = kakaoMap.current;
    const { origin, destination } = req;

    // 1. 清除舊內容
    clearOverlays();
    // 2. 重畫標記
    drawMarkersAndFit(map, origin, destination);

    // 3. 根據模式查路線
    let cancelled = false;
    setRouteLoading(true);

    (async () => {
      const color = MODE_COLOR[mode];

      if (IS_WALKING(mode)) {
        // OSRM 步行
        const r = await fetchOSRMRouteGeometry(
          origin.lat, origin.lng, destination.lat, destination.lng, 'foot',
        );
        if (cancelled) return;
        setWalkRoute(r);
        if (r && r.coordinates.length > 0) {
          drawPolyline(map, r.coordinates, color, 'solid');
        } else {
          drawDashedLine(map, origin, destination, color);
        }
      } else if (IS_DRIVING(mode)) {
        // 先試 Kakao Mobility，失敗再 fallback OSRM 駕車
        const k = await fetchKakaoCarRoute(origin, destination);
        if (cancelled) return;
        setCarRoute(k);
        if (k && k.roads.length > 0) {
          const all: { lat: number; lng: number }[] = [];
          for (const road of k.roads) {
            for (const p of vertexesToLatLng(road.vertexes)) all.push(p);
          }
          drawPolyline(map, all, color, 'solid');
        } else {
          // OSRM fallback
          const o = await fetchOSRMRouteGeometry(
            origin.lat, origin.lng, destination.lat, destination.lng, 'car',
          );
          if (cancelled) return;
          setCarOSRM(o);
          if (o && o.coordinates.length > 0) {
            drawPolyline(map, o.coordinates, color, 'solid');
          } else {
            drawDashedLine(map, origin, destination, color);
          }
        }
      } else {
        // 大眾運輸：JS SDK 不支援；用駕車路線當大致路徑（OSRM）+ 虛線疊加
        // 並提供深層連結到 Kakao Map 取得真實大眾運輸路線
        const o = await fetchOSRMRouteGeometry(
          origin.lat, origin.lng, destination.lat, destination.lng, 'car',
        );
        if (cancelled) return;
        if (o && o.coordinates.length > 0) {
          // 用較淡的虛線繪製，提示這是大致路徑
          drawPolyline(map, o.coordinates, color, 'dashed');
        } else {
          drawDashedLine(map, origin, destination, color);
        }
      }
      if (!cancelled) setRouteLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [sdkReady, req, mode]);

  // ── 繪線輔助 ─────────────────────────────────────────────
  function drawPolyline(
    map: any,
    coords: { lat: number; lng: number }[],
    color: string,
    style: 'solid' | 'dashed',
  ) {
    const path = coords.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng));
    const polyline = new window.kakao.maps.Polyline({
      path,
      strokeWeight: style === 'solid' ? 5 : 4,
      strokeColor:  color,
      strokeOpacity: style === 'solid' ? 0.85 : 0.6,
      strokeStyle:  style,
    });
    polyline.setMap(map);
    overlaysRef.current.push(polyline);
  }

  function drawDashedLine(
    map: any,
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    color: string,
  ) {
    const polyline = new window.kakao.maps.Polyline({
      path: [
        new window.kakao.maps.LatLng(from.lat, from.lng),
        new window.kakao.maps.LatLng(to.lat, to.lng),
      ],
      strokeWeight: 3,
      strokeColor: color,
      strokeOpacity: 0.6,
      strokeStyle: 'dashed',
    });
    polyline.setMap(map);
    overlaysRef.current.push(polyline);
  }

  function makeMarker(lat: number, lng: number, color: string, label: string) {
    const pos = new window.kakao.maps.LatLng(lat, lng);
    const content = `
      <div style="
        display:flex;flex-direction:column;align-items:center;
        transform:translateY(-100%) translateX(-50%);
        position:absolute;white-space:nowrap;
      ">
        <div style="
          background:${color};color:#fff;
          padding:3px 8px;border-radius:12px;
          font-size:11px;font-weight:bold;
          box-shadow:0 2px 6px rgba(0,0,0,.25);
          margin-bottom:3px;
        ">${label}</div>
        <div style="
          width:10px;height:10px;border-radius:50%;
          background:${color};border:2px solid #fff;
          box-shadow:0 2px 4px rgba(0,0,0,.3);
        "></div>
      </div>
    `;
    return new window.kakao.maps.CustomOverlay({
      position: pos,
      content,
      xAnchor: 0,
      yAnchor: 0,
    });
  }

  if (!req) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-milk-tea-400">
        <p className="text-sm">沒有路線資料</p>
        <button onClick={onBack} className="mt-4 text-milk-tea-500 underline text-sm">返回</button>
      </div>
    );
  }

  const { origin, destination } = req;
  const modeColor = MODE_COLOR[mode];

  return (
    <div className="flex flex-col h-screen bg-milk-tea-50">
      {/* 頂部標題列 */}
      <div className="flex items-center px-4 py-3 bg-white border-b border-milk-tea-200 z-10 flex-shrink-0">
        <button onClick={onBack} className="mr-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-milk-tea-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-milk-tea-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: modeColor }}
            >
              {MODE_LABEL[mode]}
            </span>
            <span className="text-xs text-milk-tea-500 truncate">
              {origin.name} → {destination.name}
            </span>
          </div>
        </div>
      </div>

      {/* 模式切換列 */}
      <ModeSwitcher mode={mode} onChange={setMode} />

      {/* 地圖區域 */}
      <div className="flex-1 relative overflow-hidden">
        {!sdkError ? (
          <div ref={mapRef} className="w-full h-full" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-milk-tea-400 space-y-2 p-6">
            <AlertCircle className="w-10 h-10 text-milk-tea-300" />
            <p className="text-sm font-bold text-milk-tea-600">地圖無法載入</p>
            <p className="text-xs text-center text-milk-tea-400">
              需要設定 VITE_KAKAO_JS_KEY<br />請在 Kakao 開發者後台取得 JavaScript 金鑰
            </p>
          </div>
        )}

        {!sdkReady && !sdkError && (
          <div className="absolute inset-0 flex items-center justify-center bg-milk-tea-50/80">
            <Loader2 className="w-8 h-8 animate-spin text-milk-tea-400" />
          </div>
        )}

        {sdkReady && routeLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-md border border-milk-tea-200 flex items-center space-x-1.5 z-10">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-milk-tea-500" />
            <span className="text-[11px] text-milk-tea-600 font-medium">查詢路線中…</span>
          </div>
        )}
      </div>

      {/* 底部資訊面板 */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-t-2xl shadow-xl border-t border-milk-tea-100 px-4 pt-4 pb-safe flex-shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        {IS_WALKING(mode) && <WalkInfoPanel route={walkRoute} loading={routeLoading} />}
        {IS_DRIVING(mode) && <CarInfoPanel route={carRoute} osrm={carOSRM} loading={routeLoading} mode={mode} />}
        {IS_TRANSIT(mode) && <TransitInfoPanel mode={mode} />}

        {/* 操作按鈕 */}
        <div className="space-y-2 mt-3">
          {IS_TRANSIT(mode) && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openKakaoMapDirections(
                { ...origin },
                { ...destination },
                KAKAO_DEEP_MODE[mode],
              )}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-sm"
              style={{ backgroundColor: '#FAE100', color: '#3C1E1E' }}
            >
              <Navigation className="w-4 h-4" />
              <span>在 Kakao Map 查詢大眾運輸路線</span>
            </motion.button>
          )}

          {!IS_TRANSIT(mode) && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openNaverMapDirections({ ...destination })}
              className="w-full py-3 bg-milk-tea-500 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-sm"
            >
              <Navigation className="w-4 h-4" />
              <span>在 Naver Map 開啟導航</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openKakaoMapDirections(
              { ...origin },
              { ...destination },
              KAKAO_DEEP_MODE[mode],
            )}
            className="w-full py-2.5 bg-milk-tea-100 text-milk-tea-600 rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Kakao Map 路線</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// ── 模式切換器 ───────────────────────────────────────────────

const MODE_OPTIONS: { mode: TravelMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'walking', icon: <Footprints className="w-3.5 h-3.5" />, label: '步行' },
  { mode: 'bus',     icon: <Bus className="w-3.5 h-3.5" />,        label: '公車' },
  { mode: 'subway',  icon: <Train className="w-3.5 h-3.5" />,      label: '地鐵' },
  { mode: 'taxi',    icon: <Car className="w-3.5 h-3.5" />,        label: '計程車' },
];

const ModeSwitcher: React.FC<{ mode: TravelMode; onChange: (m: TravelMode) => void }> = ({ mode, onChange }) => (
  <div className="flex items-center space-x-1.5 px-3 py-2 bg-white border-b border-milk-tea-100 flex-shrink-0 overflow-x-auto">
    {MODE_OPTIONS.map((opt) => {
      const active = opt.mode === mode || (opt.mode === 'taxi' && mode === 'uber');
      return (
        <button
          key={opt.mode}
          onClick={() => onChange(opt.mode)}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex-shrink-0 ${
            active
              ? 'text-white shadow-sm'
              : 'bg-milk-tea-50 text-milk-tea-500 hover:bg-milk-tea-100'
          }`}
          style={active ? { backgroundColor: MODE_COLOR[opt.mode] } : undefined}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      );
    })}
  </div>
);

// ── 步行資訊面板 ─────────────────────────────────────────────

const WalkInfoPanel: React.FC<{ route: OSRMRouteGeometry | null; loading: boolean }> = ({ route, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 py-2 text-milk-tea-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">正在查詢步行路線…</span>
      </div>
    );
  }
  if (!route) {
    return <p className="text-xs text-milk-tea-400 py-2">無法取得步行路線資料</p>;
  }
  const mins = Math.round(route.duration / 60);
  const km   = (route.distance / 1000).toFixed(2);
  return (
    <div className="flex items-center space-x-4 py-1">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: MODE_COLOR.walking + '20' }}
      >
        <Footprints className="w-5 h-5" style={{ color: MODE_COLOR.walking }} />
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Stat icon={<Clock className="w-3 h-3" />}  label="步行時間" value={`${mins} 分`} />
        <Stat icon={<Ruler className="w-3 h-3" />}  label="距離"     value={`${km} km`} />
      </div>
    </div>
  );
};

// ── 大眾運輸資訊面板 ─────────────────────────────────────────

const TransitInfoPanel: React.FC<{ mode: TravelMode }> = ({ mode }) => (
  <div className="flex items-center space-x-3 py-1">
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: MODE_COLOR[mode] + '20' }}
    >
      {mode === 'bus'
        ? <Bus className="w-5 h-5" style={{ color: MODE_COLOR[mode] }} />
        : <Train className="w-5 h-5" style={{ color: MODE_COLOR[mode] }} />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-milk-tea-800">
        {mode === 'bus' ? '公車路線' : '地鐵路線'}
      </p>
      <p className="text-[11px] text-milk-tea-400 mt-0.5 leading-snug">
        虛線為大致路徑；點下方按鈕以在 Kakao Map 查看實際班次與轉乘
      </p>
    </div>
  </div>
);

// ── 駕車資訊面板 ─────────────────────────────────────────────

const CarInfoPanel: React.FC<{
  route: KakaoRoute | null;
  osrm:  OSRMRouteGeometry | null;
  loading: boolean;
  mode: TravelMode;
}> = ({ route, osrm, loading, mode }) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 py-2 text-milk-tea-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">正在查詢路線…</span>
      </div>
    );
  }

  // 優先顯示 Kakao Mobility 結果（含計程車資費），否則退回 OSRM
  if (route) {
    const mins = Math.round(route.summary.duration / 60);
    const km   = (route.summary.distance / 1000).toFixed(1);
    const taxi = route.summary.fare?.taxi;
    return (
      <div className="flex items-center space-x-4 py-1">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: MODE_COLOR[mode] + '20' }}
        >
          <Car className="w-5 h-5" style={{ color: MODE_COLOR[mode] }} />
        </div>
        <div className="flex-1 grid grid-cols-3 gap-2">
          <Stat icon={<Clock className="w-3 h-3" />}    label="時間"   value={`${mins} 分`} />
          <Stat icon={<Ruler className="w-3 h-3" />}    label="距離"   value={`${km} km`} />
          {taxi
            ? <Stat icon={<Banknote className="w-3 h-3" />} label="計程車" value={`₩${taxi.toLocaleString()}`} />
            : <div />}
        </div>
      </div>
    );
  }

  if (osrm) {
    const mins = Math.round(osrm.duration / 60);
    const km   = (osrm.distance / 1000).toFixed(1);
    return (
      <div className="flex items-center space-x-4 py-1">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: MODE_COLOR[mode] + '20' }}
        >
          <Car className="w-5 h-5" style={{ color: MODE_COLOR[mode] }} />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <Stat icon={<Clock className="w-3 h-3" />} label="預估時間" value={`${mins} 分`} />
          <Stat icon={<Ruler className="w-3 h-3" />} label="距離"     value={`${km} km`} />
        </div>
      </div>
    );
  }

  return (
    <p className="text-xs text-milk-tea-400 py-2">無法取得路線資料</p>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center bg-milk-tea-50 rounded-xl py-2 px-1">
    <span className="text-milk-tea-400 mb-0.5">{icon}</span>
    <span className="text-[10px] text-milk-tea-400">{label}</span>
    <span className="text-xs font-bold text-milk-tea-800 mt-0.5">{value}</span>
  </div>
);
