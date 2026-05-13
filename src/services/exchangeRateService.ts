/**
 * Exchange Rate Service
 * 透過 Cloudflare Worker 代理取得 Visa 官方即時匯率
 * Worker URL: https://visa-rate.aa85192.workers.dev
 * 失敗時 fallback 至 open.er-api.com
 */

const WORKER_URL = 'https://visa-rate.aa85192.workers.dev';

export interface RateResult {
  KRW: number;  // 1 TWD = X KRW
  TWD: number;  // 1 KRW = X TWD（= 1/KRW）
  source: 'visa' | 'market';
  updatedAt: string;
}

/**
 * 透過 Cloudflare Worker 取得 Visa 即時匯率（1 TWD → KRW）
 */
async function fetchVisaRate(): Promise<number | null> {
  try {
    const res = await fetch(`${WORKER_URL}?from=TWD&to=KRW`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = parseFloat(data?.rate);
    if (!isNaN(rate) && rate > 0) return rate;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback：從 open.er-api.com 取得市場匯率（接近 Visa 基準匯率）
 */
async function fetchMarketRate(): Promise<number | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/TWD', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.KRW;
    if (rate && rate > 0) return rate;
    return null;
  } catch {
    return null;
  }
}

/**
 * 取得 TWD ↔ KRW 匯率
 * 優先 Visa，fallback 市場匯率
 */
export async function fetchKrwTwdRate(): Promise<RateResult | null> {
  // 1. 嘗試 Visa
  const visaRate = await fetchVisaRate();
  if (visaRate) {
    return {
      KRW: visaRate,
      TWD: 1 / visaRate,
      source: 'visa',
      updatedAt: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // 2. Fallback 市場匯率
  const marketRate = await fetchMarketRate();
  if (marketRate) {
    return {
      KRW: marketRate,
      TWD: 1 / marketRate,
      source: 'market',
      updatedAt: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  return null;
}

/** 舊介面保留（供其他地方使用） */
export async function fetchExchangeRates(baseCurrency: string = 'TWD') {
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch exchange rates');
    const data = await response.json();
    return data.rates;
  } catch {
    return null;
  }
}

/**
 * 從 Visa 取得 1 TWD → 1 <toCurr> 的官方匯率。
 * 走 Cloudflare Worker 代理（Worker 內部會嘗試 Visa，失敗 fallback 市場匯率）。
 * 回傳 { rate, source }，失敗回 null。
 */
export async function fetchVisaRateFor(
  toCurr: string,
): Promise<{ rate: number; source: 'visa' | 'market' } | null> {
  try {
    const res = await fetch(
      `${WORKER_URL}?from=TWD&to=${encodeURIComponent(toCurr.toUpperCase())}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = parseFloat(data?.rate);
    if (!isNaN(rate) && rate > 0) {
      const source = data?.source === 'visa' ? 'visa' : 'market';
      return { rate, source };
    }
    return null;
  } catch {
    return null;
  }
}

export function convertCurrency(amount: number, fromRate: number, toRate: number) {
  return amount * (toRate / fromRate);
}
