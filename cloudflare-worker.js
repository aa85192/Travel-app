/**
 * Cloudflare Worker: Visa Exchange Rate Proxy
 * 部署到 Cloudflare Workers 後，會作為 CORS-friendly 的 Visa 匯率代理
 *
 * 使用方式：GET /rate?from=TWD&to=KRW
 * 回傳：{ from, to, rate, source, date }
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // 快取 1 小時
      ...extra,
    },
  });
}

function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

async function fetchVisaRate(fromCurr, toCurr) {
  const date = todayStr();
  const url =
    `https://www.visa.com/cgi-bin/vipseg/exchangeRateByBank.do` +
    `?fromCurr=${fromCurr}&toCurr=${toCurr}&bankFee=0` +
    `&transactionDate=${encodeURIComponent(date)}&amount=1`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/html, */*',
      'Referer': 'https://www.visa.com/cgi-bin/vipseg/exchangeRateCalculator.do',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) throw new Error(`Visa HTTP ${res.status}`);

  const ct = res.headers.get('content-type') || '';

  // JSON 回應
  if (ct.includes('application/json')) {
    const data = await res.json();
    const rate = parseFloat(data?.convertedAmount ?? data?.exchangeRate);
    if (!isNaN(rate) && rate > 0) return rate;
    throw new Error('JSON: no convertedAmount field');
  }

  // HTML 回應 → 用 regex 抓數字
  const html = await res.text();
  const patterns = [
    /convertedAmount['":\s]+([0-9]+\.?[0-9]*)/i,
    /exchangeRate['":\s]+([0-9]+\.?[0-9]*)/i,
    /class="converted[^"]*"[^>]*>\s*([0-9]+\.?[0-9]*)/i,
    /id="converted[^"]*"[^>]*>\s*([0-9]+\.?[0-9]*)/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) {
      const v = parseFloat(m[1]);
      if (!isNaN(v) && v > 0) return v;
    }
  }

  throw new Error('HTML: could not parse rate');
}

async function fetchFallbackRate(fromCurr, toCurr) {
  // Fallback: open.er-api.com
  const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurr}`);
  if (!res.ok) throw new Error('Fallback API failed');
  const data = await res.json();
  const rate = data?.rates?.[toCurr];
  if (!rate) throw new Error('Fallback: currency not found');
  return rate;
}

export default {
  async fetch(request) {
    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const from = (url.searchParams.get('from') || 'TWD').toUpperCase();
    const to   = (url.searchParams.get('to')   || 'KRW').toUpperCase();

    // 嘗試 Visa → Fallback
    try {
      const rate = await fetchVisaRate(from, to);
      return jsonResponse({ from, to, rate, source: 'visa', date: todayStr() });
    } catch (visaErr) {
      try {
        const rate = await fetchFallbackRate(from, to);
        return jsonResponse({ from, to, rate, source: 'market', date: todayStr() });
      } catch (fallbackErr) {
        return jsonResponse(
          { error: `visa: ${visaErr.message} | fallback: ${fallbackErr.message}` },
          500,
        );
      }
    }
  },
};
