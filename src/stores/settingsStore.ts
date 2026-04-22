import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export function generateMilkTeaPalette(hue: number): Record<string, string> {
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

export function applyThemePalette(hue: number): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(generateMilkTeaPalette(hue))) {
    root.style.setProperty(key, value);
  }
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
  travelCurrency: CurrencyCode;
  exchangeRates: Record<string, number>; // 1 TWD → N foreign units
  cardDensity: CardDensity;
  setThemeHue: (hue: number) => void;
  setTravelCurrency: (code: CurrencyCode) => void;
  setExchangeRate: (code: string, rate: number) => void;
  setCardDensity: (density: CardDensity) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeHue: 340,
      travelCurrency: 'KRW',
      exchangeRates: DEFAULT_RATES,
      cardDensity: 'comfortable',

      setThemeHue: (hue) => {
        applyThemePalette(hue);
        set({ themeHue: hue });
      },
      setTravelCurrency: (code) => set({ travelCurrency: code }),
      setExchangeRate: (code, rate) =>
        set((s) => ({ exchangeRates: { ...s.exchangeRates, [code]: rate } })),
      setCardDensity: (density) => set({ cardDensity: density }),
    }),
    { name: 'travel-app-settings' }
  )
);
