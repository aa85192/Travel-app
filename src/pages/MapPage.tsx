import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Navigation, Car, Clock, Ruler, Banknote, Loader2, AlertCircle } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { fetchKakaoCarRoute, vertexesToLatLng, KakaoRoute } from '../services/kakaoDirectionsService';
import { fetchTransitRoute, OdsayPath } from '../services/odsayService';
import { openKakaoMapDirections, openNaverMapDirections } from '../utils/deepLink';

const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;

// 模式標籤
const MODE_LABEL: Record<string, string> = {
  walking: '步行',
  bus: '公車',
  subway: '地鐵',
  taxi: '計程車',
  uber: 'Uber',
};

const MODE_COLOR: Record<string, string> = {
  walking: '#3DBDAD',
  bus:     '#8896F5',
  subway:  '#9B8FF5',
  taxi:    '#E8A830',
  uber:    '#2D2030',
};

// Kakao Map 深層連結模式對應
const KAKAO_DEEP_MODE: Record<string, 'car' | 'traffic' | 'walk' | 'bicycle'> = {
  walking: 'walk',
  bus:     'traffic',
  subway:  'traffic',
  taxi:    'car',
  uber:    'car',
};

// 判斷是否為大眾運輸
const IS_TRANSIT = (mode: string) => mode === 'bus' || mode === 'subway';
// 判斷是否為駕車
const IS_DRIVING = (mode: string) => mode === 'taxi' || mode === 'uber';

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
  const mapRef   = useRef<HTMLDivElement>(null);
  const kakaoMap = useRef<any>(null);

  const [sdkReady, setSdkReady]         = useState(false);
  const [sdkError, setSdkError]         = useState(false);
  const [carRoute, setCarRoute]         = useState<KakaoRoute | null>(null);
  const [transitRoute, setTransitRoute] = useState<OdsayPath | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const req  = mapRouteRequest;
  const mode = req?.mode ?? 'walking';

  // ── 載入 Kakao Maps JS SDK ─────────────────────────────────
  useEffect(() => {
    console.log('[MapPage] JS_KEY present:', !!JS_KEY, 'length:', JS_KEY?.length ?? 0);
    if (!JS_KEY) {
      console.error('[MapPage] VITE_KAKAO_JS_KEY not set');
      setSdkError(true);
      return;
    }

    // 已載入且已初始化
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
      // autoload=false 需呼叫 load() callback 確保所有 class 就緒
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
  }, [JS_KEY]);

  // ── 初始化地圖 + 標記 ─────────────────────────────────────
  useEffect(() => {
    if (!sdkReady || !mapRef.current || !req) return;

    const { origin, destination } = req;
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;

    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(midLat, midLng),
      level: 7,
    });
    kakaoMap.current = map;

    // 起點標記（綠）
    addMarker(map, origin.lat, origin.lng, origin.name, '#3DBDAD', '출발');
    // 終點標記（紅）
    addMarker(map, destination.lat, destination.lng, destination.name, '#E8538C', '도착');

    // 自動縮放以包含兩點
    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(new window.kakao.maps.LatLng(origin.lat, origin.lng));
    bounds.extend(new window.kakao.maps.LatLng(destination.lat, destination.lng));
    map.setBounds(bounds);

  }, [sdkReady, req, mode]);

  // ── 路線查詢：駕車/步行用 Kakao，大眾運輸用 ODsay ─────────
  useEffect(() => {
    if (!req || !sdkReady || !kakaoMap.current) return;

    const map = kakaoMap.current;
    setRouteLoading(true);

    if (IS_TRANSIT(mode)) {
      // 大眾運輸：ODsay API 取得實際路徑
      fetchTransitRoute(req.origin, req.destination).then((result) => {
        setRouteLoading(false);
        if (!result || !result.paths.length) {
          // API 不可用時 fallback 虛線
          drawDashedLine(map, req.origin, req.destination, MODE_COLOR[mode] ?? '#8896F5');
          return;
        }
        const bestPath = result.paths[0];
        setTransitRoute(bestPath);
        drawOdsayRoute(map, bestPath);
      });
    } else {
      // 駕車/步行：Kakao Directions API
      fetchKakaoCarRoute(req.origin, req.destination).then((route) => {
        setCarRoute(route);
        setRouteLoading(false);
        if (!route) {
          drawDashedLine(map, req.origin, req.destination, MODE_COLOR[mode] ?? '#E8A830');
          return;
        }
        const allPoints: any[] = [];
        for (const road of route.roads) {
          for (const p of vertexesToLatLng(road.vertexes)) {
            allPoints.push(new window.kakao.maps.LatLng(p.lat, p.lng));
          }
        }
        if (allPoints.length > 0) {
          const polyline = new window.kakao.maps.Polyline({
            path: allPoints,
            strokeWeight: 5,
            strokeColor: MODE_COLOR[mode] ?? '#3DBDAD',
            strokeOpacity: 0.85,
            strokeStyle: 'solid',
          });
          polyline.setMap(map);
        }
      });
    }
  }, [sdkReady, req, mode]);

  // ── 輔助：依 ODsay 各分段畫路線 ─────────────────────────
  function drawOdsayRoute(map: any, path: OdsayPath) {
    const bounds = new window.kakao.maps.LatLngBounds();

    for (const sub of path.subPath) {
      const stations = sub.passStopList?.stations ?? [];

      if (sub.trafficType === 3) {
        // 步行段：灰色虛線
        const sx = sub.startX, sy = sub.startY, ex = sub.endX, ey = sub.endY;
        if (sx && sy && ex && ey) {
          const from = new window.kakao.maps.LatLng(sy, sx);
          const to   = new window.kakao.maps.LatLng(ey, ex);
          new window.kakao.maps.Polyline({
            path: [from, to],
            strokeWeight: 2,
            strokeColor: '#9CA3AF',
            strokeOpacity: 0.7,
            strokeStyle: 'dashed',
          }).setMap(map);
          bounds.extend(from);
          bounds.extend(to);
        }
      } else if (stations.length >= 2) {
        // 地鐵(1) 或 公車(2)：依停靠站連線
        const color  = sub.trafficType === 1 ? '#9B8FF5' : '#8896F5';
        const weight = sub.trafficType === 1 ? 6 : 5;
        const points = stations.map(s => {
          const ll = new window.kakao.maps.LatLng(s.y, s.x);
          bounds.extend(ll);
          return ll;
        });
        new window.kakao.maps.Polyline({
          path: points,
          strokeWeight: weight,
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeStyle: 'solid',
        }).setMap(map);
      }
    }

    // 自動縮放以包含整條路線
    if (!bounds.isEmpty()) map.setBounds(bounds, 60);
  }

  // ── 輔助：畫虛線 ─────────────────────────────────────────
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
  }

  // ── 輔助：建立自訂標記 ────────────────────────────────────
  function addMarker(map: any, lat: number, lng: number, name: string, color: string, label: string) {
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

    const overlay = new window.kakao.maps.CustomOverlay({
      position: pos,
      content,
      xAnchor: 0,
      yAnchor: 0,
    });
    overlay.setMap(map);
  }

  // ── 無路線請求時：預設顯示釜山地圖 ─────────────────────────
  useEffect(() => {
    if (req || !sdkReady || !mapRef.current) return;
    // 釜山市中心
    const BUSAN = { lat: 35.1795543, lng: 129.0756416 };
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(BUSAN.lat, BUSAN.lng),
      level: 5,
    });
    kakaoMap.current = map;
  }, [sdkReady, req]);

  if (!req) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* 標題列 */}
        <div className="flex items-center px-4 py-3 bg-white border-b border-milk-tea-100 z-10 flex-shrink-0">
          <button onClick={onBack} className="mr-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-milk-tea-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-milk-tea-600" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-milk-tea-900">探索釜山</span>
            <span className="text-[10px] text-milk-tea-400 bg-milk-tea-50 px-2 py-0.5 rounded-full border border-milk-tea-100">Busan, Korea</span>
          </div>
        </div>

        {/* 地圖 */}
        <div className="flex-1 relative overflow-hidden">
          {!sdkError ? (
            <div ref={mapRef} className="w-full h-full" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 text-center">
              <div className="text-5xl">🗺️</div>
              <p className="text-sm font-bold text-milk-tea-700">無法載入 Kakao Map</p>
              <p className="text-xs text-milk-tea-400">需要設定 VITE_KAKAO_JS_KEY</p>
              <a
                href="https://map.kakao.com/?q=부산"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-[#FAE100] text-[#3C1E1E] rounded-full font-bold text-sm shadow-sm"
              >
                在 Kakao Map 探索釜山
              </a>
            </div>
          )}
          {!sdkReady && !sdkError && (
            <div className="absolute inset-0 flex items-center justify-center bg-milk-tea-50/80">
              <Loader2 className="w-8 h-8 animate-spin text-milk-tea-400" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const { origin, destination } = req;
  const modeColor = MODE_COLOR[mode] ?? '#3DBDAD';

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

        {/* 載入中覆蓋 */}
        {!sdkReady && !sdkError && (
          <div className="absolute inset-0 flex items-center justify-center bg-milk-tea-50/80">
            <Loader2 className="w-8 h-8 animate-spin text-milk-tea-400" />
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
        {/* 路線統計 */}
        {IS_TRANSIT(mode) ? (
          <TransitInfoPanel origin={origin} destination={destination} mode={mode} route={transitRoute} loading={routeLoading} />
        ) : (
          <CarInfoPanel route={carRoute} loading={routeLoading} mode={mode} />
        )}

        {/* 操作按鈕 */}
        <div className="space-y-2 mt-3">
          {/* 大眾運輸 → Kakao Map（主要） */}
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

          {/* 步行/駕車 → Naver Map（主要） */}
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

          {/* 通用 Kakao Map 備用按鈕 */}
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

// ── 大眾運輸資訊面板 ─────────────────────────────────────────

const TransitInfoPanel: React.FC<{
  origin: { name: string };
  destination: { name: string };
  mode: string;
  route: OdsayPath | null;
  loading: boolean;
}> = ({ mode, route, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 py-2 text-milk-tea-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">正在查詢路線…</span>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex items-center space-x-3 py-1">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: MODE_COLOR[mode] + '20' }}
        >
          <Navigation className="w-5 h-5" style={{ color: MODE_COLOR[mode] }} />
        </div>
        <div>
          <p className="text-sm font-bold text-milk-tea-800">
            {mode === 'bus' ? '公車路線' : '地鐵路線'}
          </p>
          <p className="text-xs text-milk-tea-400 mt-0.5">
            點下方按鈕，在 Kakao Map 查詢即時班次與轉乘資訊
          </p>
        </div>
      </div>
    );
  }

  const { totalTime, payment, busTransitCount, subwayTransitCount } = route.info;
  const transfers = busTransitCount + subwayTransitCount - 1;

  // 分段摘要：地鐵/公車 label
  const legs = route.subPath
    .filter(s => s.trafficType !== 3)
    .map(s => {
      const lane = s.lane?.[0];
      if (s.trafficType === 1) return lane?.name ?? '地鐵';
      return `公車 ${lane?.busNo ?? ''}`.trim();
    });

  return (
    <div className="space-y-2 py-1">
      {/* 統計數字 */}
      <div className="grid grid-cols-3 gap-2">
        <Stat icon={<Clock className="w-3 h-3" />} label="時間" value={`${totalTime} 分`} />
        <Stat icon={<Banknote className="w-3 h-3" />} label="票價" value={`₩${payment.toLocaleString()}`} />
        <Stat
          icon={<Navigation className="w-3 h-3" />}
          label="轉乘"
          value={transfers > 0 ? `${transfers} 次` : '直達'}
        />
      </div>
      {/* 路線標籤 */}
      {legs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {legs.map((leg, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: MODE_COLOR[mode] }}
            >
              {leg}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── 汽車路線資訊面板 ─────────────────────────────────────────

const CarInfoPanel: React.FC<{
  route: KakaoRoute | null;
  loading: boolean;
  mode: string;
}> = ({ route, loading, mode }) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 py-2 text-milk-tea-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">正在查詢路線…</span>
      </div>
    );
  }

  if (!route) {
    return (
      <p className="text-xs text-milk-tea-400 py-2">無法取得路線資料（請確認 KAKAO_REST_API_KEY 已設定）</p>
    );
  }

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
        <Stat icon={<Clock className="w-3 h-3" />} label="時間" value={`${mins} 分`} />
        <Stat icon={<Ruler className="w-3 h-3" />} label="距離" value={`${km} km`} />
        {taxi ? (
          <Stat icon={<Banknote className="w-3 h-3" />} label="計程車" value={`₩${taxi.toLocaleString()}`} />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center bg-milk-tea-50 rounded-xl py-2 px-1">
    <span className="text-milk-tea-400 mb-0.5">{icon}</span>
    <span className="text-[10px] text-milk-tea-400">{label}</span>
    <span className="text-xs font-bold text-milk-tea-800 mt-0.5">{value}</span>
  </div>
);
