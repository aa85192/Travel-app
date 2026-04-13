/**
 * Uber Price Estimate Service (via Cloudflare Worker proxy)
 * Worker URL: https://visa-rate.aa85192.workers.dev/uber/estimate
 *
 * 需要在 Cloudflare Worker 設定環境變數：
 *   UBER_CLIENT_ID     ← Uber Developer Dashboard 的 Application ID
 *   UBER_CLIENT_SECRET ← Uber Developer Dashboard 的 Client Secret
 */

const WORKER_URL = 'https://visa-rate.aa85192.workers.dev';

export interface UberProduct {
  displayName:  string;
  estimate:     string;
  lowEstimate:  number | null;
  highEstimate: number | null;
}

export interface UberEstimate {
  displayName:  string;
  lowEstimate:  number | null;
  highEstimate: number | null;
  estimate:     string;       // Uber 格式化字串，如 "₩5,000-₩7,000" 或 "Metered"
  currencyCode: string;
  duration:     number;       // 秒（trip duration）
  distance:     number;       // 英里
  allProducts?: UberProduct[]; // 該區域所有可用 Uber 車型
}

/**
 * 取得 Uber 車資與路程時間估算
 * 成功回傳 UberEstimate，失敗（Uber 不可用或 API 錯誤）回傳 null
 */
export async function fetchUberEstimate(
  startLat: number, startLng: number,
  endLat:   number, endLng:   number,
): Promise<UberEstimate | null> {
  try {
    const url =
      `${WORKER_URL}/uber/estimate` +
      `?startLat=${startLat}&startLng=${startLng}` +
      `&endLat=${endLat}&endLng=${endLng}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    return await res.json() as UberEstimate;
  } catch {
    return null;
  }
}

/** 英里轉公尺 */
export const milesToMeters = (miles: number) => Math.round(miles * 1609.34);
