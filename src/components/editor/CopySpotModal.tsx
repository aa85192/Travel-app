import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Check, Copy } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useTripStore } from '../../stores/tripStore';

export const CopySpotModal: React.FC = () => {
  const { activeModal, editingContext, closeModal, addToast } = useUIStore();
  const { trip, duplicateSpot } = useTripStore();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  if (activeModal !== 'spot-copy' || !editingContext) return null;

  const { spotId, dayNumber: sourceDay } = editingContext;
  const spot = trip.days.find(d => d.dayNumber === sourceDay)?.spots.find(s => s.id === spotId);

  if (!spot) return null;

  const handleToggleDay = (dayNum: number) => {
    if (dayNum === sourceDay) return;
    setSelectedDays(prev => 
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleCopy = () => {
    if (selectedDays.length === 0) return;
    
    selectedDays.forEach(targetDay => {
      duplicateSpot(spotId!, sourceDay, targetDay);
    });
    
    addToast(`已複製景點到 ${selectedDays.length} 天行程中`, 'success');
    closeModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-milk-tea-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-milk-tea-50 flex items-center justify-between bg-milk-tea-50/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-milk-tea-500 text-white rounded-xl shadow-lg shadow-milk-tea-100">
                <Copy size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-milk-tea-900 font-display">複製景點</h3>
                <p className="text-xs text-milk-tea-400 font-medium truncate max-w-[200px]">
                  {spot.name}
                </p>
              </div>
            </div>
            <button 
              onClick={closeModal}
              className="p-2 hover:bg-milk-tea-100 rounded-full text-milk-tea-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <p className="text-sm font-bold text-milk-tea-900 mb-4">選擇要複製到的天數：</p>
            <div className="grid grid-cols-1 gap-3">
              {trip.days.map((day) => {
                const isSource = day.dayNumber === sourceDay;
                const isSelected = selectedDays.includes(day.dayNumber);
                
                return (
                  <button
                    key={day.dayNumber}
                    disabled={isSource}
                    onClick={() => handleToggleDay(day.dayNumber)}
                    className={`p-4 rounded-3xl border-2 transition-all flex items-center justify-between ${
                      isSource 
                        ? 'border-milk-tea-50 bg-milk-tea-50/50 opacity-60 cursor-not-allowed' 
                        : isSelected
                          ? 'border-milk-tea-500 bg-milk-tea-50 shadow-md shadow-milk-tea-100'
                          : 'border-milk-tea-100 hover:border-milk-tea-300'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        isSelected ? 'bg-milk-tea-500 text-white' : 'bg-milk-tea-100 text-milk-tea-600'
                      }`}>
                        {day.dayNumber}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-milk-tea-900">
                          Day {day.dayNumber} {isSource && <span className="text-[10px] text-milk-tea-400 ml-1">(目前位置)</span>}
                        </div>
                        <div className="text-xs text-milk-tea-400 flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {day.date}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-milk-tea-500 text-white rounded-full flex items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-milk-tea-50/30 border-t border-milk-tea-50">
            <button
              onClick={handleCopy}
              disabled={selectedDays.length === 0}
              className={`w-full py-4 rounded-3xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] ${
                selectedDays.length > 0
                  ? 'bg-milk-tea-500 text-white hover:bg-milk-tea-600 shadow-milk-tea-100'
                  : 'bg-milk-tea-200 text-white cursor-not-allowed'
              }`}
            >
              確認複製 ({selectedDays.length})
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
