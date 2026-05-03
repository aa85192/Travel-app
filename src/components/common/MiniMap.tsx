import React, { useEffect, useRef } from 'react';
import { Maximize2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;

declare global {
  interface Window {
    kakao: any;
  }
}

let _sdkPromise: Promise<void> | null = null;
function loadKakaoSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.kakao?.maps?.LatLng) return Promise.resolve();
  if (_sdkPromise) return _sdkPromise;
  _sdkPromise = new Promise((resolve, reject) => {
    if (!JS_KEY) {
      reject(new Error('VITE_KAKAO_JS_KEY not set'));
      return;
    }
    const existing = document.querySelector('script[data-kakao-sdk]') as HTMLScriptElement | null;
    const onReady = () => window.kakao.maps.load(() => resolve());
    if (existing) {
      if (window.kakao?.maps?.LatLng) onReady();
      else existing.addEventListener('load', onReady);
      return;
    }
    const s = document.createElement('script');
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false`;
    s.async = true;
    s.dataset.kakaoSdk = '1';
    s.onload = onReady;
    s.onerror = () => reject(new Error('kakao sdk failed to load'));
    document.head.appendChild(s);
  });
  return _sdkPromise;
}

interface MiniMapProps {
  lat: number;
  lng: number;
  name?: string;
  className?: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({ lat, lng, name, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { setMapPreviewSpot, setNavigateTo, closeModal } = useUIStore();

  const openInAppMap = () => {
    setMapPreviewSpot({ lat, lng, name: name ?? '' });
    closeModal();
    setNavigateTo('map');
  };

  useEffect(() => {
    if (!ref.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    let cancelled = false;
    loadKakaoSdk().then(() => {
      if (cancelled || !ref.current || !window.kakao?.maps) return;
      const center = new window.kakao.maps.LatLng(lat, lng);
      const map = new window.kakao.maps.Map(ref.current, {
        center,
        level: 3,
        // 允許縮放（含 pinch / 雙指）但禁止拖移，避免 preview 被滑走
        draggable: false,
        scrollwheel: true,
      });
      try { map.setZoomable(true); } catch { /* noop */ }
      try { map.setDraggable(false); } catch { /* noop */ }

      new window.kakao.maps.Marker({ position: center, map });

      // 點擊地圖任一處 → 開全頁地圖（pinch/zoom 不會觸發 click）
      window.kakao.maps.event.addListener(map, 'click', openInAppMap);

      setTimeout(() => {
        try {
          map.relayout();
          map.setCenter(center);
        } catch {
          /* noop */
        }
      }, 60);
    }).catch((e) => console.warn('[MiniMap]', e));
    return () => { cancelled = true; };
  }, [lat, lng]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return (
    <div
      className={`relative w-full h-32 rounded-2xl overflow-hidden border border-milk-tea-200 shadow-sm ${className ?? ''}`}
    >
      <div ref={ref} className="absolute inset-0" />
      <button
        type="button"
        onClick={openInAppMap}
        className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-[10px] font-bold text-milk-tea-700 shadow-md hover:bg-white transition-colors z-10"
      >
        <Maximize2 size={11} />
        <span>放大</span>
      </button>
      <div className="absolute bottom-1 left-2 text-[9px] text-milk-tea-400 bg-white/70 px-2 py-0.5 rounded-full pointer-events-none">
        雙指縮放 · 點擊放大
      </div>
    </div>
  );
};
