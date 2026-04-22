import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Derives the full milk-tea palette from a single hue (0-360)
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

interface SettingsState {
  themeHue: number;
  setThemeHue: (hue: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeHue: 340,
      setThemeHue: (hue) => {
        applyThemePalette(hue);
        set({ themeHue: hue });
      },
    }),
    { name: 'travel-app-settings' }
  )
);
