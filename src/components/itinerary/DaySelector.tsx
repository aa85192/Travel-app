import React from 'react';
import { motion } from 'motion/react';

interface DaySelectorProps {
  totalDays: number;
  currentDay: number;
  onSelectDay: (day: number) => void;
}

// 馬卡龍色循環：粉→薰衣草→薄荷→琥珀→桃→紫
const MACARON_ACTIVE = [
  { bg: '#FF6FA3', text: '#fff' },
  { bg: '#8896F5', text: '#fff' },
  { bg: '#3DBDAD', text: '#fff' },
  { bg: '#E8A830', text: '#fff' },
  { bg: '#E87DAA', text: '#fff' },
  { bg: '#9B8FF5', text: '#fff' },
];

export const DaySelector: React.FC<DaySelectorProps> = ({ totalDays, currentDay, onSelectDay }) => {
  return (
    <div className="flex overflow-x-auto no-scrollbar space-x-2 py-4 px-4 bg-milk-tea-50 sticky top-0 z-10">
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
        const color = MACARON_ACTIVE[(day - 1) % MACARON_ACTIVE.length];
        return (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            style={currentDay === day ? { backgroundColor: color.bg, color: color.text } : {}}
            className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-bold transition-all ${
              currentDay === day
                ? 'shadow-md'
                : 'bg-milk-tea-100 text-milk-tea-500 hover:bg-milk-tea-200'
            }`}
          >
            Day {day}
          </button>
        );
      })}
    </div>
  );
};
