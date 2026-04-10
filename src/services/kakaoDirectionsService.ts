/**
 * Kakao Mobility Directions API (via Cloudflare Worker proxy)
 * Worker URL: https://visa-rate.aa85192.workers.dev/kakao/directions
 *
 * 需要在 Cloudflare Worker 設定環境變數 KAKAO_REST_API_KEY
 */

const WORKER_URL = 'https://visa-rate.aa85192.workers.dev';

export interface KakaoFare {
  taxi: number;   // KRW
  toll: number;   // KRW
}

export interface KakaoRouteSummary {
  duration: number;   // seconds
  distance: number;   // meters
  fare: KakaoFare;
}

export interface KakaoRoad {
  name: string;
  distance: number;
  duration: number;
  vertexes: number[];  // flat [lng, lat, lng, lat, ...]
}

export interface KakaoRoute {
  result_code: number;
  result_msg: string;
  summary: KakaoRouteSummary;
  roads: KakaoRoad[];
}

/**
 * 查詢汽車路線（距離、時間、預估計程車費、路線座標）
 * Note: Kakao Mobility 僅支援汽車/步行路線，公車/地鐵請使用深層連結至 Kakao Map
 */
export async function fetchKakaoCarRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<KakaoRoute | null> {
  try {
    const start = `${origin.lng},${origin.lat}`;
    const goal  = `${destination.lng},${destination.lat}`;
    const res = await fetch(
      `${WORKER_URL}/kakao/directions?start=${encodeURIComponent(start)}&goal=${encodeURIComponent(goal)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route || route.result_code !== 0) return null;
    return route as KakaoRoute;
  } catch {
    return null;
  }
}

/**
 * 將 Kakao road vertexes 轉為 [{ lat, lng }] 陣列，供 Kakao Maps SDK 使用
 */
export function vertexesToLatLng(vertexes: number[]): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  for (let i = 0; i + 1 < vertexes.length; i += 2) {
    points.push({ lng: vertexes[i], lat: vertexes[i + 1] });
  }
  return points;
}
