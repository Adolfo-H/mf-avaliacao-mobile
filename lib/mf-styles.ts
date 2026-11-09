import { Dimensions, StyleSheet as NativeStyleSheet } from 'react-native';
import { getMFPalette } from '@/lib/mf-tokens';

/**
 * Adapta os estilos legados sem alterar os formulários, dados ou serviços.
 * O bug anterior era uma divergência entre o tema do Context e o do bridge,
 * agravada por cores brancas/cinzas preservadas sobre cartões claros.
 */
const NAVY = new Set(['#123C47', '#122A32', '#12353F', '#0D3742', '#13404D', '#153C47']);
const DARK_TEXT = new Set(['#172D34', '#152D36', '#1A3036', '#172E34', '#344A51', '#2D464D']);
const GREEN = new Set(['#40856C', '#2E7059', '#315E4D', '#526C64', '#2F7A60', '#37785F', '#176A6B', '#336B55']);
const MUTED = new Set(['#718084', '#839095', '#8A989C', '#66757A', '#6D7B80', '#7B8588', '#8C979A', '#A1ACAF', '#96A1A4', '#9AA4A7', '#9BA5A8', '#637A72', '#566D71', '#829095', '#78888B', '#7B898A', '#66787A', '#647679', '#7D8C8E', '#80918F', '#84928F', '#5E7472', '#536569', '#617779', '#7C8B8E', '#8A969A', '#7C6565', '#5D6C70', '#C9D8DA', '#CCD9DB']);
const BG = new Set(['#F7F8F6', '#F8FAF8', '#F5F7F5', '#F6F9F7', '#F5F8F6']);
const BORDER = new Set(['#E4E9E7', '#DEE7E4', '#E7EBEA', '#D4DFDC', '#DEE4E2', '#D8E3E0', '#E6ECEA', '#EEF2F0', '#E0E7E3', '#DDE4ED', '#E3E9E6']);
const SOFT = new Set(['#EAF3EF', '#EFF6F2', '#EAF6EF', '#EDF5F2', '#E8F3EE', '#F0F7F3', '#EAF4F0', '#EAF5EE']);
const WHITE_ON_NAVY = /^(selectedName|selectedDescription|selectedLabel|statusValue|statusLabel|modalTitle|newAssessmentText|compareText|compareButtonText|returnButtonText|backButtonLargeText|filterTextActive|positionTextActive|confirmRemoveText)$/i;
const ACTION_TEXT = /(save|submit|primary|add|complete|confirm|login|emptybutton|cta|actionbutton|createbutton)/i;
const ACTION_BG = /(save|submit|primary|add|complete|confirm|login|emptybutton|cta|actionbutton|createbutton)/i;

function luminance(hex: string): number {
  const n = hex.slice(1).match(/.{2}/g);
  if (!n || n.length !== 3) return 0;
  const rgb = n.map(v => parseInt(v, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
function isGreen(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return g > r * 1.13 && g > b * 1.02 && g - r > 18;
}
function isRed(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return r > g * 1.25 && r > b * 1.15;
}
function isWarm(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return r > b * 1.3 && g > b * 1.16 && r >= g;
}

function colorFromLegacy(original: string, property: string, key: string): string {
  const p = getMFPalette();
  const hex = original.toUpperCase();
  const isBg = property.toLowerCase().includes('background');
  const isBorder = /border|outline|shadow/i.test(property);
  const isText = property === 'color' || property === 'placeholderTextColor' || property === 'tintColor';
  const isAction = ACTION_BG.test(key) && !/(disabled|secondary|outline|back|cancel|danger|logout|ghost|text|label|icon|remove)/i.test(key);
  const actionText = ACTION_TEXT.test(key) && /(text|label)/i.test(key) && !/(cancel|remove|danger|logout|back|return)/i.test(key);

  if (isBorder) {
    return BORDER.has(hex) || luminance(hex) > .45 ? p.border : original;
  }
  if (isBg) {
    if (NAVY.has(hex)) return isAction ? p.lime : p.navy;
    if (BG.has(hex)) return p.bg;
    if (hex === '#FFFFFF' || hex === '#FAFCFB') return p.surface;
    if (SOFT.has(hex) || (isGreen(hex) && luminance(hex) > .55)) return p.greenSoft;
    if (GREEN.has(hex)) return /(active|selected|filter)/i.test(key) ? p.lime : (isAction ? p.lime : p.greenSoft);
    if (['#FFF1F1', '#FFF3EF'].includes(hex) || isRed(hex) && luminance(hex) > .68) return p.errorSoft;
    if (['#FFF4E5', '#FFF5E4', '#FFF1DA', '#FFF4DE'].includes(hex) || isWarm(hex) && luminance(hex) > .72) return p.warningSoft;
    if (BORDER.has(hex) || luminance(hex) > .74) return p.soft;
    // Preserva cores intencionais de botões, banners e overlays escuros.
    return original;
  }
  if (isText) {
    // Ícones brancos inline normalmente ficam sobre botões azul-marinho.
    // Sem contexto do componente, preservar o branco intencional.
    if (key === 'inline' && (hex === '#FFFFFF' || hex === '#FAFCFB')) return property === 'placeholderTextColor' ? p.muted : p.white;
    // Rótulos em cartões com fundo próprio (azul escuro) permanecem claros.
    if (WHITE_ON_NAVY.test(key)) {
      if (/^(selectedLabel|statusLabel)$/i.test(key)) return p.lime;
      if (/^(filterTextActive|positionTextActive)$/i.test(key)) return p.onLime;
      return p.white;
    }
    if (hex === '#FFFFFF' || hex === '#FAFCFB' || hex === '#F8FAFC') {
      return actionText ? p.onLime : (property === 'color' ? p.ink : p.muted);
    }
    if (NAVY.has(hex) || DARK_TEXT.has(hex)) return p.ink;
    if (GREEN.has(hex)) return p.greenText;
    if (MUTED.has(hex)) return p.muted;
    if (['#B44747', '#9B4646', '#B84C4C', '#AE4B4B', '#A34444', '#9F4545'].includes(hex)) return p.error;
    if (['#A66A19', '#80551A', '#9B631B', '#9A6F2C'].includes(hex)) return p.warning;
    if (isRed(hex) && contrast(hex, p.surface) < 4.5) return p.error;
    if (isWarm(hex) && contrast(hex, p.surface) < 4.5) return p.warning;
    if (isGreen(hex)) return p.greenText;
    // Mesmo quando uma cor não estava na tabela original, nunca permitir
    // texto escuro sobre fundo escuro ou claro sobre cartão branco.
    if (contrast(hex, p.surface) < 4.5) {
      return /title|name|value|date|heading|amount|number|count/i.test(key) ? p.ink : p.muted;
    }
    return hex;
  }
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
  if (/^(container|safearea|safeArea|loadingContainer|loading|screen|safe)$/i.test(key) && 'backgroundColor' in style) {
    transformed.backgroundColor = p.bg;
  }
  if (/^(card|formCard|resultCard|profileCard|infoCard|resultsCard|sectionCard|listCard|photoCard)$/i.test(key) && 'backgroundColor' in style) {
    transformed.backgroundColor = p.surface;
    if ('borderColor' in style) transformed.borderColor = p.border;
  }
  // "name" só quando for exatamente o nome no cartão claro. selectedName
  // permanece branco no cartão azul: /name$/ sobrescrevia incorretamente.
  if (/^(title|headerTitle|pageTitle|sectionTitle|name|historyDate|metricValue|detailValue)$/i.test(key) && 'color' in style) transformed.color = p.ink;
  if (/^content$|^scrollContent$/i.test(key) && Dimensions.get('window').width >= 1000) {
    transformed.maxWidth = 1280;
    transformed.width = '100%';
    transformed.alignSelf = 'center';
    transformed.paddingHorizontal = 32;
  }
  if (/^(title|headerTitle|pageTitle)$/i.test(key)) transformed.fontFamily = 'Manrope';
  return transformed;
}

/** Mantém assinatura do StyleSheet do React Native; não toca nos dados. */
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

/** Ícones e placeholders com cores antigas informadas diretamente no JSX. */
export function mfLegacyColor(color: string, property = 'color'): string {
  return colorFromLegacy(color, property, 'inline');
}
