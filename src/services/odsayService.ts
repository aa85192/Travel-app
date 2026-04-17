/**
 * ODsay Lab Public Transit API (via Cloudflare Worker proxy)
 * 韓國大眾運輸路線查詢：公車、地鐵、步行分段
 * Worker endpoint: /odsay/transit
 * 需在 Cloudflare Worker 設定 ODSAY_API_KEY（免費申請：lab.odsay.com）
 */

const WORKER_URL = 'https://visa-rate.aa85192.workers.dev';

export interface OdsayStation {
  stationID: string;
  stationName: string;
  x: number;   // longitude
  y: number;   // latitude
  arsID?: string;
}

export interface OdsayLane {
  name?: string;    // subway line name (e.g. "부산 1호선")
  busNo?: string;   // bus number (e.g. "1003")
  type?: number;
  busID?: number;
  subwayCode?: number;
}

export interface OdsaySubPath {
  trafficType: number;   // 1=subway, 2=bus, 3=walking
  distance: number;      // meters
  sectionTime: number;   // minutes
  stationCount?: number;
  lane?: OdsayLane[];
  passStopList?: { stations: OdsayStation[] };
  // start / end coordinates (always present)
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  startName?: string;
  endName?: string;
}

export interface OdsayPathInfo {
  totalTime: number;           // minutes
  payment: number;             // KRW total fare
  busTransitCount: number;
  subwayTransitCount: number;
  trafficDistance: number;     // meters (transit only)
  totalWalk?: number;          // meters
}

export interface OdsayPath {
  pathType: number;   // 1=bus only, 2=subway only, 3=mixed
  info: OdsayPathInfo;
  subPath: OdsaySubPath[];
}

export interface OdsayResult {
  paths: OdsayPath[];
}

export async function fetchTransitRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<OdsayResult | null> {
  try {
    const url =
      `${WORKER_URL}/odsay/transit` +
      `?sx=${origin.lng}&sy=${origin.lat}` +
      `&ex=${destination.lng}&ey=${destination.lat}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.error || data.result?.error) return null;

    const paths: OdsayPath[] = data?.result?.path ?? [];
    if (!paths.length) return null;

    return { paths };
  } catch {
    return null;
  }
}
