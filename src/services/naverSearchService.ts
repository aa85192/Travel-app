/**
 * Naver Local Search API 整合
 *
 * 需要的環境變數（設定在 GitHub Secrets → Actions variables）：
 *   VITE_NAVER_CLIENT_ID     = 你的 Client ID
 *   VITE_NAVER_CLIENT_SECRET = 你的 Client Secret
 *
 * 注意：Naver Local Search API 需要 server-side 呼叫（CORS 限制）。
 * 此檔案透過 corsproxy.io 作為 CORS proxy 進行呼叫。
 * ⚠️ 此方式會將 credentials 暴露在 JS bundle 中，僅適合私人使用的 App。
 */

import { PlaceResult } from './placeSearchService';

const CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined;
const CLIENT_SECRET = import.meta.env.VITE_NAVER_CLIENT_SECRET as string | undefined;

export const isNaverSearchConfigured = Boolean(CLIENT_ID && CLIENT_SECRET);

/**
 * 用 Naver Local Search API 搜尋地點（韓國境內）
 * 回傳格式與 placeSearchService 相容，可直接替換
 */
export async function searchNaverPlaces(query: string): Promise<PlaceResult[]> {
  if (!isNaverSearchConfigured) {
    throw new Error('Naver API credentials not configured');
  }

  // Naver Local Search API endpoint
  const apiUrl = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5&start=1&sort=random`;

  // CORS proxy — corsproxy.io 會轉發自訂 header
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`;

  const res = await fetch(proxyUrl, {
    headers: {
      'X-Naver-Client-Id': CLIENT_ID!,
      'X-Naver-Client-Secret': CLIENT_SECRET!,
    },
  });

  if (!res.ok) throw new Error(`Naver API error: ${res.status}`);

  const data = await res.json();

  return (data.items as any[]).map((item: any) => {
    // 去除 HTML 標籤（Naver 在 title 中使用 <b> 標記）
    const name = item.title.replace(/<[^>]+>/g, '');
    // mapx/mapy 是 WGS84 * 1e7
    const lng = parseInt(item.mapx) / 1e7;
    const lat = parseInt(item.mapy) / 1e7;

    return {
      id: item.link || name,
      name,
      address: item.roadAddress || item.address,
      lat,
      lng,
    };
  });
}
