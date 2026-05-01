/**
 * Wikipedia Photo Service
 * Resolves landmark photos via Wikipedia, no API key required.
 *
 * Strategy (cheapest → fuzziest):
 *   1. REST page summary on ko / en wiki with the exact title
 *   2. MediaWiki action=query generator=search, ordered by relevance
 *
 * Returns the largest thumbnail Wikimedia exposes (we ask for ~600px).
 */

const REST_THUMB_PARAM = '?width=640';

async function fetchPageSummaryThumb(title: string, lang: 'ko' | 'en'): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // Prefer originalimage when small, else thumbnail (which is a Wikimedia thumb URL)
    const thumb: string | undefined = data?.thumbnail?.source;
    if (!thumb) return null;
    // Bump the px segment so we get a higher-res variant; if unmatched, leave as-is.
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
    const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const pages: Record<string, any> = data?.query?.pages;
    if (!pages) return null;

    // Sort by search rank (`index`) — Object.values order is not guaranteed.
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

/**
 * Resolves a representative photo for a landmark.
 * @param query Primary lookup term (Korean / Japanese / Chinese / English name)
 * @param fallbackQuery Secondary lookup term tried only if primary fails
 */
export async function fetchWikipediaPhoto(
  query: string,
  fallbackQuery?: string,
): Promise<string | null> {
  const candidates = [query, fallbackQuery].filter((q): q is string => !!q && q.trim().length > 0);
  const langs: ('ko' | 'en')[] = ['ko', 'en'];

  // Phase 1: direct page summary (highest precision, lowest cost)
  for (const term of candidates) {
    for (const lang of langs) {
      const url = await fetchPageSummaryThumb(term, lang);
      if (url) return url;
    }
  }

  // Phase 2: full-text search fallback
  for (const term of candidates) {
    for (const lang of langs) {
      const url = await searchAndPickThumb(term, lang);
      if (url) return url;
    }
  }

  return null;
}
