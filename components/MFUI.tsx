import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useMFTheme } from '@/contexts/MFThemeContext';

export function MFHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: ReactNode }) {
  const { colors: c, desktop } = useMFTheme();
  return <View style={{ marginBottom: 23, flexDirection: desktop ? 'row' : 'column', justifyContent: 'space-between', alignItems: desktop ? 'center' : 'flex-start', gap: 13 }}>
    <View style={{ flex: 1 }}><Text style={{ color: c.greenText, fontWeight: '800', fontSize: 10, letterSpacing: 1.6 }}>{eyebrow.toUpperCase()}</Text><Text style={{ color: c.ink, fontSize: desktop ? 31 : 27, fontFamily: 'Manrope', fontWeight: '800', letterSpacing: -0.8, marginTop: 8 }}>{title}</Text>{subtitle ? <Text style={{ color: c.muted, fontSize: 12, marginTop: 7, lineHeight: 18 }}>{subtitle}</Text> : null}</View>
    {action}
  </View>;
}

export function MFButton({ label, icon = 'add', onPress, disabled = false, subtle = false, busy = false }: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; subtle?: boolean; busy?: boolean }) {
  const { colors: c } = useMFTheme();
  return <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={onPress} style={{ backgroundColor: subtle ? c.surface : c.lime, minHeight: 47, paddingHorizontal: 18, borderColor: subtle ? c.border : c.lime, borderWidth: 1, borderRadius: 13, gap: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', opacity: disabled || busy ? .6 : 1 }}>
    {busy ? <ActivityIndicator color={c.onLime} size="small" /> : <Ionicons name={icon} color={subtle ? c.ink : c.onLime} size={18} />}
    <Text style={{ color: subtle ? c.ink : c.onLime, fontSize: 12, fontWeight: '800' }}>{label}</Text>
  </Pressable>;
}

export function MFSearch({ value, onChangeText, onSubmit, placeholder }: { value: string; onChangeText: (value:string) => void; onSubmit: () => void; placeholder: string }) {
  const { colors: c } = useMFTheme();
  return <View style={{ flex: 1, minWidth: 210, backgroundColor: c.surface, borderRadius: 13, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', minHeight: 49, paddingHorizontal: 14, gap: 10 }}>
    <Ionicons name="search-outline" size={19} color={c.muted}/>
    <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} onSubmitEditing={onSubmit} returnKeyType="search" placeholder={placeholder} placeholderTextColor={c.muted} style={{ flex: 1, color: c.ink, fontSize: 12, minWidth: 0 }}/>
    <Pressable accessibilityRole="button" accessibilityLabel="Buscar" onPress={onSubmit}><Ionicons name="arrow-forward" size={19} color={c.greenText}/></Pressable>
  </View>;
}

export function MFFilter({ values, active, onChange }: { values: readonly { value: string; label: string }[]; active: string; onChange: (value: string) => void }) {
  const { colors: c } = useMFTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
    {values.map(value => <Pressable key={value.value} onPress={() => onChange(value.value)} accessibilityRole="button" accessibilityState={{ selected: active === value.value }} style={{ paddingHorizontal: 13, height: 39, borderRadius: 11, borderWidth: 1, justifyContent: 'center', backgroundColor: active === value.value ? c.greenSoft : c.surface, borderColor: active === value.value ? c.lime : c.border }}><Text style={{ fontSize: 11, fontWeight: active === value.value ? '800' : '600', color: active === value.value ? c.greenText : c.muted }}>{value.label}</Text></Pressable>)}
  </View>;
}

export function MFBadge({ label, positive = false }: { label: string; positive?: boolean }) {
  const { colors: c } = useMFTheme();
  return <View style={{ alignSelf: 'flex-start', backgroundColor: positive ? c.greenSoft : c.soft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 }}><Text style={{ color: positive ? c.greenText : c.muted, fontSize: 10, fontWeight: '800' }}>{label}</Text></View>;
}

export function MFEmpty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  const { colors: c } = useMFTheme();
  return <View style={{ padding: 30, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center', gap: 13 }}><View style={{ backgroundColor: c.greenSoft, borderRadius: 19, height: 65, width: 65, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="file-tray-outline" color={c.greenText} size={29}/></View><Text style={{ color: c.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{title}</Text><Text style={{ color: c.muted, fontSize: 12, lineHeight: 19, textAlign: 'center' }}>{description}</Text>{action}</View>;
}
