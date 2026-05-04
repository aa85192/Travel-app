import React, { useState, useEffect, useRef } from 'react';
import { ModalShell } from './ModalShell';
import { CoverCropper } from './CoverCropper';
import { useTripStore } from '../../stores/tripStore';
import { useUIStore } from '../../stores/uiStore';
import { Calendar, MapPin, Upload, Link as LinkIcon } from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { savePhoto } from '../../services/photoStore';

const WORKER_URL = 'https://visa-rate.aa85192.workers.dev';

type Step = 'form' | 'crop';

export const TripInfoEditModal: React.FC = () => {
  const { activeModal, closeModal, addToast } = useUIStore();
  const { trip, updateTripInfo } = useTripStore();

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal === 'trip-info') {
      setTitle(trip.title);
      setDestination(trip.destination);
      setCoverImage(trip.coverImage);
      setStartDate(trip.startDate);
      setEndDate(trip.endDate);
      setStep('form');
      setCropSrc(null);
      setShowUrlInput(false);
    }
  }, [activeModal, trip]);

  const handleSave = () => {
    if (!title || !startDate || !endDate) {
      addToast('請填寫必填欄位', 'error');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86400000) + 1;
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

  // ── file pick ─────────────────────────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCropSrc(ev.target.result as string);
        setStep('crop');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── after crop confirmed ──────────────────────────────────────────────────
  const handleCropConfirm = async (blob: Blob) => {
    setStep('form');
    setCropSrc(null);
    setIsUploading(true);
    try {
      const id = await savePhoto(blob);
      const url = `${WORKER_URL}/photo/${encodeURIComponent(id)}`;
      setCoverImage(url);
      addToast('✅ 封面圖已上傳', 'success');
    } catch (e: any) {
      addToast(`封面圖上傳失敗：${e?.message ?? '未知錯誤'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const footer = step === 'form' ? (
    <div className="flex space-x-3">
      <button onClick={closeModal}
        className="flex-1 py-3 bg-white border border-milk-tea-200 text-milk-tea-500 rounded-2xl font-bold hover:bg-milk-tea-100 transition-colors">
        取消
      </button>
      <button onClick={handleSave}
        className="flex-1 py-3 bg-milk-tea-500 text-white rounded-2xl font-bold shadow-lg shadow-milk-tea-200 hover:bg-milk-tea-600 transition-all active:scale-95">
        💾 儲存
      </button>
    </div>
  ) : null;

  return (
    <ModalShell isOpen={activeModal === 'trip-info'} onClose={closeModal} title="編輯行程資訊" footer={footer}>
      {step === 'crop' && cropSrc ? (
        <CoverCropper
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => { setStep('form'); setCropSrc(null); }}
        />
      ) : (
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">行程名稱 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
              placeholder="例如：首爾五天四夜 ☕" />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">目的地</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
                placeholder="例如：Seoul, Korea" />
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-2 ml-1">封面圖</label>

            {/* Current preview */}
            {coverImage && (
              <div className="w-full h-28 rounded-2xl overflow-hidden border border-milk-tea-200 mb-3 bg-milk-tea-100">
                <img src={coverImage} alt="封面預覽" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-milk-tea-50 border-2 border-dashed border-milk-tea-300 rounded-xl text-sm font-bold text-milk-tea-500 hover:bg-milk-tea-100 hover:border-milk-tea-400 transition-all disabled:opacity-50"
            >
              <Upload size={16} />
              {isUploading ? '上傳中…' : coverImage ? '重新上傳封面' : '上傳封面圖'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />

            {/* URL fallback toggle */}
            <button
              onClick={() => setShowUrlInput((v) => !v)}
              className="mt-2 flex items-center gap-1.5 text-xs text-milk-tea-400 hover:text-milk-tea-600 transition-colors"
            >
              <LinkIcon size={12} />
              {showUrlInput ? '隱藏' : '或貼上圖片網址'}
            </button>
            {showUrlInput && (
              <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
                className="mt-2 w-full px-4 py-2.5 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
                placeholder="https://..." />
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">開始日期 *</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">結束日期 *</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3">
            <div className="p-1 bg-orange-100 text-orange-500 rounded-lg flex-shrink-0">
              <Calendar size={16} />
            </div>
            <p className="text-xs text-orange-700 leading-relaxed">
              ⚠️ 變更日期範圍時，系統會自動新增或刪除對應的天數。若縮短日期範圍，超出的 Day 會一併被刪除。
            </p>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={performUpdate}
        title="確定要縮短日期範圍嗎？"
        message={`⚠️ 縮短日期範圍將會刪除最後 ${trip.days.length - (Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)} 天的行程，此動作無法復原。`}
        variant="danger"
      />
    </ModalShell>
  );
};
