/**
 * Gemini AI 景點搜尋服務
 * 使用 REST API fetch（瀏覽器相容）
 */

export interface GeminiSpotResult {
  nameKo: string;
  nameZh: string;
  nameEn?: string;
  description: string;
  lat: number;
  lng: number;
  address?: string;
  category?: 'attraction' | 'restaurant' | 'cafe' | 'shopping' | 'hotel' | 'activity' | 'other';
}

/**
 * 429 TooManyRequests — 配額/速率耗盡，不重試（重試只會再產生更多 429）
 * 503 ServiceUnavailable — 伺服器暫時過載，值得重試
 */
function isQuotaExceeded(status: number, message: string): boolean {
  if (status === 429) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource_exhausted') ||
    lower.includes('too many requests')
  );
}

function isTransientError(status: number, message: string): boolean {
  if (status === 503) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes('high demand') ||
    lower.includes('try again later') ||
    lower.includes('overloaded') ||
    lower.includes('service unavailable') ||
    lower.includes('temporarily')
  );
}

/** 從 Gemini 錯誤訊息中解析建議的等待秒數（毫秒），無則用指數退避 */
function retryDelayMs(attempt: number, message: string): number {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) {
    return Math.min(Math.ceil(parseFloat(match[1])) * 1000, 30_000);
  }
  return Math.min(5_000 * Math.pow(2, attempt), 30_000);
}

// 只對 503 等暫時性錯誤重試，最多 2 次
const MAX_RETRIES = 2;

export async function searchSpotsWithGemini(query: string): Promise<GeminiSpotResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 未設定，請確認 GitHub Secrets 有加入此變數');
  }

  const prompt = `你是韓國旅遊助手。用戶輸入："${query}"

找出最符合的韓國景點或店家（最多3個）。
回傳 JSON 陣列，每個物件包含：
- nameKo: 正確韓文名稱（供 Naver Map 搜尋）
- nameZh: 繁體中文名稱
- nameEn: 英文名稱（可選）
- description: 繁體中文 1-2 句簡介（幫助確認是否正確）
- lat: 緯度（精確到小數第 4 位）
- lng: 經度（精確到小數第 4 位）
- address: 韓文地址（可選）
- category: attraction/restaurant/cafe/shopping/hotel/activity/other 其一

只回傳 JSON 陣列，不含任何 markdown 或其他文字。`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message: string = err?.error?.message ?? `HTTP ${res.status}`;

      // 429：配額耗盡，重試沒用，立即告知使用者
      if (isQuotaExceeded(res.status, message)) {
        throw new Error('AI 搜尋配額已用完，請明天再試或改用 Naver Map 搜尋');
      }

      // 503 等暫時性錯誤：退避後重試
      if (isTransientError(res.status, message) && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, retryDelayMs(attempt, message)));
        continue;
      }

      // 503 重試耗盡
      if (isTransientError(res.status, message)) {
        throw new Error('AI 服務目前繁忙，請稍後再試');
      }

      throw new Error(message);
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!text) throw new Error('Gemini 回傳空內容');

    // 清除 markdown code block
    const clean = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      throw new Error(`JSON 解析失敗：${clean.slice(0, 100)}`);
    }

    if (!Array.isArray(parsed)) throw new Error('回傳格式不是陣列');
    return parsed.slice(0, 3) as GeminiSpotResult[];
  }

  throw new Error('AI 服務目前繁忙，請稍後再試');
}
