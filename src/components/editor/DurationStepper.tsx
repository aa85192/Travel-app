import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface DurationStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const DurationStepper: React.FC<DurationStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 1440, // 24 hours
  step = 15,
}) => {
  const increment = () => {
    if (value + step <= max) onChange(value + step);
  };

  const decrement = () => {
    if (value - step >= min) onChange(value - step);
  };

  return (
    <div className="flex items-center space-x-4 bg-white border border-milk-tea-200 rounded-xl p-2 w-fit">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="p-1.5 rounded-lg bg-milk-tea-100 text-milk-tea-500 hover:bg-milk-tea-200 disabled:opacity-50 transition-colors"
      >
        <Minus size={16} />
      </button>
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-lg font-bold text-milk-tea-800 font-mono">
          {value}
        </span>
        <span className="text-[10px] text-milk-tea-400 font-medium uppercase tracking-wider">
          分鐘
        </span>
      </div>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="p-1.5 rounded-lg bg-milk-tea-100 text-milk-tea-500 hover:bg-milk-tea-200 disabled:opacity-50 transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
