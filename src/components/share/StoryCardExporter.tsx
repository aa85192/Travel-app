import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share2, X, Loader2 } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { useTripStore } from '../../stores/tripStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { StoryCard } from './StoryCard';

interface StoryCardExporterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoryCardExporter: React.FC<StoryCardExporterProps> = ({ isOpen, onClose }) => {
  const trip = useTripStore((s) => s.trip);
  const themeHue = useSettingsStore((s) => s.themeHue);
  const addToast = useUIStore((s) => s.addToast);
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const renderToPng = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const dataUrl = await domToPng(cardRef.current, {
      width: 1080,
      height: 1920,
      scale: 1,
      backgroundColor: '#FFF8FA',
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await renderToPng();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trip.title}-story.png`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('✅ 已下載 Story 卡片', 'success');
    } catch (e) {
      console.error('[story export]', e);
      addToast('產生卡片失敗', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await renderToPng();
      if (!blob) return;
      const file = new File([blob], `${trip.title}-story.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: trip.title });
      } else {
        await handleDownload();
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('[story share]', e);
        addToast('分享失敗', 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative w-full sm:max-w-md bg-milk-tea-50 rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-milk-tea-900 font-display">分享旅程</h3>
              <button onClick={onClose} className="p-1 text-milk-tea-400 hover:text-milk-tea-600">
                <X size={20} />
              </button>
            </div>

            {/* Off-screen full-size card for rasterization */}
            <div
              style={{
                position: 'fixed',
                left: -10000,
                top: 0,
                pointerEvents: 'none',
                opacity: 0,
              }}
              aria-hidden
            >
              <StoryCard ref={cardRef} trip={trip} themeHue={themeHue} />
            </div>

            {/* Preview (scaled down via wrapper width) */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div
                className="rounded-2xl overflow-hidden shadow-xl border border-milk-tea-200"
                style={{ width: 270, height: 480 }}
              >
                <div
                  style={{
                    width: 1080,
                    height: 1920,
                    transform: 'scale(0.25)',
                    transformOrigin: 'top left',
                  }}
                >
                  <StoryCard trip={trip} themeHue={themeHue} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleShare}
                disabled={busy}
                className="flex-1 py-3 bg-milk-tea-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                <span>分享</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={busy}
                className="flex-1 py-3 bg-white border border-milk-tea-200 text-milk-tea-700 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
              >
                <Download size={18} />
                <span>下載 PNG</span>
              </button>
            </div>
            <p className="text-[10px] text-milk-tea-400 text-center mt-3">
              1080 × 1920 · 適合 IG 限動 / Threads
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
