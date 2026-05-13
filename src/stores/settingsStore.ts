import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Tonal palette generator inspired by Material You (HCT) and Apple's Tinted
 * theme. Uses OKLCH so perceived lightness stays uniform across all hues —
 * yellow no longer becomes blinding, green no longer becomes muddy, and the
 * dark text tones keep a consistent contrast ratio against the surfaces.
 *
 * Chroma curve:
 *   • 50–200 surfaces carry only a whisper of hue (0.005–0.025) — backgrounds
 *     stay near‑neutral regardless of hue, like Apple's systemBackground.
 *   • 400–600 accents carry full chroma (0.10–0.165) — buttons & highlights
 *     stay vivid and recognizably "themed".
 *   • 700–900 text tones taper chroma back down (0.13 → 0.055) so labels read
 *     as near‑black with a hint of theme tint (≥7:1 contrast on tone 50).
 */
export function generateMilkTeaPalette(
  hue: number,
  mode: 'light' | 'dark' = 'light',
): Record<string, string> {
  if (mode === 'dark') {
    return {
      '--color-milk-tea-50':  `oklch(0.180 0.012 ${hue})`,
      '--color-milk-tea-100': `oklch(0.230 0.022 ${hue})`,
      '--color-milk-tea-200': `oklch(0.300 0.040 ${hue})`,
      '--color-milk-tea-300': `oklch(0.420 0.065 ${hue})`,
      '--color-milk-tea-400': `oklch(0.580 0.100 ${hue})`,
      '--color-milk-tea-500': `oklch(0.720 0.140 ${hue})`,
      '--color-milk-tea-600': `oklch(0.800 0.130 ${hue})`,
      '--color-milk-tea-700': `oklch(0.870 0.090 ${hue})`,
      '--color-milk-tea-800': `oklch(0.930 0.050 ${hue})`,
      '--color-milk-tea-900': `oklch(0.970 0.020 ${hue})`,
    };
  }
  return {
    '--color-milk-tea-50':  `oklch(0.985 0.005 ${hue})`,
    '--color-milk-tea-100': `oklch(0.965 0.013 ${hue})`,
    '--color-milk-tea-200': `oklch(0.930 0.026 ${hue})`,
    '--color-milk-tea-300': `oklch(0.870 0.050 ${hue})`,
    '--color-milk-tea-400': `oklch(0.770 0.100 ${hue})`,
    '--color-milk-tea-500': `oklch(0.640 0.165 ${hue})`,
    '--color-milk-tea-600': `oklch(0.540 0.160 ${hue})`,
    '--color-milk-tea-700': `oklch(0.440 0.130 ${hue})`,
    '--color-milk-tea-800': `oklch(0.330 0.090 ${hue})`,
    '--color-milk-tea-900': `oklch(0.220 0.055 ${hue})`,
  };
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
}

export function applyTheme(hue: number, mode: ThemeMode): void {
  const root = document.documentElement;
  const resolved = resolveMode(mode);
  root.dataset.theme = resolved;
  for (const [key, value] of Object.entries(generateMilkTeaPalette(hue, resolved))) {
    root.style.setProperty(key, value);
  }
}

/** Backwards-compat wrapper. Always uses current themeMode from store. */
export function applyThemePalette(hue: number): void {
  const mode = useSettingsStore.getState().themeMode;
  applyTheme(hue, mode);
}

export const CURRENCIES = [
  { code: 'KRW', symbol: '₩',   name: '韓元',   flag: '🇰🇷', ratePerTWD: 43.5  },
  { code: 'JPY', symbol: '¥',   name: '日圓',   flag: '🇯🇵', ratePerTWD: 4.6   },
  { code: 'USD', symbol: '$',   name: '美元',   flag: '🇺🇸', ratePerTWD: 0.031 },
  { code: 'EUR', symbol: '€',   name: '歐元',   flag: '🇪🇺', ratePerTWD: 0.029 },
  { code: 'HKD', symbol: 'HK$', name: '港幣',   flag: '🇭🇰', ratePerTWD: 0.24  },
  { code: 'THB', symbol: '฿',   name: '泰銖',   flag: '🇹🇭', ratePerTWD: 1.13  },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];
export type CardDensity = 'compact' | 'comfortable' | 'spacious';

// Default exchange rates: 1 TWD = N foreign units
const DEFAULT_RATES: Record<string, number> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.ratePerTWD])
);

interface SettingsState {
  themeHue: number;
  themeMode: ThemeMode;
  travelCurrency: CurrencyCode;
  exchangeRates: Record<string, number>; // 1 TWD → N foreign units
  cardDensity: CardDensity;
  setThemeHue: (hue: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setTravelCurrency: (code: CurrencyCode) => void;
  setExchangeRate: (code: string, rate: number) => void;
  setCardDensity: (density: CardDensity) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      themeHue: 340,
      themeMode: 'light',
      travelCurrency: 'KRW',
      exchangeRates: DEFAULT_RATES,
      cardDensity: 'comfortable',

      setThemeHue: (hue) => {
        applyTheme(hue, get().themeMode);
        set({ themeHue: hue });
      },
      setThemeMode: (mode) => {
        applyTheme(get().themeHue, mode);
        set({ themeMode: mode });
      },
      setTravelCurrency: (code) => set({ travelCurrency: code }),
      setExchangeRate: (code, rate) =>
        set((s) => ({ exchangeRates: { ...s.exchangeRates, [code]: rate } })),
      setCardDensity: (density) => set({ cardDensity: density }),
    }),
    { name: 'travel-app-settings' }
  )
);

// Auto-mode: react to OS theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { themeHue, themeMode } = useSettingsStore.getState();
    if (themeMode === 'auto') applyTheme(themeHue, themeMode);
  });
}
