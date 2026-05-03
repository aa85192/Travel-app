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
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

// ── Google Drive：OAuth + 照片上傳代理 ────────────────────────────
// 設定流程：
//   1. 一次性開 GET /oauth/setup 完成授權，把回傳的 refresh_token
//      存成 Secret 變數 GOOGLE_REFRESH_TOKEN
//   2. POST   /photo            → 上傳照片到「Travel App」資料夾，回傳 fileId
//   3. GET    /photo/:fileId    → 代理下載（瀏覽器可以直接 <img src=...>）
//   4. DELETE /photo/:fileId    → 從 Drive 移除

const DRIVE_FOLDER_NAME = 'Travel App';
const DRIVE_SCOPE       = 'https://www.googleapis.com/auth/drive.file';

let _googleAccessToken = null;
let _googleAccessExpiry = 0;

async function getGoogleAccessToken(env) {
  if (_googleAccessToken && Date.now() < _googleAccessExpiry) return _googleAccessToken;
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured');
  }
  if (!env.GOOGLE_REFRESH_TOKEN) {
    throw new Error('GOOGLE_REFRESH_TOKEN not set — visit /oauth/setup once');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh ${res.status}: ${await res.text()}`);
  const data = await res.json();
  _googleAccessToken  = data.access_token;
  _googleAccessExpiry = Date.now() + ((data.expires_in ?? 3600) - 300) * 1000;
  return _googleAccessToken;
}

async function getDriveFolderId(env, accessToken) {
  if (env.TRIPS) {
    const cached = await env.TRIPS.get('drive:folder-id');
    if (cached) return cached;
  }
  const q = encodeURIComponent(
    `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const sres = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&spaces=drive`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!sres.ok) throw new Error(`Drive search ${sres.status}: ${await sres.text()}`);
  const sdata = await sres.json();
  let folderId = sdata.files?.[0]?.id;
  if (!folderId) {
    const cres = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    if (!cres.ok) throw new Error(`Drive folder create ${cres.status}: ${await cres.text()}`);
    folderId = (await cres.json()).id;
  }
  if (env.TRIPS) await env.TRIPS.put('drive:folder-id', folderId);
  return folderId;
}

async function uploadToDrive(env, accessToken, folderId, bytes, mimeType, name) {
  const boundary = '----TravelAppBoundary' + Math.random().toString(36).slice(2);
  const enc = new TextEncoder();
  const preamble = enc.encode(
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ name, parents: [folderId] }) + `\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`,
  );
  const closing = enc.encode(`\r\n--${boundary}--\r\n`);
  const body = new Uint8Array(preamble.length + bytes.byteLength + closing.length);
  body.set(preamble, 0);
  body.set(new Uint8Array(bytes), preamble.length);
  body.set(closing, preamble.length + bytes.byteLength);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!res.ok) throw new Error(`Drive upload ${res.status}: ${await res.text()}`);
  return await res.json();
}

function htmlPage(title, bodyInner) {
  return new Response(
    `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${title}</title></head>` +
    `<body style="font-family:-apple-system,system-ui,sans-serif;padding:24px;` +
    `background:#FFF8FA;color:#6B1A3C;line-height:1.6;">` +
    bodyInner +
    `</body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=UTF-8' } },
  );
}


export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url  = new URL(request.url);
    const path = url.pathname;

    // ── Google Drive OAuth bootstrap ──────────────────────────────
    // GET /oauth/setup → 顯示「用 Google 登入」按鈕
    if (request.method === 'GET' && path === '/oauth/setup') {
      if (!env.GOOGLE_CLIENT_ID) {
        return htmlPage('未設定', '<h2>❌ GOOGLE_CLIENT_ID 未設定</h2><p>請先到 Cloudflare Worker → Settings → Variables 加上 GOOGLE_CLIENT_ID 與 GOOGLE_CLIENT_SECRET。</p>');
      }
      const params = new URLSearchParams({
        client_id:     env.GOOGLE_CLIENT_ID,
        redirect_uri:  `${url.origin}/oauth/callback`,
        response_type: 'code',
        scope:         DRIVE_SCOPE,
        access_type:   'offline',
        prompt:        'consent',
      });
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      return htmlPage(
        '連結 Google Drive',
        `<h2 style="margin-top:0">🌸 連結 Google Drive</h2>
         <p>點下方按鈕登入 Google 並授權。</p>
         <a href="${authUrl}"
            style="display:inline-block;padding:14px 28px;background:#FF6FA3;
                   color:white;border-radius:14px;text-decoration:none;
                   font-weight:bold;font-size:16px;">用 Google 登入</a>`,
      );
    }

    // GET /oauth/callback → 換 refresh_token 並顯示
    if (request.method === 'GET' && path === '/oauth/callback') {
      const code  = url.searchParams.get('code');
      const oerr  = url.searchParams.get('error');
      if (oerr)   return htmlPage('錯誤', `<h2>OAuth 錯誤：${oerr}</h2>`);
      if (!code)  return htmlPage('錯誤', '<h2>缺少 authorization code</h2>');
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id:     env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri:  `${url.origin}/oauth/callback`,
            grant_type:    'authorization_code',
          }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.refresh_token) {
          return htmlPage(
            '失敗',
            `<h2>❌ 沒拿到 refresh_token</h2><pre style="background:#FED7DD;padding:12px;border-radius:8px;overflow:auto;">${JSON.stringify(tokenData, null, 2)}</pre>`,
          );
        }
        const rt = String(tokenData.refresh_token).replace(
          /[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]),
        );
        return htmlPage(
          '✅ 完成',
          `<h2 style="margin-top:0">✅ 授權完成</h2>
           <p>把下方 token 貼到 Cloudflare Worker → Variables，名稱
           <code style="background:#FED7DD;padding:2px 6px;border-radius:4px;">GOOGLE_REFRESH_TOKEN</code>，記得勾 Encrypt。</p>
           <textarea readonly id="rt"
             style="width:100%;padding:12px;border:1px solid #FFBFCA;
                    border-radius:12px;font-family:monospace;font-size:14px;
                    height:140px;background:white;color:#2D2030">${rt}</textarea>
           <button onclick="navigator.clipboard.writeText(document.getElementById('rt').value).then(()=>this.textContent='已複製 ✓')"
             style="margin-top:12px;padding:10px 20px;background:#FF6FA3;
                    color:white;border:none;border-radius:12px;
                    font-weight:bold;font-size:14px;">一鍵複製</button>
           <p style="margin-top:24px;color:#888;font-size:13px">
             ⚠️ 這個 token 只會顯示這一次，關掉就沒了。複製貼到 Cloudflare 後可以關閉。
           </p>`,
        );
      } catch (e) {
        return htmlPage('錯誤', `<pre>${String(e)}</pre>`);
      }
    }

    // ── Google Drive 照片代理 ─────────────────────────────────────
    // POST /photo  (body: image bytes)
    if (request.method === 'POST' && path === '/photo') {
      try {
        const accessToken = await getGoogleAccessToken(env);
        const folderId    = await getDriveFolderId(env, accessToken);
        const mimeType    = request.headers.get('Content-Type') || 'image/webp';
        const bytes       = await request.arrayBuffer();
        if (bytes.byteLength === 0) return json({ error: 'Empty body' }, 400);
        const ext  = (mimeType.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '');
        const name = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const file = await uploadToDrive(env, accessToken, folderId, bytes, mimeType, name);
        return json({ id: file.id, name: file.name, mimeType: file.mimeType });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    // GET /photo/:id  → 代理 Drive 下載
    const photoMatch = path.match(/^\/photo\/([\w-]+)$/);
    if (request.method === 'GET' && photoMatch) {
      try {
        const accessToken = await getGoogleAccessToken(env);
        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${photoMatch[1]}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!driveRes.ok) {
          return json({ error: `Drive ${driveRes.status}`, detail: await driveRes.text() }, driveRes.status);
        }
        return new Response(driveRes.body, {
          headers: {
            ...CORS,
            'Content-Type':  driveRes.headers.get('Content-Type') || 'application/octet-stream',
            'Cache-Control': 'public, max-age=86400, immutable',
          },
        });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    // DELETE /photo/:id
    if (request.method === 'DELETE' && photoMatch) {
      try {
        const accessToken = await getGoogleAccessToken(env);
        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${photoMatch[1]}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!driveRes.ok && driveRes.status !== 404) {
          return json({ error: `Drive delete ${driveRes.status}`, detail: await driveRes.text() }, driveRes.status);
        }
        return json({ ok: true });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

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

    // GET /kakao/search?query=... → Kakao Local Search by keyword
    if (path === '/kakao/search') {
      const query = url.searchParams.get('query');
      if (!query) return json({ error: 'Missing query' }, 400);
      if (!env.KAKAO_REST_API_KEY) return json({ error: 'KAKAO_REST_API_KEY not configured' }, 503);
      try {
        const kakaoUrl =
          `https://dapi.kakao.com/v2/local/search/keyword.json` +
          `?query=${encodeURIComponent(query)}&size=10`;
        const kRes = await fetch(kakaoUrl, {
          headers: {
            Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}`,
          },
        });
        if (!kRes.ok) {
          const errText = await kRes.text();
          return json({ error: `Kakao API ${kRes.status}`, detail: errText }, kRes.status);
        }
        const data = await kRes.json();
        return json(data, 200, { 'Cache-Control': 'public, max-age=300' });
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
