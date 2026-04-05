import React, { useState, useEffect } from 'react';
import { ModalShell } from './ModalShell';
import { SpotFormFields } from './SpotFormFields';
import { useTripStore } from '../../stores/tripStore';
import { useUIStore } from '../../stores/uiStore';
import { Spot } from '../../types';

export const SpotEditModal: React.FC = () => {
  const { activeModal, editingContext, closeModal, addToast } = useUIStore();
  const { trip, updateSpot } = useTripStore();
  const [formData, setFormData] = useState<Partial<Spot>>({});

  useEffect(() => {
    if (activeModal === 'spot-edit' && editingContext?.spotId) {
      const day = trip.days.find((d) => d.dayNumber === editingContext.dayNumber);
      const spot = day?.spots.find((s) => s.id === editingContext.spotId);
      if (spot) setFormData(spot);
    }
  }, [activeModal, editingContext, trip]);

  const handleSave = () => {
    if (!editingContext?.spotId || !editingContext?.dayNumber) return;
    
    if (!formData.name || !formData.lat || !formData.lng) {
      addToast('請填寫必填欄位', 'error');
      return;
    }

    updateSpot(editingContext.dayNumber, editingContext.spotId, formData);
    addToast('景點已更新', 'success');
    closeModal();
  };

  const footer = (
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
  );

  return (
    <ModalShell
      isOpen={activeModal === 'spot-edit'}
      onClose={closeModal}
      title="編輯景點"
      footer={footer}
    >
      <SpotFormFields formData={formData} setFormData={setFormData} />
    </ModalShell>
  );
};
