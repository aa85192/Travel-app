/**
 * Cloudflare Worker: Travel App Backend
 * ─────────────────────────────────────
 * 功能：
 *   1. GET  /?from=TWD&to=KRW       → Visa 匯率代理
 *   2. POST /sync                    → 儲存行程 { code, data }
 *   3. GET  /sync/:code              → 載入行程
 *
 * KV 設定（需在 Cloudflare 後台完成）：
 *   Workers & Pages → visa-rate → Settings → Bindings
 *   新增 KV Namespace，Variable name = TRIPS
 *   先到 Workers & Pages → KV 建立一個名為 travel-trips 的 namespace
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', ...extra },
  });
}

// ── 匯率：Visa 代理 ──────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
}

async function fetchVisaRate(from, to) {
  const url =
    `https://www.visa.com/cgi-bin/vipseg/exchangeRateByBank.do` +
    `?fromCurr=${from}&toCurr=${to}&bankFee=0` +
    `&transactionDate=${encodeURIComponent(todayStr())}&amount=1`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/html, */*',
      'Referer': 'https://www.visa.com/cgi-bin/vipseg/exchangeRateCalculator.do',
    },
  });
  if (!res.ok) throw new Error(`Visa HTTP ${res.status}`);

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const d = await res.json();
    const rate = parseFloat(d?.convertedAmount ?? d?.exchangeRate);
    if (!isNaN(rate) && rate > 0) return rate;
    throw new Error('no rate field');
  }

  const html = await res.text();
  for (const p of [
    /convertedAmount['": ]+([0-9]+\.?[0-9]*)/i,
    /exchangeRate['": ]+([0-9]+\.?[0-9]*)/i,
  ]) {
    const m = html.match(p);
    if (m) { const v = parseFloat(m[1]); if (v > 0) return v; }
  }
  throw new Error('parse failed');
}

async function fetchFallbackRate(from, to) {
  const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
  if (!res.ok) throw new Error('fallback failed');
  const d = await res.json();
  const rate = d?.rates?.[to];
  if (!rate) throw new Error('currency not found');
  return rate;
}

// ── Uber 票價估算 ──────────────────────────────────────────────────
// token 快取於 module 層（同一 isolate 有效，重啟後自動重取）
let _uberToken = null;
let _uberTokenExpiry = 0;

async function getUberToken(env) {
  if (_uberToken && Date.now() < _uberTokenExpiry) return _uberToken;

  const res = await fetch('https://auth.uber.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     env.UBER_CLIENT_ID,
      client_secret: env.UBER_CLIENT_SECRET,
      grant_type:    'client_credentials',
      scope:         'ride_request.estimate',  // Uber 官方 client_credentials scope for price/time estimates
    }).toString(),
  });
  if (!res.ok) throw new Error(`Uber auth ${res.status}: ${await res.text()}`);

  const data = await res.json();
  _uberToken        = data.access_token;
  _uberTokenExpiry  = Date.now() + ((data.expires_in ?? 2592000) - 300) * 1000;
  return _uberToken;
}



export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url  = new URL(request.url);
    const path = url.pathname;

    // POST /sync → 儲存行程
    if (request.method === 'POST' && path === '/sync') {
      if (!env.TRIPS) return json({ error: 'KV not bound. See worker setup instructions.' }, 503);
      try {
        const body = await request.json();
        const { code, data } = body;
        if (!code || !data) return json({ error: 'Missing code or data' }, 400);
        // KV TTL: 90 天（秒）
        await env.TRIPS.put(code.toUpperCase(), JSON.stringify(data), { expirationTtl: 7776000 });
        return json({ ok: true, code: code.toUpperCase() });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    // GET /sync/:code → 載入行程
    const syncMatch = path.match(/^\/sync\/([A-Z0-9]{4,10})$/i);
    if (request.method === 'GET' && syncMatch) {
      if (!env.TRIPS) return json({ error: 'KV not bound.' }, 503);
      const code = syncMatch[1].toUpperCase();
      const raw  = await env.TRIPS.get(code);
      if (!raw) return json({ error: 'Trip not found or expired' }, 404);
      return json({ ok: true, code, data: JSON.parse(raw) }, 200, {
        'Cache-Control': 'no-store',
      });
    }

    // GET /uber/estimate → Uber 即時票價估算
    if (path === '/uber/estimate') {
      const startLat = url.searchParams.get('startLat');
      const startLng = url.searchParams.get('startLng');
      const endLat   = url.searchParams.get('endLat');
      const endLng   = url.searchParams.get('endLng');

      if (!startLat || !startLng || !endLat || !endLng) {
        return json({ error: 'Missing coordinates' }, 400);
      }
      if (!env.UBER_CLIENT_ID || !env.UBER_CLIENT_SECRET) {
        return json({ error: 'UBER_CLIENT_ID / UBER_CLIENT_SECRET not configured' }, 503);
      }

      try {
        const token = await getUberToken(env);
        const priceUrl =
          `https://api.uber.com/v1.2/estimates/price` +
          `?start_latitude=${startLat}&start_longitude=${startLng}` +
          `&end_latitude=${endLat}&end_longitude=${endLng}`;

        const priceRes = await fetch(priceUrl, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(6000),
        });
        if (!priceRes.ok) {
          const errText = await priceRes.text();
          return json({ error: `Uber API ${priceRes.status}`, detail: errText }, priceRes.status);
        }

        const data   = await priceRes.json();
        const prices = data?.prices ?? [];
        if (!prices.length) return json({ error: 'No Uber products available' }, 404);

        // 選擇最便宜的車型（適用全球：美國 UberX、韓國 UT/Uber Taxi 等）
        // null 低估價排最後（metered 計程表 / surge 浮動等無固定區間的情況）
        const sorted = [...prices].sort((a, b) =>
          (a.low_estimate ?? Number.POSITIVE_INFINITY) -
          (b.low_estimate ?? Number.POSITIVE_INFINITY)
        );
        const best = sorted[0];

        return json({
          displayName:  best.display_name,
          lowEstimate:  best.low_estimate,   // 本地貨幣 (number or null)
          highEstimate: best.high_estimate,  // 本地貨幣 (number or null)
          estimate:     best.estimate,       // 格式化字串，如 "₩5,000-₩7,000" 或 "Metered"
          currencyCode: best.currency_code,
          duration:     best.duration,       // 秒（trip duration）
          distance:     best.distance,       // 英里
          allProducts:  prices.map(p => ({
            displayName:  p.display_name,
            estimate:     p.estimate,
            lowEstimate:  p.low_estimate,
            highEstimate: p.high_estimate,
          })),
        }, 200, { 'Cache-Control': 'public, max-age=300' });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    // GET /kakao/directions → Kakao Mobility 路線代理
    if (path === '/kakao/directions') {
      const start    = url.searchParams.get('start');   // "lng,lat"
      const goal     = url.searchParams.get('goal');    // "lng,lat"
      const priority = url.searchParams.get('priority') || 'RECOMMEND';

      if (!start || !goal) return json({ error: 'Missing start or goal' }, 400);
      if (!env.KAKAO_REST_API_KEY) return json({ error: 'KAKAO_REST_API_KEY not configured' }, 503);

      const kakaoUrl =
        `https://apis-navi.kakaomobility.com/v1/directions` +
        `?start=${encodeURIComponent(start)}&goal=${encodeURIComponent(goal)}` +
        `&priority=${priority}`;

      try {
        const kakaoRes = await fetch(kakaoUrl, {
          headers: {
            Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (!kakaoRes.ok) {
          const errText = await kakaoRes.text();
          return json({ error: `Kakao API error: ${kakaoRes.status}`, detail: errText }, kakaoRes.status);
        }
        const data = await kakaoRes.json();
        return json(data, 200);
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    // GET / → 匯率
    const from = (url.searchParams.get('from') || 'TWD').toUpperCase();
    const to   = (url.searchParams.get('to')   || 'KRW').toUpperCase();

    try {
      const rate = await fetchVisaRate(from, to);
      return json({ from, to, rate, source: 'visa',   date: todayStr() }, 200, { 'Cache-Control': 'public, max-age=3600' });
    } catch {
      try {
        const rate = await fetchFallbackRate(from, to);
        return json({ from, to, rate, source: 'market', date: todayStr() }, 200, { 'Cache-Control': 'public, max-age=3600' });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }
  },
};
