/**
 * Gemini AI 景點搜尋服務
 * 輸入中文描述 → 回傳最多 3 個韓國景點（韓文名 + 繁中簡介 + 座標）
 */

const API_KEY = process.env.GEMINI_API_KEY;

export interface GeminiSpotResult {
  nameKo: string;      // 韓文名（供 Naver Map 搜尋）
  nameZh: string;      // 繁體中文名
  nameEn?: string;     // 英文名
  description: string; // 繁中簡介（確認用）
  lat: number;
  lng: number;
  address?: string;
  category?: 'attraction' | 'restaurant' | 'cafe' | 'shopping' | 'hotel' | 'activity' | 'other';
}

export async function searchSpotsWithGemini(query: string): Promise<GeminiSpotResult[]> {
  if (!API_KEY) throw new Error('GEMINI_API_KEY 未設定');

  const prompt = `你是韓國旅遊助手。用戶輸入："${query}"

找出最符合的韓國景點或店家（最多3個）。
回傳 JSON 陣列，每個物件包含：
- nameKo: 正確韓文名稱（供 Naver Map 搜尋）
- nameZh: 繁體中文名稱
- nameEn: 英文名稱（可選）
- description: 繁體中文 1-2 句簡介（幫助確認是否為正確地點）
- lat: 緯度（精確到小數第 4 位）
- lng: 經度（精確到小數第 4 位）
- address: 韓文地址（可選）
- category: attraction/restaurant/cafe/shopping/hotel/activity/other 其一

只回傳 JSON 陣列，不要任何其他文字或 markdown。`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(12000),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // 清除可能的 markdown code block
  const clean = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(clean);
  return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
}
