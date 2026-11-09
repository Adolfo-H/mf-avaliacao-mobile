import { Appearance, Platform } from 'react-native';

/** Cores aprovadas no protótipo MF Saúde & Movimento. */
export const MF_COLORS = {
  light: {
    bg: '#F5F7FA',
    surface: '#FFFFFF',
    soft: '#EDF1F6',
    ink: '#212B43',
    muted: '#65718A',
    border: '#DDE4ED',
    lime: '#A5E63B',
    onLime: '#263816',
    greenSoft: '#EEF8DD',
    greenText: '#42651B',
    navy: '#343D5A',
    white: '#FFFFFF',
    error: '#AC3E48',
    errorSoft: '#FFF0F1',
    warning: '#956315',
    warningSoft: '#FFF5E4',
  },
  dark: {
    bg: '#101522',
    surface: '#1A2234',
    soft: '#242E44',
    ink: '#F4F6FC',
    muted: '#A6B2C9',
    border: '#313D55',
    lime: '#A5E63B',
    onLime: '#263816',
    greenSoft: '#293A25',
    greenText: '#B7EC66',
    navy: '#343D5A',
    white: '#FFFFFF',
    error: '#FFABB0',
    errorSoft: '#402934',
    warning: '#FFD28B',
    warningSoft: '#42341B',
  },
} as const;

export type MFTheme = keyof typeof MF_COLORS;
export type MFPalette = { [K in keyof (typeof MF_COLORS)['light']]: string };

let activeTheme: MFTheme = 'light';
export function setMFActiveTheme(next: MFTheme): void { activeTheme = next; }
export function getMFActiveTheme(): MFTheme {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('mf:appearance:v1');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch { /* armazenamento de preferência opcional */ }
  }
  return activeTheme;
}
export function getMFPalette(): MFPalette { return MF_COLORS[getMFActiveTheme()]; }
