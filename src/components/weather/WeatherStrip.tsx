import React from 'react';
import { motion } from 'motion/react';
import { DayWeather, weatherEmoji, weatherLabel, relativeDateLabel } from '../../services/weatherService';

interface WeatherStripProps {
  weather: DayWeather[];
  currentDate: string;   // YYYY-MM-DD
  loading?: boolean;
}

// 每種天氣的主題色（背景/文字）
function weatherTheme(code: number): { bg: string; border: string } {
  if (code === 0)  return { bg: '#FFF7CC', border: '#FFE4A0' };  // 晴：奶油黃
  if (code <= 2)   return { bg: '#FFF7CC', border: '#FFE4A0' };  // 晴時多雲：奶油黃
  if (code <= 3)   return { bg: '#E8ECFF', border: '#AAB6FB' };  // 多雲：薰衣草
  if (code <= 48)  return { bg: '#F0F0F0', border: '#C8C8C8' };  // 霧：灰
  if (code <= 65)  return { bg: '#D4F5EF', border: '#99F2E6' };  // 雨：薄荷
  if (code <= 77)  return { bg: '#E8ECFF', border: '#C5B8FF' };  // 雪：淡紫
  if (code <= 86)  return { bg: '#D4F5EF', border: '#99F2E6' };  // 陣雨/雪
  return { bg: '#EDE8FF', border: '#9B8FF5' };                    // 雷雨：紫
}

export const WeatherStrip: React.FC<WeatherStripProps> = ({ weather, currentDate, loading }) => {
  if (loading) {
    return (
      <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 h-20 bg-milk-tea-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!weather.length) {
    // 計算距離最近可預報日期還有幾天（Open-Meteo 最多 16 天）
    const today = new Date();
    const tripDate = new Date(currentDate);
    const daysUntil = Math.ceil((tripDate.getTime() - today.getTime()) / 86400000);
    const daysUntilForecast = daysUntil - 16;

    return (
      <div className="flex items-center space-x-2 bg-white/60 border border-milk-tea-100 rounded-2xl px-4 py-2.5">
        <span className="text-lg">🔭</span>
        <div>
          <p className="text-[10px] font-bold text-milk-tea-500">
            {daysUntilForecast > 0
              ? `天氣預報將於 ${daysUntilForecast} 天後開放`
              : '天氣資料載入中，請稍候'}
          </p>
          <p className="text-[9px] text-milk-tea-300">Open-Meteo 提供最近 16 天預報</p>
        </div>
      </div>
    );
  }

  // 找到 currentDate 的 index，前後各取 2 天
  const currentIdx = weather.findIndex(w => w.date === currentDate);
  if (currentIdx === -1) return null;

  const start = Math.max(0, currentIdx - 2);
  const end   = Math.min(weather.length - 1, currentIdx + 2);
  const visible = weather.slice(start, end + 1);

  return (
    <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
      {visible.map((day, i) => {
        const isCurrent = day.date === currentDate;
        const theme = weatherTheme(day.code);
        const label = relativeDateLabel(day.date, currentDate);

        return (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-2xl min-w-[64px] relative"
            style={{
              backgroundColor: isCurrent ? theme.bg : '#FFFFFF99',
              border: `1.5px solid ${isCurrent ? theme.border : '#F0E8E2'}`,
              boxShadow: isCurrent ? `0 2px 8px ${theme.border}66` : undefined,
            }}
          >
            {/* 今天標籤 */}
            {isCurrent && (
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wide"
                style={{ backgroundColor: theme.border, color: '#fff' }}
              >
                今天
              </div>
            )}

            {/* 相對日期 */}
            <span className={`text-[9px] font-bold mb-1 ${isCurrent ? 'text-milk-tea-600' : 'text-milk-tea-300'}`}>
              {isCurrent ? label : label}
            </span>

            {/* 天氣 emoji */}
            <span className="text-[28px] leading-none select-none">
              {weatherEmoji(day.code)}
            </span>

            {/* 溫度 */}
            <div className="mt-1.5 flex flex-col items-center">
              <span className="text-[10px] font-black text-milk-tea-700">
                {day.tempMax}°
              </span>
              <span className="text-[9px] text-milk-tea-300 font-bold">
                {day.tempMin}°
              </span>
            </div>

            {/* 天氣描述 */}
            <span className="text-[8px] text-milk-tea-400 mt-0.5 text-center leading-tight">
              {weatherLabel(day.code)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
