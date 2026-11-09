import { Dimensions, StyleSheet as NativeStyleSheet } from 'react-native';
import { getMFPalette, type MFPalette } from '@/lib/mf-tokens';

/**
 * Ponte de cores de telas legadas para os dois temas MF.
 * - Não altera APIs, cálculos ou estado dos formulários.
 * - Determina cor de um texto levando em conta a superfície associada.
 * - Mantém todos os valores recalculados na leitura de styles.xxx, pois o tema
 *   pode mudar sem recarregar a tela no PWA/iOS.
 * - Não aplica opacidade a conteúdo de consulta: texto legível mesmo quando
 *   a avaliação está concluída e campos não são editáveis.
 */

const OLD_NAVY = new Set(['#123C47', '#122A32', '#12353F', '#0D3742', '#13404D', '#153C47', '#343D5A']);
const OLD_INK = new Set(['#172D34', '#152D36', '#1A3036', '#172E34', '#344A51', '#2D464D', '#122A32']);
const OLD_GREEN = new Set(['#40856C', '#2E7059', '#315E4D', '#526C64', '#2F7A60', '#37785F', '#176A6B', '#336B55']);
const OLD_MUTED = new Set(['#718084', '#839095', '#8A989C', '#66757A', '#6D7B80', '#7B8588', '#8C979A', '#A1ACAF', '#96A1A4', '#9AA4A7', '#9BA5A8', '#637A72', '#566D71', '#829095', '#78888B', '#7B898A', '#66787A', '#647679', '#7D8C8E', '#80918F', '#84928F', '#5E7472', '#536569', '#617779', '#7C8B8E', '#8A969A', '#7C6565', '#5D6C70', '#C9D8DA', '#CCD9DB']);
const OLD_BG = new Set(['#F7F8F6', '#F8FAF8', '#F5F7F5', '#F6F9F7', '#F5F8F6', '#F4F6F4']);
const OLD_BORDER = new Set(['#E4E9E7', '#DEE7E4', '#E7EBEA', '#D4DFDC', '#DEE4E2', '#D8E3E0', '#E6ECEA', '#EEF2F0', '#E0E7E3', '#DDE4ED', '#E3E9E6']);
const OLD_SOFT = new Set(['#EAF3EF', '#EFF6F2', '#EAF6EF', '#EDF5F2', '#E8F3EE', '#F0F7F3', '#EAF4F0', '#EAF5EE']);
const HEX = /^#[0-9a-f]{6}$/i;
const ACTION = /(save|submit|primary|add|complete|confirm|login|emptybutton|cta|actionbutton|createbutton|darkbutton|errorbackbutton|newassessmentbutton|comparebutton|backbuttonlarge)/i;
const NON_ACTION = /(disabled|secondary|outline|cancel|danger|logout|ghost|text|label|icon|backbutton$|remove)/i;
const INPUT = /(^|\w)(input|textarea|textinput|entryfield|textfield|numericfield|datefield|numberfield)/i;
const CARD = /^(card|formcard|resultscard|resultcard|profilecard|infocard|sectioncard|listcard|photocard|historycard|tablecard|introcard|optionscard|datecard|previouscard|protocolcard|choicecard|selectedoptioncard)$/i;
const THEME_BG = /^(container|safearea|safe|loadingcontainer|loading|screen|center)$/i;
const STRONG_TEXT = /(?:^|_)(title|name|value|amount|heading|date|number|total|result|metric)(?:$|[A-Z_])/i;
const MUTED_TEXT = /(description|subtitle|hint|caption|helper|eyebrow|label|hinttext|support|note|meta|secondary|muted|placeholder)/i;
const DARK_CONTENT = /^(selected(Name|Description|Label)|status(Value|Label)|modalTitle|zoomText)$/i;
const BG_PROPS = /^(backgroundColor)$/i;
const FG_PROPS = /^(color|placeholderTextColor|tintColor)$/i;
const BORDER_PROPS = /(border.*color|outlinecolor|shadowcolor)$/i;
const SURFACES = ['#FFFFFF', '#FAFCFB'];

function linear(channel: number): number {
  const c = channel / 255;
  return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  if (!HEX.test(hex)) return 0;
  return .2126 * linear(parseInt(hex.slice(1, 3), 16))
    + .7152 * linear(parseInt(hex.slice(3, 5), 16))
    + .0722 * linear(parseInt(hex.slice(5, 7), 16));
}
function contrast(a: string, b: string): number {
  const x = luminance(a); const y = luminance(b);
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
function isPrimaryAction(key: string): boolean { return ACTION.test(key) && !NON_ACTION.test(key); }
function isSelected(key: string): boolean { return /(active|selected|checked|selectedchoice|selectedoption)/i.test(key); }
function isInput(key: string): boolean { return INPUT.test(key) && !/(label|hint|error|title|description|icon)/i.test(key); }

function semanticBg(original: string, key: string, p: MFPalette): string {
  const hex = original.toUpperCase();
  if (THEME_BG.test(key) && (OLD_BG.has(hex) || SURFACES.includes(hex))) return p.bg;
  if (CARD.test(key)) return p.surface;
  if (isInput(key)) return p.soft;
  if (OLD_BG.has(hex)) return p.bg;
  if (SURFACES.includes(hex)) return p.surface;
  if (OLD_NAVY.has(hex)) return isPrimaryAction(key) ? p.lime : p.navy;
  if (OLD_GREEN.has(hex)) {
    if (/checkboxactive/i.test(key)) return p.navy; // check branco mantém contraste
    if (/(radioinner|radiodot|statusdot|indicator|progressfill)/i.test(key)) return p.lime;
    if (isSelected(key)) return p.greenSoft;
    return isPrimaryAction(key) || /^(button|primarybutton|action)$/i.test(key) ? p.lime : p.greenSoft;
  }
  if (OLD_SOFT.has(hex)) return p.greenSoft;
  if (/^#FFF[0-9A-F]{3}$/.test(hex) && (isRed(hex) || isWarm(hex))) return isRed(hex) ? p.errorSoft : p.warningSoft;
  if (isRed(hex) && luminance(hex) > .68) return p.errorSoft;
  if (isWarm(hex) && luminance(hex) > .72) return p.warningSoft;
  if (isGreen(hex) && luminance(hex) > .55) return p.greenSoft;
  if (OLD_BORDER.has(hex) || luminance(hex) > .72) return p.soft;
  return original;
}

function semanticFg(original: string, key: string, p: MFPalette): string {
  const hex = original.toUpperCase();
  if (!HEX.test(hex)) return original;
  if (OLD_GREEN.has(hex) || isGreen(hex)) return p.greenText;
  if (OLD_MUTED.has(hex)) return p.muted;
  if (OLD_NAVY.has(hex) || OLD_INK.has(hex)) return p.ink;
  if (isRed(hex)) return p.error;
  if (isWarm(hex)) return p.warning;
  if (SURFACES.includes(hex) || hex === '#F8FAFC' || hex === '#F4F6FC') {
    return isPrimaryAction(key) ? p.onLime : (DARK_CONTENT.test(key) ? p.white : p.ink);
  }
  if (luminance(hex) > .49) {
    // Cores pastel sobre fundos escuros são normais em banners, mas valores
    // de leitura em cards e formulários não podem continuar quase brancos.
    return DARK_CONTENT.test(key) ? p.white : p.muted;
  }
  return contrast(hex, p.surface) >= 4.5 ? hex : (MUTED_TEXT.test(key) ? p.muted : p.ink);
}

/** Decide o tom final usando a superfície realmente associada à classe. */
function readable(fg: string, bg: string, key: string, p: MFPalette): string {
  if (!HEX.test(fg) || !HEX.test(bg)) return fg;
  if (contrast(fg, bg) >= 4.5) return fg;
  if (bg.toUpperCase() === p.lime.toUpperCase()) return p.onLime;
  if (bg.toUpperCase() === p.navy.toUpperCase()) return p.white;
  if (bg.toUpperCase() === p.greenSoft.toUpperCase()) return p.greenText;
  if (bg.toUpperCase() === p.errorSoft.toUpperCase()) return p.error;
  if (bg.toUpperCase() === p.warningSoft.toUpperCase()) return p.warning;
  if (MUTED_TEXT.test(key) && contrast(p.muted, bg) >= 4.5) return p.muted;
  return p.ink;
}

/** Localiza a superfície irmã de um texto (buttonText -> button, por exemplo). */
function relatedBackground(key: string, styles: Record<string, Record<string, unknown>>, p: MFPalette): string | null {
  const candidates = new Set<string>();
  // Mesmo nome raiz em convenções de várias telas existentes.
  const base = key.replace(/(Text|Label|Title|Value|Description|Name)$/i, '');
  if (base !== key) for (const suffix of ['', 'Button', 'Card', 'Chip', 'Pill', 'Box', 'Container']) candidates.add(base + suffix);
  const move = key.match(/^(.+?)(Text|Label|Value)(Active|Selected|Checked)$/);
  if (move) {
    for (const suffix of ['', 'Button', 'Chip', 'Card', 'Option', 'Pill']) candidates.add(move[1] + suffix + move[3]);
  }
  if (/^status(Label|Value)$/i.test(key)) candidates.add('statusCard');
  if (/^selected(Name|Description|Label)$/i.test(key)) candidates.add('selectedCard');
  if (/^newAssessmentText$/i.test(key)) candidates.add('newAssessmentButton');
  if (/^filterTextActive$/i.test(key)) candidates.add('filterButtonActive');
  if (/^optionTextActive$/i.test(key)) candidates.add('optionChipActive');
  if (/^zoomText$/i.test(key)) candidates.add('zoomOverlay');
  for (const name of candidates) {
    const entry = styles[name];
    const original = entry?.backgroundColor;
    if (typeof original === 'string' && HEX.test(original)) return semanticBg(original, name, p);
  }
  return null;
}

function mapStyle(original: Record<string, unknown>, key: string, all: Record<string, Record<string, unknown>>): Record<string, unknown> {
  const p = getMFPalette();
  const result: Record<string, unknown> = { ...original };
  for (const field of Object.keys(original)) {
    const v = original[field];
    if (typeof v !== 'string' || !HEX.test(v)) continue;
    if (BG_PROPS.test(field)) result[field] = semanticBg(v, key, p);
    else if (FG_PROPS.test(field)) result[field] = semanticFg(v, key, p);
    else if (BORDER_PROPS.test(field)) result[field] = OLD_BORDER.has(v.toUpperCase()) || luminance(v) > .45 ? p.border : v;
  }
  const bg = typeof result.backgroundColor === 'string' && HEX.test(result.backgroundColor) ? result.backgroundColor : relatedBackground(key, all, p);
  if (bg && typeof result.color === 'string' && HEX.test(result.color)) result.color = readable(result.color, bg, key, p);
  // TextInput com fundo antigo escuro não pode ter texto ou seleção escuros.
  if (isInput(key) && typeof original.backgroundColor === 'string') {
    result.backgroundColor = p.soft;
    if (typeof original.color === 'string') result.color = p.ink;
  }
  if (THEME_BG.test(key) && typeof original.backgroundColor === 'string') result.backgroundColor = p.bg;
  if (CARD.test(key) && typeof original.backgroundColor === 'string') {
    result.backgroundColor = p.surface;
    if (typeof original.borderColor === 'string') result.borderColor = p.border;
  }
  // Se um cartão antigo azul-marinho passou a branco, suas legendas precisam
  // da paleta de leitura atual, sem reter texto claro da composição antiga.
  if (/^(title|headerTitle|pageTitle|sectionTitle|historyDate|metricValue|detailValue)$/i.test(key) && typeof original.color === 'string') result.color = p.ink;
  if (key === 'name' && typeof original.color === 'string') result.color = p.ink;
  if (/^(age|detailLabel|metaText|infoLabel)$/i.test(key) && typeof original.color === 'string') result.color = p.muted;
  if (/^content$|^scrollContent$/i.test(key) && Dimensions.get('window').width >= 1000) {
    result.maxWidth = 1280; result.width = '100%'; result.alignSelf = 'center'; result.paddingHorizontal = 32;
  }
  if (/^(title|headerTitle|pageTitle)$/i.test(key)) result.fontFamily = 'Manrope';
  return result;
}

/** Assinatura 100% compatível com StyleSheet.create do React Native. */
export const MFStyleSheet: typeof NativeStyleSheet = new Proxy(NativeStyleSheet, {
  get(target, property, receiver) {
    if (property !== 'create') return Reflect.get(target, property, receiver);
    return (values: Record<string, Record<string, unknown>>) => {
      const source = NativeStyleSheet.create(values as any);
      return new Proxy(source, {
        get(styles, name, rec) {
          const value = Reflect.get(styles, name, rec);
          if (typeof name !== 'string' || !value || typeof value !== 'object' || Array.isArray(value)) return value;
          return mapStyle(value as Record<string, unknown>, name, values);
        },
      });
    };
  },
});

/** Cores diretas em ícones/placeholder; mantém branco quando explicitamente solicitado. */
export function mfLegacyColor(color: string, property = 'color'): string {
  const p = getMFPalette();
  if (!HEX.test(color)) return color;
  if (BG_PROPS.test(property)) return semanticBg(color, 'inline', p);
  if (BORDER_PROPS.test(property)) return OLD_BORDER.has(color.toUpperCase()) ? p.border : color;
  if (color.toUpperCase() === '#FFFFFF') return p.white;
  return semanticFg(color, 'inline', p);
}
