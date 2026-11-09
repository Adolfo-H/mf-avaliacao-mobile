import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type ReactNode,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform, useColorScheme, useWindowDimensions } from 'react-native';
import { MF_COLORS, setMFActiveTheme, type MFPalette, type MFTheme } from '@/lib/mf-tokens';

const STORAGE_KEY = 'mf:appearance:v1';
type MFThemePreference = MFTheme | 'system';
type MFThemeContextValue = {
  theme: MFTheme;
  preference: MFThemePreference;
  colors: MFPalette;
  setPreference: (value: MFThemePreference) => void;
  desktop: boolean;
  width: number;
};

const MFThemeContext = createContext<MFThemeContextValue | null>(null);

function localPreference(): MFThemePreference {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'system';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch { return 'system'; }
}

export function MFThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<MFThemePreference>(localPreference);
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const theme: MFTheme = preference === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : preference;
  // Nenhuma informação clínica é armazenada junto com a aparência.

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void SecureStore.getItemAsync(STORAGE_KEY).then(value => {
        if (value === 'light' || value === 'dark' || value === 'system') {
          setMFActiveTheme(value === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : value);
          setPreferenceState(value);
        }
      }).catch(() => { /* preferência visual opcional */ });
    }
  }, [scheme]);

  useEffect(() => { if (Platform.OS !== 'web' && preference === 'system') setMFActiveTheme(theme); }, [preference, theme]);

  const setPreference = useCallback((next: MFThemePreference) => {
    setMFActiveTheme(next === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : next);
    setPreferenceState(next);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* preferência opcional */ }
    } else {
      void SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
    }
  }, [scheme]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-mf-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo<MFThemeContextValue>(() => ({
    theme, preference, setPreference, colors: MF_COLORS[theme],
    desktop: Platform.OS === 'web' && width >= 1000, width,
  }), [theme, preference, width, setPreference]);

  // Sincronizar ANTES do render dos filhos. O bridge legado tem de usar a
  // mesma paleta do contexto; efeitos pós-render deixam textos invisíveis
  // após a troca claro/escuro no Safari e no app instalado.
  setMFActiveTheme(theme);
  return <MFThemeContext.Provider value={value}>{children}</MFThemeContext.Provider>;
}

/** Subscribing also refreshes existing legacy screens when the theme changes. */
export function useMFTheme(): MFThemeContextValue {
  const context = useContext(MFThemeContext);
  if (!context) throw new Error('MFThemeProvider obrigatório');
  return context;
}
