/**
 * Wikipedia Photo Service
 * 用景點名稱從 Wikipedia API 自動取得代表照片（免費、免 API key）
 * 優先查韓文維基（對韓國景點最準），備援英文維基
 */

async function searchWikiPhoto(query: string, lang: 'ko' | 'en'): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrlimit: '3',
      prop: 'pageimages',
      pithumbsize: '600',
      format: 'json',
      origin: '*',
    });

    const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    const pages: Record<string, any> = data?.query?.pages;
    if (!pages) return null;

    for (const page of Object.values(pages)) {
      if (page.thumbnail?.source) {
        // 換成較大尺寸
        return page.thumbnail.source.replace(/\/\d+px-/, '/600px-');
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 依景點名稱取得 Wikipedia 代表圖片 URL
 * @param query 景點名稱（韓文或中英文皆可）
 * @param fallbackQuery 備用搜尋詞（如中文名或英文名）
 */
export async function fetchWikipediaPhoto(
  query: string,
  fallbackQuery?: string
): Promise<string | null> {
  // 1. 韓文維基 + 原始查詢
  const koResult = await searchWikiPhoto(query, 'ko');
  if (koResult) return koResult;

  // 2. 英文維基 + 原始查詢
  const enResult = await searchWikiPhoto(query, 'en');
  if (enResult) return enResult;

  // 3. 若有備用查詢詞，再試一次英文維基
  if (fallbackQuery && fallbackQuery !== query) {
    return searchWikiPhoto(fallbackQuery, 'en');
  }

  return null;
}
