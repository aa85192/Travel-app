/**
 * Weather Service - Open-Meteo（免費、無需 API key、CORS 友好）
 * 預設座標：首爾市中心
 */

const SEOUL = { lat: 37.5665, lng: 126.9780 };

export interface DayWeather {
  date: string;     // YYYY-MM-DD
  code: number;     // WMO weather code
  tempMax: number;  // °C
  tempMin: number;  // °C
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/**
 * 取得指定日期範圍的天氣，自動前後各延伸 2 天以提供上下文
 */
export async function fetchWeatherRange(
  startDate: string,
  endDate: string,
  lat = SEOUL.lat,
  lng = SEOUL.lng,
): Promise<DayWeather[]> {
  const from = addDays(startDate, -2);
  const to   = addDays(endDate,    2);

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude',   String(lat));
    url.searchParams.set('longitude',  String(lng));
    url.searchParams.set('daily',      'weather_code,temperature_2m_max,temperature_2m_min');
    url.searchParams.set('timezone',   'Asia/Seoul');
    url.searchParams.set('start_date', from);
    url.searchParams.set('end_date',   to);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];

    const data = await res.json();
    const { time, weather_code, temperature_2m_max, temperature_2m_min } = data.daily;

    return (time as string[]).map((date, i) => ({
      date,
      code:    weather_code[i] as number,
      tempMax: Math.round(temperature_2m_max[i] as number),
      tempMin: Math.round(temperature_2m_min[i] as number),
    }));
  } catch {
    return [];
  }
}

/** WMO weather code → 可愛 emoji */
export function weatherEmoji(code: number): string {
  if (code === 0)            return '☀️';
  if (code <= 1)             return '🌤️';
  if (code <= 2)             return '⛅';
  if (code === 3)            return '☁️';
  if (code <= 48)            return '🌫️';
  if (code <= 55)            return '🌦️';
  if (code <= 65)            return '🌧️';
  if (code <= 77)            return '❄️';
  if (code <= 82)            return '🌦️';
  if (code <= 86)            return '🌨️';
  return '⛈️';
}

/** WMO weather code → 中文描述 */
export function weatherLabel(code: number): string {
  if (code === 0)   return '晴天';
  if (code <= 2)    return '晴時多雲';
  if (code === 3)   return '多雲';
  if (code <= 48)   return '有霧';
  if (code <= 55)   return '毛毛雨';
  if (code <= 65)   return '下雨';
  if (code <= 77)   return '下雪';
  if (code <= 82)   return '陣雨';
  if (code <= 86)   return '陣雪';
  return '雷雨';
}

/** 取得相對日期標籤 */
export function relativeDateLabel(date: string, anchor: string): string {
  const diff = Math.round(
    (new Date(date).getTime() - new Date(anchor).getTime()) / 86400000
  );
  const labels: Record<number, string> = {
    '-2': '前天', '-1': '昨天', '0': '今天', '1': '明天', '2': '後天',
  };
  return labels[String(diff)] ?? `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`;
}
