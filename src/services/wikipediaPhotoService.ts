/**
 * Photo lookup service — Naver Image Search via Cloudflare Worker proxy
 *
 * Credentials live in Worker env (NAVER_CLIENT_ID / NAVER_CLIENT_SECRET);
 * the frontend just hits /naver/image?q=... and gets the raw Naver response.
 */

const WORKER_URL = 'https://visa-rate.aa85192.workers.dev';

async function fetchNaverPhoto(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${WORKER_URL}/naver/image?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const item of (data?.items ?? [])) {
      const url: string = item.thumbnail || item.link;
      if (url?.startsWith('http')) return url;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchWikipediaPhoto(
  query: string,
  fallbackQuery?: string,
): Promise<string | null> {
  const candidates = [query, fallbackQuery].filter((q): q is string => !!q && q.trim().length > 0);
  for (const term of candidates) {
    const url = await fetchNaverPhoto(term);
    if (url) return url;
  }
  return null;
}
