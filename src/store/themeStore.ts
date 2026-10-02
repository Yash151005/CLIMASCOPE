/**
 * CLIMASCOPE — Theme Store
 */

import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    document.documentElement.setAttribute('data-theme', next);
    document.body.classList.toggle('theme-light', next === 'light');
  },
}));
