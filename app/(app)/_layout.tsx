import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { MFAppShell } from '@/components/MFAppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useMFTheme } from '@/contexts/MFThemeContext';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { colors } = useMFTheme();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 14 }}><ActivityIndicator size="large" color={colors.lime}/><Text style={{ color: colors.muted }}>Verificando sessão...</Text></View>;
  if (!user) return <Redirect href="/(auth)/login" />;
  return <MFAppShell />;
}
