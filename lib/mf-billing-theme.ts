import { useMFTheme } from '@/contexts/MFThemeContext';
/** Escurece a legenda no tema claro para mantê-la legível também sobre campos cinza. */
export function useMFBillingTheme() {
  const context = useMFTheme();
  return {
    ...context,
    colors: { ...context.colors, muted: context.theme === 'light' ? '#596780' : context.colors.muted },
  };
}
