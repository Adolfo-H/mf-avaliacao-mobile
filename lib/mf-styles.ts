import { Dimensions, StyleSheet as NativeStyleSheet } from 'react-native';
import { getMFActiveTheme, getMFPalette } from '@/lib/mf-tokens';

/**
 * Bridge de estilo do aplicativo antigo para o design system aprovado.
 * Recolore APENAS a camada de apresentação; não modifica handlers, serviços,
 * permissões, formulários, valores, banco ou requisições HTTP.
 */
function colorFromLegacy(original: string, property: string, key: string): string {
  const palette = getMFPalette();
  const hex = original.toUpperCase();
  const isBg = property === 'backgroundColor';
  const isBorder = property === 'borderColor' || property === 'borderTopColor' || property === 'borderBottomColor';
  const action = /(save|submit|primary|add|complete|confirm|login|emptybutton|buttonprimary|cta|actionbutton)/i.test(key)
    && !/(disabled|secondary|outline|back|cancel|danger|logout|ghost|text)/i.test(key);
  const foregroundAction = /(save|submit|primary|add|complete|confirm|login|emptybutton|cta|actionbutton)/i.test(key)
    && /(text|label)/i.test(key);
  const oldNavy = new Set(['#123C47', '#122A32', '#12353F', '#0D3742', '#13404D', '#153C47']);
  const oldDarkText = new Set(['#172D34', '#152D36', '#1A3036', '#172E34', '#344A51', '#2D464D']);
  const oldGreen = new Set(['#40856C', '#2E7059', '#315E4D', '#526C64', '#2F7A60', '#37785F', '#176A6B']);
  const oldMuted = new Set(['#718084', '#839095', '#8A989C', '#66757A', '#6D7B80', '#7B8588', '#8C979A', '#A1ACAF', '#96A1A4', '#9AA4A7', '#9BA5A8', '#637A72', '#566D71']);
  const oldBg = new Set(['#F7F8F6', '#F8FAF8', '#F5F7F5', '#F6F9F7', '#F5F8F6']);
  const oldBorder = new Set(['#E4E9E7', '#DEE7E4', '#E7EBEA', '#D4DFDC', '#DEE4E2', '#D8E3E0', '#E6ECEA', '#EEF2F0', '#E0E7E3']);
  const oldSoft = new Set(['#EAF3EF', '#EFF6F2', '#EAF6EF', '#EDF5F2', '#E8F3EE', '#F0F7F3', '#EAF4F0']);
  if (isBorder && (oldBorder.has(hex) || hex === '#DDE4ED')) return palette.border;
  if (oldBg.has(hex)) return palette.bg;
  if (hex === '#FFFFFF' || hex === '#FAFCFB') {
    if (property === 'color' && foregroundAction) return palette.onLime;
    return isBg ? palette.surface : '#FFFFFF';
  }
  if (oldBorder.has(hex)) return isBg ? palette.soft : palette.border;
  if (oldSoft.has(hex)) return palette.greenSoft;
  if (oldNavy.has(hex)) {
    if (isBg) return action ? palette.lime : palette.navy;
    return palette.ink;
  }
  if (oldDarkText.has(hex)) return palette.ink;
  if (oldGreen.has(hex)) return isBg ? (action ? palette.lime : palette.greenSoft) : palette.greenText;
  if (oldMuted.has(hex)) return palette.muted;
  if (['#B44747', '#9B4646', '#B84C4C'].includes(hex)) return palette.error;
  if (['#FFF1F1', '#FFF3EF'].includes(hex)) return palette.errorSoft;
  if (['#A66A19', '#80551A', '#9B631B'].includes(hex)) return palette.warning;
  if (['#FFF4E5', '#FFF5E4', '#FFF1DA'].includes(hex)) return palette.warningSoft;
  if (isBorder) return getMFActiveTheme() === 'dark' ? palette.border : original;
  return original;
}

function styleForTheme(style: Record<string, unknown>, key: string): Record<string, unknown> {
  const transformed: Record<string, unknown> = { ...style };
  for (const field of Object.keys(style)) {
    const value = style[field];
    if (typeof value === 'string' && /^#[\da-fA-F]{6}$/.test(value)) {
      transformed[field] = colorFromLegacy(value, field, key);
    }
  }
  const p = getMFPalette();
  if (/^(container|safearea|safeArea|loadingContainer|loading|screen)$/i.test(key) && 'backgroundColor' in style) {
    transformed.backgroundColor = p.bg;
  }
  if (/^(card|formCard|resultCard|profileCard|infoCard|resultsCard|sectionCard|listCard|photoCard)$/i.test(key) && 'backgroundColor' in style) {
    transformed.backgroundColor = p.surface;
    if ('borderColor' in style) transformed.borderColor = p.border;
  }
  if (/title$|^title$|sectionTitle$|headerTitle$|pageTitle$|name$/i.test(key) && 'color' in style) transformed.color = p.ink;
  if (/^content$|^scrollContent$/i.test(key) && Dimensions.get('window').width >= 1000) {
    transformed.maxWidth = 1280;
    transformed.width = '100%';
    transformed.alignSelf = 'center';
    transformed.paddingHorizontal = 32;
  }
  if (/^title$|^headerTitle$|^pageTitle$/i.test(key)) transformed.fontFamily = 'Manrope';
  return transformed;
}

/** Same TypeScript API as RN StyleSheet.create; keys stay unchanged. */
export const MFStyleSheet: typeof NativeStyleSheet = new Proxy(NativeStyleSheet, {
  get(target, property, receiver) {
    if (property !== 'create') return Reflect.get(target, property, receiver);
    return (values: Record<string, Record<string, unknown>>) => {
      const source = NativeStyleSheet.create(values as any);
      return new Proxy(source, {
        get(styles, name, rec) {
          const original = Reflect.get(styles, name, rec);
          if (!original || typeof name !== 'string' || typeof original !== 'object' || Array.isArray(original)) return original;
          return styleForTheme(original as Record<string, unknown>, name);
        },
      });
    };
  },
});

/** Para cores passadas diretamente a ícones e placeholders fora do StyleSheet. */
export function mfLegacyColor(color: string, property = 'color'): string {
  return colorFromLegacy(color, property, 'inline');
}
