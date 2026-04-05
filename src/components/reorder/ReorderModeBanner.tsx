import React from 'react';
import { motion } from 'motion/react';
import { Check, GripVertical } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const ReorderModeBanner: React.FC = () => {
  const { reorderMode, setReorderMode } = useUIStore();

  if (!reorderMode) return null;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      className="fixed top-0 left-0 right-0 z-[40] bg-milk-tea-700 text-white px-6 py-4 flex items-center justify-between shadow-xl"
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white/20 rounded-xl animate-pulse">
          <GripVertical size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold font-display">
            {reorderMode === 'spots' ? '🔀 景點排序模式' : '📅 天數排序模式'}
          </h4>
          <p className="text-[10px] text-white/70 font-medium">
            長按卡片並拖動以調整順序
          </p>
        </div>
      </div>
      <button
        onClick={() => setReorderMode(null)}
        className="px-6 py-2 bg-white text-milk-tea-700 rounded-full text-sm font-bold shadow-lg hover:bg-milk-tea-50 transition-all active:scale-95 flex items-center"
      >
        <Check size={18} className="mr-2" />
        完成
      </button>
    </motion.div>
  );
};
