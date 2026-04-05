import React, { useState, useEffect } from 'react';
import { ModalShell } from './ModalShell';
import { useTripStore } from '../../stores/tripStore';
import { useUIStore } from '../../stores/uiStore';
import { ConfirmDialog } from './ConfirmDialog';
import { Trash2, Calendar } from 'lucide-react';

export const DayEditModal: React.FC = () => {
  const { activeModal, editingContext, closeModal, addToast } = useUIStore();
  const { trip, updateDay, deleteDay } = useTripStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (activeModal === 'day-edit' && editingContext?.dayNumber) {
      const day = trip.days.find((d) => d.dayNumber === editingContext.dayNumber);
      if (day) {
        setTitle(day.title || '');
        setDate(day.date);
      }
    }
  }, [activeModal, editingContext, trip]);

  const handleSave = () => {
    if (!editingContext?.dayNumber) return;
    updateDay(editingContext.dayNumber, { title, date });
    addToast('Day 資訊已更新', 'success');
    closeModal();
  };

  const handleDelete = () => {
    if (!editingContext?.dayNumber) return;
    deleteDay(editingContext.dayNumber);
    addToast('Day 已刪除', 'success');
    closeModal();
  };

  const footer = (
    <div className="flex flex-col space-y-3">
      <div className="flex space-x-3">
        <button
          onClick={closeModal}
          className="flex-1 py-3 bg-white border border-milk-tea-200 text-milk-tea-500 rounded-2xl font-bold hover:bg-milk-tea-100 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 bg-milk-tea-500 text-white rounded-2xl font-bold shadow-lg shadow-milk-tea-200 hover:bg-milk-tea-600 transition-all active:scale-95"
        >
          💾 儲存
        </button>
      </div>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full py-3 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center"
      >
        <Trash2 size={18} className="mr-2" />
        刪除這一天
      </button>
    </div>
  );

  return (
    <>
      <ModalShell
        isOpen={activeModal === 'day-edit'}
        onClose={closeModal}
        title={`編輯 Day ${editingContext?.dayNumber}`}
        footer={footer}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
              Day 標題
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
              placeholder="例如：古宮巡禮 🏯"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
              日期
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </ModalShell>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="確定刪除這一天？"
        message="此動作將會刪除該日的所有行程與景點，且無法復原。"
        isDangerous
        confirmText="確定刪除"
      />
    </>
  );
};
