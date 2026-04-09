/**
 * Gemini AI 景點搜尋服務
 * 使用 @google/genai SDK（更穩定）
 */

import { GoogleGenAI } from '@google/genai';

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

export async function searchSpotsWithGemini(query: string): Promise<GeminiSpotResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 未設定，請確認 GitHub Secrets 有加入此變數');
  }

  const ai = new GoogleGenAI({ apiKey });

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

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const text = response.text?.trim() ?? '';
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
