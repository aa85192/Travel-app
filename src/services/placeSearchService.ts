/**
 * 地點搜尋服務 — 統一入口
 *
 * 優先順序：Kakao（韓國最準）→ Naver（若有設定憑證）→ Nominatim (OSM)
 */

import { isNaverSearchConfigured, searchNaverPlaces } from './naverSearchService';
import { searchKakaoPlaces } from './kakaoSearchService';

export interface PlaceResult {
  id: string;
  name: string;
  nameLocal?: string;
  address: string;
  lat: number;
  lng: number;
}

let lastNominatimRequest = 0;

async function searchNominatim(query: string): Promise<PlaceResult[]> {
  const now = Date.now();
  const wait = 1000 - (now - lastNominatimRequest);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimRequest = Date.now();

  const params = new URLSearchParams({
    q: query,
    countrycodes: 'kr',
    format: 'json',
    limit: '6',
    addressdetails: '1',
    'accept-language': 'zh-TW,zh,ko,en',
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'User-Agent': 'MilkTeaTravel/1.0 (personal travel app)' } }
  );
  if (!res.ok) throw new Error('搜尋失敗');

  const raw: any[] = await res.json();
  return raw.map((item) => {
    const parts = item.display_name.split(', ');
    return {
      id: String(item.place_id),
      name: parts[0],
      address: parts.slice(1).join(', '),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
  });
}

/** 搜尋韓國地點（Kakao → Naver → Nominatim） */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query.trim()) return [];

  try {
    const kakao = await searchKakaoPlaces(query);
    if (kakao.length > 0) return kakao;
  } catch (e) {
    console.warn('[place-search] Kakao failed, falling through:', e);
  }

  if (isNaverSearchConfigured) {
    try {
      const naver = await searchNaverPlaces(query);
      if (naver.length > 0) return naver;
    } catch (e) {
      console.warn('[place-search] Naver failed, falling through:', e);
    }
  }

  return searchNominatim(query);
}
