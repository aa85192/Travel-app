import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Navigation, Car, Clock, Ruler, Banknote, Loader2, AlertCircle, Search, X, MapPin } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { fetchKakaoCarRoute, vertexesToLatLng, KakaoRoute } from '../services/kakaoDirectionsService';
import { openKakaoMapDirections, openNaverMapDirections } from '../utils/deepLink';
import { searchPlaces, PlaceResult } from '../services/placeSearchService';

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
  const { mapRouteRequest, mapPreviewSpot, setMapPreviewSpot } = useUIStore();
  const mapRef   = useRef<HTMLDivElement>(null);
  const kakaoMap = useRef<any>(null);

  const [sdkReady, setSdkReady]     = useState(false);
  const [sdkError, setSdkError]     = useState(false);
  const [carRoute, setCarRoute]     = useState<KakaoRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // ── 探索模式搜尋 ────────────────────────────────────────────
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const searchOverlayRef = useRef<any>(null);
  const searchDebounce   = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // 大眾運輸模式：畫虛線連接起終點作為視覺提示
    if (IS_TRANSIT(mode)) {
      drawDashedLine(map, origin, destination, MODE_COLOR[mode] ?? '#8896F5');
    }
  }, [sdkReady, req, mode]);

  // ── 駕車/步行 → 查 Kakao Directions 並畫路線 ─────────────
  useEffect(() => {
    if (!req || !sdkReady || IS_TRANSIT(mode)) return;
    if (!kakaoMap.current) return;

    console.log('[MapPage] Fetching route for mode:', mode);
    setRouteLoading(true);
    fetchKakaoCarRoute(req.origin, req.destination).then((route) => {
      console.log('[MapPage] Route result:', route);
      setCarRoute(route);
      setRouteLoading(false);

      const map = kakaoMap.current;
      if (!map) return;

      if (!route) {
        // API 失敗 → fallback 直線
        console.warn('[MapPage] No route from API, drawing fallback line');
        drawDashedLine(map, req.origin, req.destination, MODE_COLOR[mode] ?? '#E8A830');
        return;
      }

      // 畫實際路線折線
      const allPoints: any[] = [];
      for (const road of route.roads) {
        const pts = vertexesToLatLng(road.vertexes);
        for (const p of pts) {
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
  }, [sdkReady, req, mode]);

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

  // ── 單點預覽（從 SpotFormFields 的 MiniMap 點進來）──────────
  useEffect(() => {
    if (req || !sdkReady || !mapRef.current || !mapPreviewSpot) return;
    const { lat, lng, name } = mapPreviewSpot;
    const center = new window.kakao.maps.LatLng(lat, lng);
    const map = new window.kakao.maps.Map(mapRef.current, {
      center,
      level: 3,
    });
    kakaoMap.current = map;
    addMarker(map, lat, lng, name || '此處', '#E8538C', name || '景點');
  }, [sdkReady, req, mapPreviewSpot]);

  // 離開地圖頁時清掉 preview，避免下次進來還顯示舊的
  useEffect(() => () => setMapPreviewSpot(null), [setMapPreviewSpot]);

  // ── 探索搜尋 ────────────────────────────────────────────────
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchPlaces(q);
        setSearchResults(results);
        setSearchOpen(results.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, []);

  const handleSelectPlace = useCallback((place: PlaceResult) => {
    setSearchOpen(false);
    setSearchQuery(place.name);

    const map = kakaoMap.current;
    if (!map) return;

    const pos = new window.kakao.maps.LatLng(place.lat, place.lng);
    map.setCenter(pos);
    map.setLevel(3);

    // 移除舊搜尋結果 overlay
    if (searchOverlayRef.current) {
      searchOverlayRef.current.setMap(null);
    }

    const content = `
      <div style="
        display:flex;flex-direction:column;align-items:center;
        transform:translateY(-100%) translateX(-50%);
        position:absolute;white-space:nowrap;
      ">
        <div style="
          background:#E8538C;color:#fff;
          padding:4px 10px;border-radius:12px;
          font-size:12px;font-weight:bold;
          box-shadow:0 2px 6px rgba(0,0,0,.25);
          margin-bottom:4px;max-width:180px;
          overflow:hidden;text-overflow:ellipsis;
        ">${place.name}</div>
        <div style="
          width:12px;height:12px;border-radius:50%;
          background:#E8538C;border:2.5px solid #fff;
          box-shadow:0 2px 4px rgba(0,0,0,.3);
        "></div>
      </div>
    `;
    const overlay = new window.kakao.maps.CustomOverlay({ position: pos, content, xAnchor: 0, yAnchor: 0 });
    overlay.setMap(map);
    searchOverlayRef.current = overlay;
  }, []);

  // ── 無路線請求時：預設顯示釜山地圖 ─────────────────────────
  useEffect(() => {
    if (req || !sdkReady || !mapRef.current || mapPreviewSpot) return;
    // 釜山市中心
    const BUSAN = { lat: 35.1795543, lng: 129.0756416 };
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(BUSAN.lat, BUSAN.lng),
      level: 5,
    });
    kakaoMap.current = map;
  }, [sdkReady, req, mapPreviewSpot]);

  if (!req) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* 標題列 */}
        <div className="bg-white border-b border-milk-tea-100 z-20 flex-shrink-0">
          <div className="flex items-center px-4 py-3">
            <button onClick={onBack} className="mr-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-milk-tea-100 transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-milk-tea-600" />
            </button>
            {mapPreviewSpot ? (
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-sm font-bold text-milk-tea-900 truncate">{mapPreviewSpot.name || '景點預覽'}</span>
                <span className="text-[10px] text-milk-tea-400 bg-milk-tea-50 px-2 py-0.5 rounded-full border border-milk-tea-100 flex-shrink-0">單點預覽</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-milk-tea-900">探索地圖</span>
              </div>
            )}
          </div>

          {/* 搜尋欄（只在探索模式顯示，非單點預覽） */}
          {!mapPreviewSpot && (
            <div className="px-4 pb-3 relative">
              <div className="flex items-center bg-milk-tea-50 border border-milk-tea-200 rounded-2xl px-3 py-2 gap-2 focus-within:border-milk-tea-400 transition-colors">
                {searchLoading
                  ? <Loader2 className="w-4 h-4 text-milk-tea-400 animate-spin flex-shrink-0" />
                  : <Search className="w-4 h-4 text-milk-tea-400 flex-shrink-0" />
                }
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  placeholder="搜尋景點、餐廳、咖啡廳…"
                  className="flex-1 bg-transparent text-sm outline-none text-milk-tea-900 placeholder:text-milk-tea-300"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }} className="flex-shrink-0">
                    <X className="w-4 h-4 text-milk-tea-400 hover:text-milk-tea-600" />
                  </button>
                )}
              </div>

              {/* 搜尋結果下拉 */}
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-4 right-4 top-full mt-1 bg-white rounded-2xl shadow-xl border border-milk-tea-100 overflow-hidden z-30"
                  >
                    {searchResults.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => handleSelectPlace(place)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-milk-tea-50 transition-colors text-left border-b border-milk-tea-50 last:border-0"
                      >
                        <MapPin className="w-4 h-4 text-milk-tea-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-milk-tea-900 truncate">{place.name}</p>
                          {place.address && <p className="text-[11px] text-milk-tea-400 truncate">{place.address}</p>}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
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
                在 Kakao Map 探索
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
    <div className="flex flex-col h-full bg-milk-tea-50">
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
      >
        {/* 路線統計 */}
        {IS_TRANSIT(mode) ? (
          <TransitInfoPanel origin={origin} destination={destination} mode={mode} />
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
}> = ({ mode }) => (
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
