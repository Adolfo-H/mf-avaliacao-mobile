import { Ionicons } from '@expo/vector-icons';
import { type Href, router, Stack, usePathname } from 'expo-router';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { MFBrand } from '@/components/MFBrand';
import { useMFTheme } from '@/contexts/MFThemeContext';
import { useAuth } from '@/contexts/AuthContext';

type NavItem = { id: string; title: string; icon: keyof typeof Ionicons.glyphMap; href: Href; adminOnly?: boolean };
const NAV: NavItem[] = [
  { id: 'dashboard', title: 'Visão geral', icon: 'home-outline', href: '/(app)/(tabs)/dashboard' },
  { id: 'students', title: 'Alunos', icon: 'people-outline', href: '/(app)/(tabs)/alunos' },
  { id: 'assessments', title: 'Avaliações', icon: 'pulse-outline', href: '/(app)/(tabs)/avaliacoes' },
  { id: 'reports', title: 'Relatórios', icon: 'document-text-outline', href: '/(app)/reports' },
  { id: 'team', title: 'Equipe', icon: 'people-circle-outline', href: '/(app)/evaluators', adminOnly: true },
  { id: 'profile', title: 'Meu perfil', icon: 'person-outline', href: '/(app)/(tabs)/perfil' },
];

function navActive(path: string, id: string): boolean {
  if (id === 'dashboard') return path.includes('dashboard');
  if (id === 'students') return path.includes('alunos') || path.includes('/students/');
  if (id === 'assessments') return path.includes('avaliacoes') || path.includes('/assessments/');
  if (id === 'reports') return path.includes('/reports') || path.includes('assessment-reports');
  if (id === 'team') return path.includes('/evaluators');
  if (id === 'profile') return path.includes('perfil') || path.includes('appearance');
  return false;
}
function currentTitle(path: string): string {
  const route = path.toLowerCase();
  if (route.includes('dashboard')) return 'Visão geral';
  if (route.includes('alunos') || route.includes('/students/')) return 'Alunos';
  if (route.includes('/assessments/') || route.includes('avaliacoes')) return 'Avaliações';
  if (route.includes('/reports')) return 'Relatórios';
  if (route.includes('/evaluators')) return 'Equipe';
  if (route.includes('perfil')) return 'Meu perfil';
  return 'MF Avaliação Física';
}

function ModeButton({ compact = false }: { compact?: boolean }) {
  const { theme, setPreference, colors } = useMFTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onPress={() => setPreference(theme === 'dark' ? 'light' : 'dark')}
      style={{ width: compact ? 40 : 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 13, borderColor: colors.border, backgroundColor: colors.surface }}
    >
      <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={21} color={colors.ink} />
    </Pressable>
  );
}

function DesktopSidebar({ path }: { path: string }) {
  const { user } = useAuth();
  const { colors } = useMFTheme();
  return (
    <View style={{ width: 228, backgroundColor: '#343D5A', paddingTop: 20, paddingHorizontal: 16, paddingBottom: 24, justifyContent: 'space-between' }}>
      <View>
        <MFBrand style={{ marginBottom: 30, paddingHorizontal: 8 }} />
        {NAV.map(item => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const active = navActive(path, item.id);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="link"
              accessibilityLabel={item.title}
              onPress={() => router.navigate(item.href)}
              style={{ paddingHorizontal: 15, minHeight: 48, gap: 13, flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 6, backgroundColor: active ? colors.lime : 'transparent' }}
            >
              <Ionicons name={item.icon} size={20} color={active ? colors.onLime : '#E7EAF1'} />
              <Text style={{ color: active ? colors.onLime : '#E7EAF1', fontSize: 13, fontWeight: active ? '800' : '600' }}>{item.title}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: '#515B77', paddingTop: 20, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#414E69', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.lime, fontWeight: '800', fontSize: 12 }}>MF</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>{user?.name ?? 'Equipe MF'}</Text>
          <Text style={{ color: '#B5BED3', fontSize: 10, marginTop: 3 }}>{user?.role === 'admin' ? 'Administrador' : user?.role === 'reception' ? 'Recepção' : 'Avaliador'}</Text>
        </View>
      </View>
    </View>
  );
}

function MobileBottomNav({ path }: { path: string }) {
  const { colors } = useMFTheme();
  const items = NAV.filter(item => ['dashboard', 'students', 'assessments', 'profile'].includes(item.id));
  return (
    <View style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, height: 68, paddingBottom: Platform.OS === 'ios' ? 4 : 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
      {items.map(item => {
        const active = navActive(path, item.id);
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => router.navigate(item.href)}
            style={{ minWidth: 70, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: 13, backgroundColor: active ? colors.greenSoft : 'transparent' }}
          >
            <Ionicons name={item.icon} size={21} color={active ? colors.greenText : colors.muted} />
            <Text style={{ fontSize: 10, fontWeight: active ? '800' : '600', color: active ? colors.greenText : colors.muted }}>{item.id === 'dashboard' ? 'Início' : item.title === 'Meu perfil' ? 'Perfil' : item.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MFAppShell() {
  const { desktop, colors } = useMFTheme();
  const path = usePathname();
  const { user } = useAuth();

  const header: ViewStyle = { height: 72, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32 };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {desktop ? <DesktopSidebar path={path} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {desktop ? (
          <View style={header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>MF Saúde & Movimento</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '800' }}>{currentTitle(path)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ModeButton />
              <View style={{ backgroundColor: colors.greenSoft, paddingHorizontal: 15, height: 38, borderRadius: 12, justifyContent: 'center' }}>
                <Text style={{ color: colors.greenText, fontWeight: '800', fontSize: 12 }}>{(user?.name ?? 'MF').split(' ')[0]}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#343D5A', borderRadius: 8, height: 38, width: 87, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                <Image source={require('../assets/images/mf-logo.png')} resizeMode="contain" style={{ width: 78, height: 34 }} />
              </View>
              <Text style={{ marginLeft: 10, fontSize: 11, fontWeight: '800', color: colors.ink }}>Avaliação Física</Text>
            </View>
            <ModeButton compact />
          </View>
        )}
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }} />
        </View>
        {!desktop ? <MobileBottomNav path={path} /> : null}
      </View>
    </View>
  );
}
