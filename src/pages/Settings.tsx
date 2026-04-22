import React from 'react';
import { motion } from 'motion/react';
import { Palette, Info } from 'lucide-react';
import { ColorWheelPicker } from '../components/settings/ColorWheelPicker';
import { useSettingsStore } from '../stores/settingsStore';

export function Settings() {
  const { themeHue, setThemeHue } = useSettingsStore();

  return (
    <div className="min-h-screen bg-milk-tea-50 pb-28">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-milk-tea-50/90 backdrop-blur-md border-b border-milk-tea-100 px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-milk-tea-900">設定</h1>
        <p className="text-xs text-milk-tea-400 mt-0.5">個人化你的旅遊應用體驗</p>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-6">
        {/* ── Theme colour section ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm border border-milk-tea-100"
        >
          {/* Section header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-milk-tea-50">
            <div className="w-9 h-9 rounded-2xl bg-milk-tea-100 flex items-center justify-center">
              <Palette className="w-4 h-4 text-milk-tea-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-milk-tea-900">主題顏色</p>
              <p className="text-xs text-milk-tea-400">滑動色盤或點選預設配色</p>
            </div>
          </div>

          {/* Colour wheel */}
          <div className="flex flex-col items-center py-8 px-4">
            <ColorWheelPicker hue={themeHue} onChange={setThemeHue} />
          </div>

          {/* Live preview strip */}
          <div className="px-5 pb-5">
            <p className="text-xs font-semibold text-milk-tea-400 mb-3 uppercase tracking-wide">預覽</p>
            <div className="flex gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <motion.div
                  key={shade}
                  animate={{ backgroundColor: `hsl(${themeHue}, ${shade <= 400 ? 100 : shade === 500 ? 100 : shade === 600 ? 77 : 56}%, ${
                    shade === 50  ? 98 :
                    shade === 100 ? 92 :
                    shade === 200 ? 87 :
                    shade === 300 ? 83 :
                    shade === 400 ? 78 :
                    shade === 500 ? 71 :
                    shade === 600 ? 62 :
                    shade === 700 ? 50 :
                    shade === 800 ? 39 : 26
                  }%)` }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 rounded-lg"
                  style={{ height: 28 }}
                  title={`${shade}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 px-0.5">
              <span className="text-[9px] text-milk-tea-300">50</span>
              <span className="text-[9px] text-milk-tea-300">900</span>
            </div>
          </div>
        </motion.div>

        {/* ── About section ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm border border-milk-tea-100"
        >
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-milk-tea-50">
            <div className="w-9 h-9 rounded-2xl bg-milk-tea-100 flex items-center justify-center">
              <Info className="w-4 h-4 text-milk-tea-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-milk-tea-900">關於</p>
              <p className="text-xs text-milk-tea-400">應用程式資訊</p>
            </div>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            <Row label="版本" value="1.0.0" />
            <Row label="主題色相" value={`${themeHue}°`} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-milk-tea-500">{label}</span>
      <span className="text-sm font-semibold text-milk-tea-800">{value}</span>
    </div>
  );
}
