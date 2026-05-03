/**
 * Gemini AI 景點搜尋服務
 * 使用 REST API fetch（瀏覽器相容）
 */

export interface GeminiSpotResult {
  nameKo: string;
  nameZh: string;
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

  // Grounded search: 接 Google Search 抓真實結果，避免 model 用陳舊記憶
  const prompt =
    `找與「${query}」最相關的 1-5 個真實韓國地點（含地鐵站、景點、餐廳、咖啡廳、商店）。\n` +
    `規則：\n` +
    `1. 若 query 本身就是某個地點（例：「南浦車站」=「남포역」），第一筆必須是它本身\n` +
    `2. 其餘按相關 / 鄰近度排序\n` +
    `3. 只回純 JSON 陣列，不要任何說明、不要 markdown 圍欄\n` +
    `格式：[{"k":"韓文官方名","z":"繁中名"}]`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            thinkingConfig: { thinkingBudget: 0 },
            temperature: 0.2,
          },
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
    // grounded responses can split JSON across multiple parts — concat them all
    const parts: any[] = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p?.text ?? '').join('').trim();
    if (!text) throw new Error('Gemini 回傳空內容');

    // grounded responses sometimes wrap JSON in prose / markdown — pull out
    // the first top-level array literal.
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    const candidate = arrayMatch
      ? arrayMatch[0]
      : text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      throw new Error(`JSON 解析失敗：${candidate.slice(0, 120)}`);
    }

    if (!Array.isArray(parsed)) throw new Error('回傳格式不是陣列');
    // 支援壓縮格式 {k, z} 和完整格式 {nameKo, nameZh}
    return parsed.slice(0, 5).map((item: any) => ({
      nameKo: item.k ?? item.nameKo ?? '',
      nameZh: item.z ?? item.nameZh ?? '',
    })) as GeminiSpotResult[];
  }

  throw new Error('AI 服務目前繁忙，請稍後再試');
}
