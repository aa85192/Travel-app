/**
 * OSRM Routing Service
 * 使用 OSRM 公開 API (router.project-osrm.org) 取得真實路線時間與距離
 * - 完全免費、無需 API key、支援全球包含韓國
 * - 支援步行 (foot) 與駕車 (car)
 * - 不支援公車/地鐵（需韓國官方 API），這兩項繼續用估算
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

export interface OSRMResult {
  duration: number;   // 秒
  distance: number;   // 公尺
}

async function fetchOSRM(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  profile: 'foot' | 'car'
): Promise<OSRMResult | null> {
  try {
    const url =
      `${OSRM_BASE}/${profile}/${fromLng},${fromLat};${toLng},${toLat}` +
      `?overview=false&steps=false`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;

    return {
      duration: Math.round(route.duration / 60),  // 轉分鐘
      distance: Math.round(route.distance),
    };
  } catch {
    return null;
  }
}

/**
 * 取得步行真實路線
 */
export const fetchWalkingRoute = (
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
) => fetchOSRM(fromLat, fromLng, toLat, toLng, 'foot');

/**
 * 取得駕車真實路線（計程車 / Uber 使用）
 */
export const fetchDrivingRoute = (
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
) => fetchOSRM(fromLat, fromLng, toLat, toLng, 'car');
