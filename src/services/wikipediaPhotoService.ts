/**
 * Photo lookup service — Naver Image Search only
 */

// ── Naver Image Search ───────────────────────────────────────────────────────

const NAVER_CLIENT_ID     = (import.meta.env.VITE_NAVER_CLIENT_ID     as string | undefined) ?? '';
const NAVER_CLIENT_SECRET = (import.meta.env.VITE_NAVER_CLIENT_SECRET as string | undefined) ?? '';

async function fetchNaverPhoto(query: string): Promise<string | null> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return null;
  try {
    const apiUrl = `https://openapi.naver.com/v1/search/image.json?` +
      new URLSearchParams({ query, display: '5', sort: 'sim', filter: 'all' });
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`;
    const res = await fetch(proxyUrl, {
      headers: {
        'X-Naver-Client-Id':     NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
      signal: AbortSignal.timeout(6000),
    });
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

// ── Public API ───────────────────────────────────────────────────────────────

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
