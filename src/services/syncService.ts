/**
 * Cloud Sync Service
 * 透過 Cloudflare Worker + KV 儲存/載入行程資料
 * Worker URL: https://visa-rate.aa85192.workers.dev
 */

const WORKER_URL = 'https://visa-rate.aa85192.workers.dev';
const CODE_KEY = 'travel-sync-code';

/** 產生 6 碼大寫英數代碼（排除易混淆字元） */
export function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** 取得或建立本機同步代碼 */
export function getOrCreateSyncCode(): string {
  let code = localStorage.getItem(CODE_KEY);
  if (!code) {
    code = generateSyncCode();
    localStorage.setItem(CODE_KEY, code);
  }
  return code;
}

/** 儲存行程到雲端，回傳代碼（成功）或 null（失敗） */
export async function saveTrip(tripData: object): Promise<string | null> {
  const code = getOrCreateSyncCode();
  try {
    const res = await fetch(`${WORKER_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, data: tripData }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return code;
  } catch {
    return null;
  }
}

/** 從雲端載入行程，回傳 trip 資料或 null */
export async function loadTrip(code: string): Promise<object | null> {
  try {
    const res = await fetch(`${WORKER_URL}/sync/${code.toUpperCase().trim()}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.data ?? null;
  } catch {
    return null;
  }
}
