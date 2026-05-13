import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Coins, LayoutList, Info, ChevronDown, Sun, Moon, Monitor, LogOut, RefreshCw } from 'lucide-react';
import { ColorWheelPicker } from '../components/settings/ColorWheelPicker';
import { logout } from '../components/PasswordGate';
import { fetchVisaRateFor } from '../services/exchangeRateService';
import { useUIStore } from '../stores/uiStore';
import {
  useSettingsStore,
  CURRENCIES,
  type CurrencyCode,
  type CardDensity,
  type ThemeMode,
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
  const { addToast } = useUIStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [rateSource, setRateSource] = useState<'visa' | 'market' | 'manual' | null>(null);

  const current = CURRENCIES.find((c) => c.code === travelCurrency)!;
  const rate = exchangeRates[travelCurrency] ?? current.ratePerTWD;

  const handleRateBlur = () => {
    const v = parseFloat(rateInput);
    if (!isNaN(v) && v > 0) {
      setExchangeRate(travelCurrency, v);
      setRateSource('manual');
    }
    setRateInput('');
  };

  const handleFetchVisa = async () => {
    if (fetching) return;
    setFetching(true);
    const result = await fetchVisaRateFor(travelCurrency);
    setFetching(false);
    if (!result) {
      addToast('匯率取得失敗，請稍後再試', 'error');
      return;
    }
    setExchangeRate(travelCurrency, result.rate);
    setRateInput('');
    setRateSource(result.source);
    addToast(
      result.source === 'visa'
        ? `已更新為 Visa 官方匯率`
        : `Visa 暫時無法取得，已使用市場匯率`,
      result.source === 'visa' ? 'success' : 'warning',
    );
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
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-milk-tea-400 uppercase tracking-wide">
            匯率設定
          </p>
          <button
            onClick={handleFetchVisa}
            disabled={fetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-milk-tea-500 text-white text-xs font-bold shadow-sm hover:bg-milk-tea-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
          >
            <RefreshCw className={`w-3 h-3 ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? '取得中…' : '從 Visa 取得'}
          </button>
        </div>
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
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-milk-tea-300">
              1 {current.symbol} ≈{' '}
              {rate > 0 ? (1 / rate).toFixed(3) : '—'} NT$
            </p>
            {rateSource && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                rateSource === 'visa'
                  ? 'bg-milk-tea-200 text-milk-tea-700'
                  : rateSource === 'market'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-milk-tea-100 text-milk-tea-500'
              }`}>
                {rateSource === 'visa' ? 'Visa 官方' : rateSource === 'market' ? '市場匯率' : '手動輸入'}
              </span>
            )}
          </div>
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

// ─── Live theme preview ───────────────────────────────────────────────
// Shows what real UI will look like at the chosen hue, so users can verify
// readability and overall feel before committing — the same idea as Apple's
// wallpaper / accent preview in iOS Settings.
function ThemePreview({ hue }: { hue: number }) {
  return (
    <div className="px-5 pb-5">
      <p className="text-xs font-semibold text-milk-tea-400 mb-3 uppercase tracking-wide">
        即時預覽
      </p>
      <motion.div
        layout
        animate={{
          backgroundColor: `oklch(0.985 0.005 ${hue})`,
          borderColor:     `oklch(0.930 0.026 ${hue})`,
        }}
        transition={{ duration: 0.18 }}
        className="rounded-2xl border p-4 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <motion.h3
            animate={{ color: `oklch(0.220 0.055 ${hue})` }}
            transition={{ duration: 0.18 }}
            className="text-base font-bold"
          >
            東京小旅行
          </motion.h3>
          <motion.span
            animate={{
              backgroundColor: `oklch(0.965 0.013 ${hue})`,
              color:           `oklch(0.440 0.130 ${hue})`,
            }}
            transition={{ duration: 0.18 }}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          >
            3 天
          </motion.span>
        </div>
        <motion.p
          animate={{ color: `oklch(0.440 0.130 ${hue})` }}
          transition={{ duration: 0.18 }}
          className="text-xs leading-relaxed"
        >
          這是一段示範文字。無論主色相為何，內文都應保持清晰可讀。
        </motion.p>
        <div className="flex items-center gap-2 pt-1">
          <motion.button
            animate={{ backgroundColor: `oklch(0.640 0.165 ${hue})` }}
            transition={{ duration: 0.18 }}
            className="flex-1 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
          >
            繼續編輯
          </motion.button>
          <motion.button
            animate={{
              backgroundColor: `oklch(0.965 0.013 ${hue})`,
              color:           `oklch(0.330 0.090 ${hue})`,
              borderColor:     `oklch(0.930 0.026 ${hue})`,
            }}
            transition={{ duration: 0.18 }}
            className="flex-1 py-2 rounded-xl text-xs font-bold border"
          >
            分享
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Theme mode (light / dark / auto) ─────────────────────────────────
const MODE_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: '亮色', icon: <Sun className="w-4 h-4" /> },
  { value: 'dark',  label: '暗色', icon: <Moon className="w-4 h-4" /> },
  { value: 'auto',  label: '跟隨系統', icon: <Monitor className="w-4 h-4" /> },
];

function ThemeModeSection() {
  const { themeMode, setThemeMode } = useSettingsStore();
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-semibold text-milk-tea-400 mb-3 uppercase tracking-wide">
        亮 / 暗模式
      </p>
      <div className="flex gap-2">
        {MODE_OPTIONS.map(({ value, label, icon }) => {
          const active = themeMode === value;
          return (
            <motion.button
              key={value}
              onClick={() => setThemeMode(value)}
              animate={{ scale: active ? 1.03 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-colors ${
                active
                  ? 'bg-milk-tea-50 border-milk-tea-400 text-milk-tea-700'
                  : 'bg-white border-milk-tea-100 text-milk-tea-400'
              }`}
              style={{ borderWidth: active ? 2 : 1 }}
            >
              {icon}
              <span className="text-xs font-bold">{label}</span>
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
    <div className="bg-milk-tea-50 pb-8">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-milk-tea-50/90 backdrop-blur-md border-b border-milk-tea-100 px-5 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3rem)' }}
      >
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

          {/* Live preview — real UI elements at the chosen hue */}
          <ThemePreview hue={themeHue} />

          {/* Tonal palette strip — mirrors the OKLCH curve used app‑wide */}
          <div className="px-5 pb-5">
            <p className="text-xs font-semibold text-milk-tea-400 mb-3 uppercase tracking-wide">
              色階預覽
            </p>
            <div className="flex gap-1 h-7">
              {([
                [0.965, 0.013],
                [0.930, 0.026],
                [0.870, 0.050],
                [0.770, 0.100],
                [0.640, 0.165],
                [0.540, 0.160],
                [0.440, 0.130],
                [0.330, 0.090],
                [0.220, 0.055],
              ] as [number, number][]).map(([l, c], i) => (
                <motion.div
                  key={i}
                  animate={{ backgroundColor: `oklch(${l} ${c} ${themeHue})` }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 rounded-md"
                />
              ))}
            </div>
          </div>

          <ThemeModeSection />
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

        {/* ── 帳號 ─────────────────────────────────────── */}
        <Section
          icon={<LogOut className="w-4 h-4 text-milk-tea-600" />}
          title="帳號"
          subtitle="登出目前的帳號"
          delay={0.24}
        >
          <div className="px-5 py-4">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-milk-tea-100 text-milk-tea-700 font-bold text-sm hover:bg-milk-tea-200 transition-all active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              登出
            </button>
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
