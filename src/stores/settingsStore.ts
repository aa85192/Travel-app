import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'auto';

export function generateMilkTeaPalette(
  hue: number,
  mode: 'light' | 'dark' = 'light',
): Record<string, string> {
  if (mode === 'dark') {
    // Inverted lightness scale: 50 → darkest bg, 900 → lightest text
    return {
      '--color-milk-tea-50':  `hsl(${hue}, 22%, 9%)`,
      '--color-milk-tea-100': `hsl(${hue}, 20%, 15%)`,
      '--color-milk-tea-200': `hsl(${hue}, 18%, 22%)`,
      '--color-milk-tea-300': `hsl(${hue}, 18%, 32%)`,
      '--color-milk-tea-400': `hsl(${hue}, 28%, 55%)`,
      '--color-milk-tea-500': `hsl(${hue}, 60%, 70%)`,
      '--color-milk-tea-600': `hsl(${hue}, 70%, 78%)`,
      '--color-milk-tea-700': `hsl(${hue}, 75%, 85%)`,
      '--color-milk-tea-800': `hsl(${hue}, 80%, 91%)`,
      '--color-milk-tea-900': `hsl(${hue}, 90%, 96%)`,
    };
  }
  return {
    '--color-milk-tea-50':  `hsl(${hue}, 100%, 98%)`,
    '--color-milk-tea-100': `hsl(${hue}, 97%, 92%)`,
    '--color-milk-tea-200': `hsl(${hue}, 100%, 87%)`,
    '--color-milk-tea-300': `hsl(${hue}, 100%, 83%)`,
    '--color-milk-tea-400': `hsl(${hue}, 100%, 78%)`,
    '--color-milk-tea-500': `hsl(${hue}, 100%, 71%)`,
    '--color-milk-tea-600': `hsl(${hue}, 77%, 62%)`,
    '--color-milk-tea-700': `hsl(${hue}, 54%, 50%)`,
    '--color-milk-tea-800': `hsl(${hue}, 56%, 39%)`,
    '--color-milk-tea-900': `hsl(${hue}, 60%, 26%)`,
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
