import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Coins, LayoutList, Info, ChevronDown } from 'lucide-react';
import { ColorWheelPicker } from '../components/settings/ColorWheelPicker';
import {
  useSettingsStore,
  CURRENCIES,
  type CurrencyCode,
  type CardDensity,
} from '../stores/settingsStore';

// ─── Section wrapper ──────────────────────────────────────────────────
function Section({
  icon,
  title,
  subtitle,
  delay = 0,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-milk-tea-100"
    >
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-milk-tea-50">
        <div className="w-9 h-9 rounded-2xl bg-milk-tea-100 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-milk-tea-900">{title}</p>
          <p className="text-xs text-milk-tea-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Currency section ─────────────────────────────────────────────────
function CurrencySection() {
  const { travelCurrency, exchangeRates, setTravelCurrency, setExchangeRate } =
    useSettingsStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rateInput, setRateInput] = useState('');

  const current = CURRENCIES.find((c) => c.code === travelCurrency)!;
  const rate = exchangeRates[travelCurrency] ?? current.ratePerTWD;

  const handleRateBlur = () => {
    const v = parseFloat(rateInput);
    if (!isNaN(v) && v > 0) setExchangeRate(travelCurrency, v);
    setRateInput('');
  };

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Currency picker */}
      <div>
        <p className="text-xs font-semibold text-milk-tea-400 mb-2 uppercase tracking-wide">
          旅遊地貨幣
        </p>
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="w-full flex items-center justify-between bg-milk-tea-50 rounded-2xl px-4 py-3 border border-milk-tea-100 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{current.flag}</span>
            <div className="text-left">
              <p className="text-sm font-bold text-milk-tea-900">
                {current.symbol} {current.code}
              </p>
              <p className="text-xs text-milk-tea-400">{current.name}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: pickerOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-milk-tea-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-milk-tea-50 rounded-2xl border border-milk-tea-100 overflow-hidden">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setTravelCurrency(c.code as CurrencyCode);
                      setPickerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                      c.code === travelCurrency
                        ? 'bg-milk-tea-100 text-milk-tea-800'
                        : 'text-milk-tea-700 hover:bg-milk-tea-100/60'
                    }`}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-sm font-semibold">{c.symbol}</span>
                    <span className="text-sm text-milk-tea-500">{c.name}</span>
                    {c.code === travelCurrency && (
                      <span className="ml-auto text-xs font-bold text-milk-tea-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exchange rate */}
      <div>
        <p className="text-xs font-semibold text-milk-tea-400 mb-2 uppercase tracking-wide">
          匯率設定
        </p>
        <div className="bg-milk-tea-50 rounded-2xl px-4 py-3 border border-milk-tea-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-milk-tea-700">1 NT$</span>
            <span className="text-milk-tea-300">=</span>
            <input
              type="number"
              inputMode="decimal"
              value={rateInput !== '' ? rateInput : rate}
              onChange={(e) => setRateInput(e.target.value)}
              onBlur={handleRateBlur}
              className="w-24 text-sm font-bold text-milk-tea-900 bg-white border border-milk-tea-200 rounded-xl px-3 py-1.5 text-right outline-none focus:border-milk-tea-400 transition-colors"
            />
            <span className="text-sm font-bold text-milk-tea-700">
              {current.symbol} ({current.code})
            </span>
          </div>
          <p className="text-[11px] text-milk-tea-300 mt-1.5">
            1 {current.symbol} ≈{' '}
            {rate > 0 ? (1 / rate).toFixed(3) : '—'} NT$
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Card Density section ─────────────────────────────────────────────
const DENSITY_OPTIONS: { value: CardDensity; label: string; desc: string }[] = [
  { value: 'compact',     label: '緊湊',   desc: '顯示更多景點' },
  { value: 'comfortable', label: '適中',   desc: '預設顯示方式' },
  { value: 'spacious',    label: '寬鬆',   desc: '閱讀更輕鬆' },
];

function DensitySection() {
  const { cardDensity, setCardDensity } = useSettingsStore();

  return (
    <div className="px-5 py-4">
      <p className="text-xs font-semibold text-milk-tea-400 mb-3 uppercase tracking-wide">
        卡片間距
      </p>
      <div className="flex gap-2">
        {DENSITY_OPTIONS.map(({ value, label, desc }) => {
          const active = cardDensity === value;
          // Mini preview bars
          const barGap = value === 'compact' ? 'gap-0.5' : value === 'comfortable' ? 'gap-1' : 'gap-1.5';
          const barH    = value === 'compact' ? 'h-3'    : value === 'comfortable' ? 'h-4'    : 'h-5';
          return (
            <motion.button
              key={value}
              onClick={() => setCardDensity(value)}
              animate={{
                scale: active ? 1.03 : 1,
                borderColor: active ? 'var(--color-milk-tea-400)' : 'var(--color-milk-tea-100)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors ${
                active ? 'bg-milk-tea-50' : 'bg-white'
              }`}
              style={{ borderWidth: active ? 2 : 1 }}
            >
              {/* Mini card preview */}
              <div className={`w-full flex flex-col ${barGap}`}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-full ${barH} rounded-md ${
                      active ? 'bg-milk-tea-200' : 'bg-milk-tea-100'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-bold ${active ? 'text-milk-tea-600' : 'text-milk-tea-400'}`}>
                {label}
              </p>
              <p className="text-[10px] text-milk-tea-300 text-center leading-tight">{desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Settings page ───────────────────────────────────────────────
export function Settings() {
  const { themeHue, setThemeHue, travelCurrency, exchangeRates } = useSettingsStore();
  const current = CURRENCIES.find((c) => c.code === travelCurrency)!;
  const rate = exchangeRates[travelCurrency] ?? current.ratePerTWD;

  return (
    <div className="min-h-screen bg-milk-tea-50 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-milk-tea-50/90 backdrop-blur-md border-b border-milk-tea-100 px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-milk-tea-900">設定</h1>
        <p className="text-xs text-milk-tea-400 mt-0.5">個人化你的旅遊應用體驗</p>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-5">

        {/* ── 主題顏色 ─────────────────────────────────── */}
        <Section
          icon={<Palette className="w-4 h-4 text-milk-tea-600" />}
          title="主題顏色"
          subtitle="滑動色盤或點選預設配色"
          delay={0}
        >
          <div className="flex flex-col items-center py-8 px-4">
            <ColorWheelPicker hue={themeHue} onChange={setThemeHue} />
          </div>

          {/* Palette strip preview */}
          <div className="px-5 pb-5">
            <p className="text-xs font-semibold text-milk-tea-400 mb-3 uppercase tracking-wide">
              色階預覽
            </p>
            <div className="flex gap-1.5 h-7">
              {([
                [100, 92],
                [100, 87],
                [100, 83],
                [100, 78],
                [100, 71],
                [77,  62],
                [54,  50],
                [56,  39],
                [60,  26],
              ] as [number, number][]).map(([sat, lig], i) => (
                <motion.div
                  key={i}
                  animate={{ backgroundColor: `hsl(${themeHue}, ${sat}%, ${lig}%)` }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 rounded-lg"
                />
              ))}
            </div>
          </div>
        </Section>

        {/* ── 貨幣與匯率 ───────────────────────────────── */}
        <Section
          icon={<Coins className="w-4 h-4 text-milk-tea-600" />}
          title="貨幣與匯率"
          subtitle={`目前：1 NT$ = ${rate.toFixed(2)} ${current.symbol}`}
          delay={0.06}
        >
          <CurrencySection />
        </Section>

        {/* ── 行程卡片密度 ─────────────────────────────── */}
        <Section
          icon={<LayoutList className="w-4 h-4 text-milk-tea-600" />}
          title="行程卡片密度"
          subtitle="調整景點卡片的顯示間距"
          delay={0.12}
        >
          <DensitySection />
        </Section>

        {/* ── 關於 ─────────────────────────────────────── */}
        <Section
          icon={<Info className="w-4 h-4 text-milk-tea-600" />}
          title="關於"
          subtitle="應用程式資訊"
          delay={0.18}
        >
          <div className="px-5 py-4 flex flex-col gap-3">
            <Row label="版本" value="1.0.0" />
            <Row label="主題色相" value={`${themeHue}°`} />
            <Row label="旅遊貨幣" value={`${current.flag} ${current.code}`} />
          </div>
        </Section>

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
