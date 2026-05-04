/**
 * Photo lookup service
 *
 * Strategy (cheapest → broadest coverage):
 *   1. Naver Image Search  — via corsproxy.io (best for KR restaurants / cafes / shops)
 *   2. Wikipedia REST page summary  — ko / en, exact title
 *   3. Wikipedia MediaWiki search   — ko / en, keyword search
 */

// ── Wikipedia ────────────────────────────────────────────────────────────────

async function fetchPageSummaryThumb(title: string, lang: 'ko' | 'en'): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const thumb: string | undefined = data?.thumbnail?.source;
    if (!thumb) return null;
    return thumb.replace(/\/\d+px-/, '/640px-');
  } catch {
    return null;
  }
}

async function searchAndPickThumb(query: string, lang: 'ko' | 'en'): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrlimit: '5',
      prop: 'pageimages',
      pithumbsize: '640',
      format: 'json',
      origin: '*',
    });
    const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages: Record<string, any> = data?.query?.pages;
    if (!pages) return null;

    const ranked = Object.values(pages).sort(
      (a: any, b: any) => (a.index ?? 99) - (b.index ?? 99),
    );
    for (const page of ranked) {
      if (page.thumbnail?.source) {
        return page.thumbnail.source.replace(/\/\d+px-/, '/640px-');
      }
    }
    return null;
  } catch {
    return null;
  }
}

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

/**
 * Resolves a representative photo for a landmark / restaurant / cafe.
 * @param query        Primary lookup term (Korean name preferred)
 * @param fallbackQuery Secondary term tried when primary fails all sources
 */
export async function fetchWikipediaPhoto(
  query: string,
  fallbackQuery?: string,
): Promise<string | null> {
  const candidates = [query, fallbackQuery].filter((q): q is string => !!q && q.trim().length > 0);
  const langs: ('ko' | 'en')[] = ['ko', 'en'];

  // Phase 1: Naver Image Search (Korean restaurants / cafes / shops — highest hit rate for KR)
  for (const term of candidates) {
    const url = await fetchNaverPhoto(term);
    if (url) return url;
  }

  // Phase 2: Wikipedia page summary (exact title match)
  for (const term of candidates) {
    for (const lang of langs) {
      const url = await fetchPageSummaryThumb(term, lang);
      if (url) return url;
    }
  }

  // Phase 3: Wikipedia full-text search
  for (const term of candidates) {
    for (const lang of langs) {
      const url = await searchAndPickThumb(term, lang);
      if (url) return url;
    }
  }

  return null;
}
