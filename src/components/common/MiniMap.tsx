import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { openInNaverMap } from '../../utils/deepLink';

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

  useEffect(() => {
    if (!ref.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    let cancelled = false;
    loadKakaoSdk().then(() => {
      if (cancelled || !ref.current || !window.kakao?.maps) return;
      const center = new window.kakao.maps.LatLng(lat, lng);
      const map = new window.kakao.maps.Map(ref.current, {
        center,
        level: 3,
        draggable: false,
        scrollwheel: false,
        disableDoubleClick: true,
        disableDoubleClickZoom: true,
      });
      new window.kakao.maps.Marker({ position: center, map });
      // Resize after layout in case container was hidden during init
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
    <button
      type="button"
      onClick={() => openInNaverMap({ lat, lng, name: name || '' })}
      className={`relative w-full h-32 rounded-2xl overflow-hidden border border-milk-tea-200 shadow-sm group ${className ?? ''}`}
      title="點擊在 Naver Map 開啟"
    >
      <div ref={ref} className="absolute inset-0" />
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/85 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-bold text-milk-tea-600 shadow-sm pointer-events-none group-hover:bg-white">
        <ExternalLink size={11} />
        <span>NaverMap</span>
      </div>
    </button>
  );
};
