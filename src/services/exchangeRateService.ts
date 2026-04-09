/**
 * Exchange Rate Service
 * 優先使用 Visa 官方匯率計算機 API，失敗時 fallback 至 open.er-api.com
 */

export interface RateResult {
  KRW: number;  // 1 TWD = X KRW
  TWD: number;  // 1 KRW = X TWD（= 1/KRW）
  source: 'visa' | 'market';
  updatedAt: string;
}

/**
 * 嘗試從 Visa 匯率計算機取得 TWD→KRW 即時匯率
 */
async function fetchVisaRate(): Promise<number | null> {
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = `${mm}/${dd}/${yyyy}`;

    // Visa 公開匯率計算機 API（1 TWD → KRW）
    const url =
      `https://www.visa.com/cgi-bin/vipseg/exchangeRateByBank.do` +
      `?fromCurr=TWD&toCurr=KRW&bankFee=0&transactionDate=${dateStr}&amount=1`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;

    const data = await res.json();
    // Visa API 回傳 convertedAmount（1 TWD 等於多少 KRW）
    const rate = parseFloat(data?.convertedAmount);
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

export function convertCurrency(amount: number, fromRate: number, toRate: number) {
  return amount * (toRate / fromRate);
}
