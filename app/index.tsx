import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMFTheme } from '@/contexts/MFThemeContext';

export default function WelcomeScreen() {
  const { user, loading, sessionError, retrySession } = useAuth();
  const { colors } = useMFTheme();
  if (!loading && !sessionError) {
    return user ? <Redirect href="/(app)/(tabs)/dashboard"/> : <Redirect href="/(auth)/login"/>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 26, gap: 16 }}>
      <View style={{ width: 64, height: 64, backgroundColor: '#343D5A', borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.lime, fontSize: 24, fontWeight: '900' }}>MF</Text></View>
      {loading ? <><ActivityIndicator color={colors.lime}/><Text style={{ color: colors.muted }}>Carregando...</Text></> : <>
        <Text style={{ textAlign: 'center', color: colors.ink, fontWeight: '800', fontSize: 20 }}>Não foi possível validar sua sessão</Text>
        <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 13 }}>{sessionError} Seu acesso não foi apagado.</Text>
        <Text onPress={() => void retrySession()} accessibilityRole="button" style={{ color: colors.greenText, fontSize: 14, fontWeight: '800', padding: 14 }}>Tentar novamente</Text>
      </>}
    </View>
  );
}
