import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMFTheme } from '@/contexts/MFThemeContext';
import { listAssessments } from '@/services/assessments';
import type { Assessment } from '@/types/assessment';

export default function ReportsScreen() {
  const { colors: c, desktop } = useMFTheme();
  const [items, setItems] = useState<Assessment[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const response = await listAssessments({ status: 'completed', page: 1 });
      setItems(response.data ?? []); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar relatórios.'); }
    finally { setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const displayed = items.filter(x => !search.trim() || x.student.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ maxWidth: 1180, width: '100%', alignSelf: 'center', padding: desktop ? 34 : 20, paddingBottom: 48 }}>
      <Text style={{ color: c.greenText, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 }}>DOCUMENTOS & ACOMPANHAMENTO</Text>
      <Text style={{ color: c.ink, fontFamily: 'Manrope', fontSize: desktop ? 31 : 27, fontWeight: '800', marginTop: 9 }}>Relatórios</Text>
      <Text style={{ color: c.muted, fontSize: 12, marginTop: 7, marginBottom: 22 }}>Consulte relatórios de avaliações concluídas e autorizadas.</Text>
      <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: 14, backgroundColor: c.surface, height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10, marginBottom: 20 }}><Ionicons name="search-outline" size={20} color={c.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="Buscar pelo nome do aluno" placeholderTextColor={c.muted} style={{ flex: 1, minWidth: 0, color: c.ink, fontSize: 13 }} /></View>
      {error ? <Pressable onPress={() => void refresh()} style={{ backgroundColor: c.errorSoft, padding: 14, borderRadius: 13, marginBottom: 12 }}><Text style={{ color: c.error }}>{error} · Tentar novamente</Text></Pressable> : null}
      {busy ? <ActivityIndicator color={c.lime} size="large"/> : displayed.length === 0 ? <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: 19, backgroundColor: c.surface, padding: 28, alignItems: 'center', gap: 13 }}><Ionicons name="document-text-outline" color={c.greenText} size={35}/><Text style={{ color: c.ink, fontWeight: '800', fontSize: 16 }}>Nenhum relatório encontrado</Text><Text style={{ color: c.muted, fontSize: 12, textAlign: 'center' }}>Conclua uma avaliação para poder consultar os relatórios.</Text></View> : displayed.map(item => (
        <Pressable key={item.uuid} onPress={() => router.push({ pathname: '/(app)/students/[uuid]/assessment-reports', params: { uuid: item.student.uuid } })} style={{ padding: 17, borderWidth: 1, borderColor: c.border, borderRadius: 17, backgroundColor: c.surface, marginBottom: 11, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ backgroundColor: c.greenSoft, height: 43, width: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="document-text-outline" color={c.greenText} size={21}/></View>
          <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontWeight: '800', fontSize: 14 }}>{item.student.name}</Text><Text style={{ color: c.muted, marginTop: 5, fontSize: 11 }}>Avaliação de {item.evaluation_date.split('-').reverse().join('/')} · {item.status_label ?? 'Concluída'}</Text></View>
          <Ionicons name="chevron-forward" color={c.muted} size={20}/>
        </Pressable>
      ))}
      <Text style={{ color: c.muted, fontSize: 10, marginTop: 17, lineHeight: 16 }}>A listagem exibe a primeira página de avaliações concluídas autorizadas. Novas páginas podem ser consultadas pela lista geral de avaliações.</Text>
    </ScrollView>
  );
}
