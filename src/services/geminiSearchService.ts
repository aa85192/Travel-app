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

/** 從 Gemini 錯誤訊息中解析建議的等待秒數（毫秒） */
function parseRetryDelayMs(message: string): number {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) {
    const seconds = parseFloat(match[1]);
    // Cap at 30 seconds to keep UX reasonable
    return Math.min(Math.ceil(seconds) * 1000, 30_000);
  }
  return 5_000; // default 5s fallback
}

function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource_exhausted') ||
    lower.includes('retry in')
  );
}

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

  let lastErrorMessage = '';

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
      lastErrorMessage = message;

      if (isRateLimitError(message) && attempt < MAX_RETRIES) {
        const delayMs = parseRetryDelayMs(message);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      if (isRateLimitError(message)) {
        throw new Error('AI 搜尋配額暫時用完，請稍後再試');
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

  // All retries exhausted
  if (isRateLimitError(lastErrorMessage)) {
    throw new Error('AI 搜尋配額暫時用完，請稍後再試');
  }
  throw new Error(lastErrorMessage || 'AI 搜尋失敗，請稍後再試');
}
