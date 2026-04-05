/**
 * 解析 Naver Map 連結，回傳 { name, lat, lng, address } 或 null
 */
export async function parseNaverMapLink(url: string) {
  // Layer 1: 短連結 → 用 CORS proxy 展開
  if (url.includes('naver.me')) {
    try {
      const expanded = await expandShortUrl(url);
      return parseFullUrl(expanded);
    } catch (err) {
      // 展開失敗 → 落到 Layer 3
      return { error: 'SHORT_URL_EXPAND_FAILED', url };
    }
  }

  // Layer 2: 完整 URL → regex 解析
  if (url.includes('map.naver.com')) {
    return parseFullUrl(url);
  }

  return { error: 'UNSUPPORTED_URL' };
}

/**
 * 從完整 URL 抽取座標與名稱
 */
function parseFullUrl(url: string) {
  const result: { name: string | null; lat: number | null; lng: number | null; address: string | null } = {
    name: null,
    lat: null,
    lng: null,
    address: null,
  };

  // 抽 lat/lng（query string 或 path 中）
  const latMatch = url.match(/[?&]lat=(-?\d+\.?\d*)/);
  const lngMatch = url.match(/[?&]lng=(-?\d+\.?\d*)/);
  if (latMatch) result.lat = parseFloat(latMatch[1]);
  if (lngMatch) result.lng = parseFloat(lngMatch[1]);

  // 備援：抽 c= 參數（地圖中心點格式如 c=126.977,37.5796,15,0,0,0,dh）
  if (!result.lat) {
    const cMatch = url.match(/[?&]c=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
    if (cMatch) {
      result.lng = parseFloat(cMatch[1]);
      result.lat = parseFloat(cMatch[2]);
    }
  }

  // 抽名稱（從 /search/ 後面 或 placePath）
  const searchMatch = url.match(/\/search\/([^/?]+)/);
  if (searchMatch) {
    result.name = decodeURIComponent(searchMatch[1]);
  }

  const placePathMatch = url.match(/placePath=([^&]+)/);
  if (placePathMatch) {
    const decoded = decodeURIComponent(placePathMatch[1]);
    // placePath 通常是 /home 或包含名稱，視情況提取
    if (decoded.includes('/home')) {
      // Try to extract name from URL if possible
    }
  }

  return result.lat && result.lng ? result : { error: 'NO_COORDINATES' };
}

/**
 * 使用公開的 CORS proxy 展開短連結
 */
async function expandShortUrl(shortUrl: string) {
  // Using allorigins.win as a proxy to expand the short URL
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(shortUrl)}`;
  const res = await fetch(proxyUrl);
  const data = await res.json();
  
  // The expanded URL is often in the response headers or the content itself if redirected
  // For naver.me, it usually redirects to a map.naver.com URL
  // This is a simplified version; real expansion might need more complex handling
  if (data.contents && data.contents.includes('window.location.replace')) {
    const match = data.contents.match(/window\.location\.replace\("([^"]+)"\)/);
    if (match) return match[1];
  }
  
  return data.url || shortUrl;
}
