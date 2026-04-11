import React, { useState, useEffect } from 'react';
import { ModalShell } from './ModalShell';
import { useTripStore } from '../../stores/tripStore';
import { useUIStore } from '../../stores/uiStore';
import { Calendar, MapPin } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { ImageUploader } from '../common/ImageUploader';

export const TripInfoEditModal: React.FC = () => {
  const { activeModal, closeModal, addToast } = useUIStore();
  const { trip, updateTripInfo } = useTripStore();
  
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (activeModal === 'trip-info') {
      setTitle(trip.title);
      setDestination(trip.destination);
      setCoverImage(trip.coverImage);
      setStartDate(trip.startDate);
      setEndDate(trip.endDate);
    }
  }, [activeModal, trip]);

  const handleSave = () => {
    if (!title || !startDate || !endDate) {
      addToast('請填寫必填欄位', 'error');
      return;
    }

    // Check if date range is shortened
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays < trip.days.length) {
      setShowConfirm(true);
      return;
    }

    performUpdate();
  };

  const performUpdate = () => {
    updateTripInfo({ title, destination, coverImage, startDate, endDate });
    addToast('行程資訊已更新', 'success');
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
      isOpen={activeModal === 'trip-info'}
      onClose={closeModal}
      title="編輯行程資訊"
      footer={footer}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            行程名稱 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
            placeholder="例如：首爾四天三夜 ☕"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            目的地
          </label>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
              placeholder="例如：Seoul, Korea"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            封面圖
          </label>
          <ImageUploader
            value={coverImage}
            onChange={setCoverImage}
            placeholder="https://..."
            maxDimension={1280}
            targetBytes={300 * 1024}
            previewShape="wide"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
              開始日期 *
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
              結束日期 *
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3">
          <div className="p-1 bg-orange-100 text-orange-500 rounded-lg">
            <Calendar size={16} />
          </div>
          <p className="text-xs text-orange-700 leading-relaxed">
            ⚠️ 變更日期範圍時，系統會自動新增或刪除對應的天數。若縮短日期範圍，超出的 Day 會一併被刪除。
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={performUpdate}
        title="確定要縮短日期範圍嗎？"
        message={`⚠️ 縮短日期範圍將會刪除最後 ${trip.days.length - (Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} 天的行程，此動作無法復原。`}
        isDangerous
      />
    </ModalShell>
  );
};
