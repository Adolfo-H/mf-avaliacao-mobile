import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { MFBadge, MFButton, MFEmpty, MFFilter, MFHeading, MFSearch } from '@/components/MFUI';
import { MFStudentAvatar } from '@/components/MFStudentAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useMFTheme } from '@/contexts/MFThemeContext';
import { listAssessments } from '@/services/assessments';
import type { Assessment, AssessmentStatus } from '@/types/assessment';

const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'draft', label: 'Em andamento' },
  { value: 'completed', label: 'Concluídas' },
];
type Filter = AssessmentStatus | 'all';
function dateBr(value: string): string {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export default function AssessmentsScreen() {
  const { colors: c, desktop } = useMFTheme();
  const { user } = useAuth();
  const [items, setItems] = useState<Assessment[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const permission = user?.role !== 'reception';

  const reload = useCallback(async () => {
    if (user?.role === 'reception') { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await listAssessments({ search, status: filter === 'all' ? undefined : filter, page });
      setItems(result.data ?? []);
      setTotal(result.meta?.total ?? 0);
      setLastPage(result.meta?.last_page ?? 1);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar as avaliações.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [search, filter, page, user?.role]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  const applySearch = () => { setPage(1); setSearch(input.trim()); };
  const changeFilter = (v: string) => { setFilter(v as Filter); setPage(1); };

  return <ScrollView style={{ flex: 1, backgroundColor: c.bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void reload(); }}/>} contentContainerStyle={{ padding: desktop ? 35 : 20, maxWidth: 1280, alignSelf: 'center', width: '100%', paddingBottom: 50 }}>
    <MFHeading eyebrow="AVALIAÇÃO & EVOLUÇÃO" title="Avaliações" subtitle="Acompanhe o preenchimento, revise registros e consulte históricos." action={permission ? <MFButton label="Nova avaliação" onPress={() => router.push('/(app)/assessments/new')}/> : undefined}/>
    {!permission ? <MFEmpty title="Acesso reservado" description="As avaliações estão disponíveis para administradores e avaliadores autorizados."/> : <>
      <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 11, marginBottom: 20 }}><MFSearch value={input} onChangeText={setInput} onSubmit={applySearch} placeholder="Buscar por aluno ou avaliador"/><MFFilter values={FILTERS} active={filter} onChange={changeFilter}/></View>
      {error ? <Pressable onPress={() => void reload()} style={{ backgroundColor: c.errorSoft, padding: 14, borderRadius: 13, marginBottom: 14 }}><Text style={{ color: c.error, fontSize: 12 }}>{error} · Tentar novamente</Text></Pressable> : null}
      {!loading ? <Text style={{ color: c.muted, fontSize: 11, marginBottom: 13 }}>{total} {total === 1 ? 'avaliação encontrada' : 'avaliações encontradas'}</Text> : null}
      {loading ? <ActivityIndicator size="large" color={c.lime} style={{ marginTop: 64 }}/> : items.length === 0 ? <MFEmpty title="Nenhuma avaliação encontrada" description="Crie uma avaliação ou experimente um filtro diferente." action={<MFButton label="Criar avaliação" onPress={() => router.push('/(app)/assessments/new')}/>}/> : (
        <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: 19, backgroundColor: c.surface, overflow: 'hidden' }}>
          {desktop ? <View style={{ height: 51, flexDirection: 'row', alignItems: 'center', backgroundColor: c.soft, paddingHorizontal: 21 }}><Text style={{ flex: 2.4, color: c.muted, fontSize: 11, fontWeight: '800' }}>AVALIAÇÃO</Text><Text style={{ flex: 1.1, color: c.muted, fontSize: 11, fontWeight: '800' }}>RESPONSÁVEL</Text><Text style={{ flex: .9, color: c.muted, fontSize: 11, fontWeight: '800' }}>SITUAÇÃO</Text><Text style={{ flex: .8, color: c.muted, fontSize: 11, fontWeight: '800' }}>PROGRESSO</Text><Text style={{ width: 25 }} /></View> : null}
          {items.map((item, index) => <Pressable key={item.uuid} onPress={() => router.push({ pathname: '/(app)/assessments/[uuid]', params: { uuid: item.uuid } })} style={{ borderTopWidth: index > 0 || desktop ? 1 : 0, borderTopColor: c.border, padding: desktop ? 21 : 16, flexDirection: desktop ? 'row' : 'column', alignItems: desktop ? 'center' : 'stretch', gap: desktop ? 12 : 10 }}>
            <View style={{ flex: desktop ? 2.4 : undefined, flexDirection: 'row', alignItems: 'center', gap: 11 }}><MFStudentAvatar uuid={item.student.uuid} name={item.student.name} hasPhoto={item.student.has_photo} /><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: c.ink, fontSize: 13, fontWeight: '800' }}>{item.student.name}</Text><Text style={{ color: c.muted, fontSize: 10, marginTop: 5 }}>{dateBr(item.evaluation_date)} · {item.student.age_at_evaluation ?? '—'} anos</Text></View>{!desktop ? <Ionicons name="chevron-forward" size={19} color={c.muted}/> : null}</View>
            <Text numberOfLines={1} style={{ color: c.muted, fontSize: 11, flex: desktop ? 1.1 : undefined }}>{item.evaluator.name}</Text>
            <View style={{ flex: desktop ? .9 : undefined }}><MFBadge label={item.status_label ?? (item.status === 'completed' ? 'Concluída' : 'Rascunho')} positive={item.status === 'completed'}/></View>
            <View style={{ flex: desktop ? .8 : undefined }}><Text style={{ color: c.muted, fontSize: 10, marginBottom: 8 }}>{item.progress.completed} de {item.progress.total} seções</Text><View style={{ backgroundColor: c.soft, height: 6, borderRadius: 99, overflow: 'hidden' }}><View style={{ width: `${Math.max(0,Math.min(100,item.progress.percentage))}%`, height: 6, borderRadius: 99, backgroundColor: c.lime }}/></View></View>
            {desktop ? <Ionicons name="chevron-forward" size={19} color={c.muted}/> : null}
          </Pressable>)}
        </View>
      )}
      {!loading && lastPage > 1 ? <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14 }}><MFButton label="Anterior" icon="chevron-back" subtle disabled={page <= 1} onPress={() => setPage(p => Math.max(1,p-1))}/><Text style={{ color: c.muted, fontSize: 12 }}>{page} de {lastPage}</Text><MFButton label="Próxima" icon="chevron-forward" subtle disabled={page >= lastPage} onPress={() => setPage(p => Math.min(lastPage,p+1))}/></View> : null}
    </>}
  </ScrollView>;
}
