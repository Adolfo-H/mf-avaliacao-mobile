import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMFTheme } from '@/contexts/MFThemeContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors: c, desktop, theme, setPreference } = useMFTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) { setError('Informe seu e-mail e sua senha.'); return; }
    try {
      setLoading(true); setError('');
      await signIn(normalized, password);
      router.replace('/(app)/(tabs)/dashboard');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível acessar sua conta.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, flexDirection: desktop ? 'row' : 'column', backgroundColor: c.bg }}>
      {desktop ? (
        <View style={{ flex: 1, backgroundColor: '#343D5A', padding: 56, justifyContent: 'space-between' }}>
          <Image source={require('../../assets/images/mf-logo.png')} resizeMode="contain" style={{ width: 340, height: 150, alignSelf: 'flex-start' }} accessibilityLabel="MF Saúde & Movimento" />
          <View><Text style={{ color: c.lime, fontSize: 10, fontWeight: '800', letterSpacing: 2.5 }}>MF • SAÚDE & MOVIMENTO</Text><Text style={{ color: '#FFFFFF', fontSize: 48, fontFamily: 'Manrope', fontWeight: '800', lineHeight: 57, marginTop: 20 }}>Cada evolução\ncomeça com\num novo olhar.</Text><Text style={{ marginTop: 24, color: '#D4DBE9', fontSize: 14, lineHeight: 23, maxWidth: 410 }}>Acompanhe seus alunos, suas avaliações e resultados em um só espaço.</Text></View>
          <Text style={{ color: '#B3BDD4', fontSize: 11 }}>MF Saúde & Movimento · Acesso restrito à equipe autorizada</Text>
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: desktop ? 65 : 27, paddingVertical: 40, maxWidth: 650, alignSelf: 'center', width: '100%' }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 35 }}>
            {!desktop ? <View style={{ backgroundColor: '#343D5A', borderRadius: 16, width: 160, height: 70, justifyContent: 'center', alignItems: 'center' }}><Image source={require('../../assets/images/mf-logo.png')} resizeMode="contain" style={{ width: 148, height: 57 }}/></View> : <Text style={{ color: c.greenText, letterSpacing: 1.4, fontSize: 10, fontWeight: '800' }}>SEU ESPAÇO DE TRABALHO</Text>}
            <Pressable onPress={() => setPreference(theme === 'dark' ? 'light' : 'dark')} accessibilityRole="button" accessibilityLabel="Alternar tema claro e escuro" style={{ width: 42, height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}><Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={c.ink}/></Pressable>
          </View>
          <Text style={{ color: c.greenText, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 }}>BEM-VINDO DE VOLTA</Text>
          <Text style={{ color: c.ink, fontSize: desktop ? 36 : 29, letterSpacing: -0.7, fontWeight: '800', marginTop: 12, fontFamily: 'Manrope' }}>Entre na sua conta.</Text>
          <Text style={{ color: c.muted, fontSize: 13, lineHeight: 21, marginTop: 10, marginBottom: 32 }}>Acesse suas avaliações e acompanhe a evolução dos seus alunos.</Text>
          <Text style={{ color: c.ink, fontSize: 12, fontWeight: '800', marginBottom: 9 }}>E-mail</Text>
          <View style={{ borderColor: c.border, borderWidth: 1, borderRadius: 13, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 55, marginBottom: 23 }}><Ionicons name="mail-outline" size={19} color={c.muted}/><TextInput value={email} onChangeText={v => { setEmail(v); setError(''); }} accessibilityLabel="E-mail" placeholder="seuemail@exemplo.com" placeholderTextColor={c.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!loading} style={{ color: c.ink, fontSize: 14, paddingLeft: 12, flex: 1, minWidth: 0 }} /></View>
          <Text style={{ color: c.ink, fontSize: 12, fontWeight: '800', marginBottom: 9 }}>Senha</Text>
          <View style={{ borderColor: c.border, borderWidth: 1, borderRadius: 13, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 55 }}><Ionicons name="lock-closed-outline" size={19} color={c.muted}/><TextInput value={password} onChangeText={v => { setPassword(v); setError(''); }} accessibilityLabel="Senha" placeholder="Digite sua senha" placeholderTextColor={c.muted} secureTextEntry={!visible} editable={!loading} onSubmitEditing={() => void handleLogin()} style={{ color: c.ink, fontSize: 14, paddingLeft: 12, flex: 1, minWidth: 0 }}/><Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setVisible(v => !v)}><Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.muted}/></Pressable></View>
          {error ? <View style={{ backgroundColor: c.errorSoft, marginTop: 15, padding: 13, borderRadius: 12 }}><Text style={{ color: c.error, fontSize: 12, lineHeight: 18 }}>{error}</Text></View> : null}
          <Pressable disabled={loading} onPress={() => void handleLogin()} style={{ backgroundColor: c.lime, marginTop: 27, height: 55, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? .7 : 1 }}>
            {loading ? <ActivityIndicator color={c.onLime}/> : <><Text style={{ color: c.onLime, fontSize: 15, fontWeight: '800' }}>Entrar no sistema</Text><Ionicons name="arrow-forward" size={19} color={c.onLime}/></>}
          </Pressable>
          <Text style={{ textAlign: 'center', color: c.muted, marginTop: 25, fontSize: 11, lineHeight: 17 }}>Acesso individual e protegido. Para recuperar sua senha, solicite ao administrador.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
