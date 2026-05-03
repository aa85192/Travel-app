/**
 * Kakao Local Search proxy.
 * Routes through the Cloudflare Worker so the REST API key stays
 * server-side and CORS is taken care of.
 */
import type { PlaceResult } from './placeSearchService';

const WORKER_URL = 'https://visa-rate.aa85192.workers.dev';

interface KakaoDocument {
  id?: string;
  place_name?: string;
  address_name?: string;
  road_address_name?: string;
  category_name?: string;
  x?: string; // longitude
  y?: string; // latitude
}

export async function searchKakaoPlaces(query: string): Promise<PlaceResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${WORKER_URL}/kakao/search?query=${encodeURIComponent(query)}`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) {
    console.warn('[Kakao] HTTP', res.status);
    return [];
  }
  const data = await res.json();
  const docs: KakaoDocument[] = data?.documents ?? [];
  return docs
    .map((d, i) => ({
      id:        d.id ?? `kakao-${i}`,
      name:      d.place_name ?? '',
      nameLocal: d.place_name ?? '',
      address:   d.road_address_name || d.address_name || '',
      lat:       parseFloat(d.y ?? ''),
      lng:       parseFloat(d.x ?? ''),
    }))
    .filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .slice(0, 6);
}
