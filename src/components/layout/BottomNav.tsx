import React from 'react';
import { motion } from 'motion/react';
import { BearHome, BearItinerary, BearMap, BearBudget, BearTodo, BearSettings } from '../settings/BearIcons';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'home',      Bear: BearHome,      label: '首頁' },
  { id: 'itinerary', Bear: BearItinerary, label: '行程' },
  { id: 'todo',      Bear: BearTodo,      label: '待辦' },
  { id: 'map',       Bear: BearMap,       label: '地圖' },
  { id: 'budget',    Bear: BearBudget,    label: '預算' },
  { id: 'settings',  Bear: BearSettings,  label: '設定' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-milk-tea-100 px-1 py-2 flex justify-around items-end z-50 pb-safe">
      {TABS.map(({ id, Bear, label }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-2xl transition-all"
          >
            <motion.div
              animate={{
                scale: active ? 1.18 : 1,
                y: active ? -3 : 0,
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className={`transition-colors duration-200 ${active ? 'text-milk-tea-500' : 'text-milk-tea-300'}`}
            >
              <Bear size={26} />
            </motion.div>

            <motion.span
              animate={{ opacity: active ? 1 : 0.55 }}
              className={`text-[10px] font-bold leading-none transition-colors duration-200 ${
                active ? 'text-milk-tea-500' : 'text-milk-tea-300'
              }`}
            >
              {label}
            </motion.span>

            {/* Active dot indicator */}
            {active && (
              <motion.span
                layoutId="nav-dot"
                className="w-1 h-1 rounded-full bg-milk-tea-400 mt-0.5"
              />
            )}
            {!active && <span className="w-1 h-1 mt-0.5" />}
          </button>
        );
      })}
    </nav>
  );
};
