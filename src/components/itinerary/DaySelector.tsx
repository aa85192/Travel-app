import React from 'react';
import { motion } from 'motion/react';

interface DaySelectorProps {
  totalDays: number;
  currentDay: number;
  onSelectDay: (day: number) => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({ totalDays, currentDay, onSelectDay }) => {
  return (
    <div className="flex overflow-x-auto no-scrollbar space-x-2 py-4 px-4 bg-milk-tea-50 sticky top-0 z-10">
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
        <button
          key={day}
          onClick={() => onSelectDay(day)}
          className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-bold transition-all ${
            currentDay === day
              ? 'bg-milk-tea-500 text-white shadow-md'
              : 'bg-milk-tea-100 text-milk-tea-500 hover:bg-milk-tea-200'
          }`}
        >
          Day {day}
        </button>
      ))}
    </div>
  );
};
