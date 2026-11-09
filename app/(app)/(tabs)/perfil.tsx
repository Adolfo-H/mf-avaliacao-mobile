import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMFTheme } from '@/contexts/MFThemeContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors: c, desktop, preference, setPreference } = useMFTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const role = user?.role === 'admin' ? 'Administrador' : user?.role === 'reception' ? 'Recepção' : 'Avaliador';
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await signOut(); router.replace('/'); }
    finally { setLoggingOut(false); }
  };
  const card = { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 19, padding: 19, marginBottom: 17 } as const;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ maxWidth: 1080, width: '100%', alignSelf: 'center', padding: desktop ? 34 : 20, paddingBottom: 50 }}>
      <Text style={{ color: c.greenText, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>MINHA CONTA</Text>
      <Text style={{ color: c.ink, fontFamily: 'Manrope', fontSize: 29, fontWeight: '800', marginTop: 8, marginBottom: 23 }}>Seu perfil</Text>
      <View style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
        <View style={{ width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: c.greenSoft }}><Ionicons name="person-outline" size={30} color={c.greenText}/></View>
        <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 17, fontWeight: '800' }}>{user?.name ?? 'Usuário'}</Text><Text style={{ color: c.muted, fontSize: 12, marginTop: 6 }}>{user?.email ?? ''}</Text><Text style={{ color: c.greenText, fontSize: 11, fontWeight: '700', marginTop: 7 }}>{role}</Text></View>
      </View>
      <View style={card}>
        <Text style={{ color: c.ink, fontSize: 17, fontWeight: '800', marginBottom: 7 }}>Aparência</Text>
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18, marginBottom: 17 }}>Escolha como prefere visualizar o MF Saúde & Movimento.</Text>
        <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 11 }}>
          {([
            { id: 'light' as const, title: 'Modo claro', icon: 'sunny-outline' as const, description: 'Fundo claro, contraste suave' },
            { id: 'dark' as const, title: 'Modo escuro', icon: 'moon-outline' as const, description: 'Fundo profundo, leitura confortável' },
            { id: 'system' as const, title: 'Automático', icon: 'phone-portrait-outline' as const, description: 'Seguir aparência do aparelho' },
          ]).map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: preference === item.id }} onPress={() => setPreference(item.id)} style={{ flex: 1, minHeight: 75, borderRadius: 14, borderWidth: preference === item.id ? 2 : 1, borderColor: preference === item.id ? c.lime : c.border, backgroundColor: preference === item.id ? c.greenSoft : c.surface, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <Ionicons name={item.icon} size={21} color={preference === item.id ? c.greenText : c.muted}/><View style={{ flex: 1 }}><Text style={{ fontSize: 12, color: c.ink, fontWeight: '800' }}>{item.title}</Text><Text style={{ fontSize: 10, color: c.muted, marginTop: 4 }}>{item.description}</Text></View>{preference === item.id ? <Ionicons name="checkmark-circle" size={19} color={c.greenText}/> : null}
          </Pressable>)}
        </View>
      </View>
      {user?.role === 'admin' ? <Pressable onPress={() => router.push('/(app)/evaluators')} style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 13 }}><Ionicons name="people-outline" size={23} color={c.greenText}/><View style={{ flex: 1 }}><Text style={{ fontSize: 14, fontWeight: '800', color: c.ink }}>Gerenciar equipe</Text><Text style={{ fontSize: 12, marginTop: 4, color: c.muted }}>Cadastrar e editar avaliadores</Text></View><Ionicons name="chevron-forward" color={c.muted} size={20}/></Pressable> : null}
      {user?.role !== 'reception' ? <Pressable onPress={() => router.push('/(app)/reports')} style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 13 }}><Ionicons name="document-text-outline" size={23} color={c.greenText}/><View style={{ flex: 1 }}><Text style={{ fontSize: 14, fontWeight: '800', color: c.ink }}>Relatórios</Text><Text style={{ fontSize: 12, marginTop: 4, color: c.muted }}>Consultar avaliações concluídas e PDFs</Text></View><Ionicons name="chevron-forward" color={c.muted} size={20}/></Pressable> : null}
      <View style={card}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Ionicons name="shield-checkmark-outline" color={c.greenText} size={22}/><View style={{ flex: 1 }}><Text style={{ color: c.ink, fontWeight: '800', fontSize: 13 }}>Sessão protegida</Text><Text style={{ color: c.muted, fontSize: 11, lineHeight: 17, marginTop: 4 }}>O acesso usa sua conta individual, conforme permissões configuradas pela equipe.</Text></View></View></View>
      <Pressable disabled={loggingOut} onPress={() => void logout()} style={{ height: 53, borderRadius: 14, backgroundColor: c.errorSoft, borderColor: c.error, borderWidth: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 }}>
        {loggingOut ? <ActivityIndicator color={c.error}/> : <Ionicons name="log-out-outline" size={20} color={c.error}/>}
        <Text style={{ fontSize: 13, color: c.error, fontWeight: '800' }}>{loggingOut ? 'Saindo...' : 'Sair da conta'}</Text>
      </Pressable>
    </ScrollView>
  );
}
