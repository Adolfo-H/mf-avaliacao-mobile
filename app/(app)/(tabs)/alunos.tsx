import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useMFTheme } from '@/contexts/MFThemeContext';
import { MFButton, MFBadge, MFEmpty, MFFilter, MFHeading, MFSearch } from '@/components/MFUI';
import { MFStudentAvatar } from '@/components/MFStudentAvatar';
import { listStudents } from '@/services/students';
import type { Student, StudentStatus } from '@/types/student';

const FILTERS = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'archived', label: 'Arquivados' },
  { value: 'all', label: 'Todos' },
];
type Filter = StudentStatus | 'all';
export default function StudentsScreen() {
  const { colors: c, desktop } = useMFTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('active');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listStudents({ search: query, status: filter === 'all' ? undefined : filter, page });
      setStudents(response.data ?? []);
      setLastPage(response.meta?.last_page ?? 1);
      setTotal(response.meta?.total ?? (response.data ?? []).length);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar os alunos.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [query, filter, page]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  const applySearch = () => { setPage(1); setQuery(search.trim()); };
  const changeFilter = (v: string) => { setPage(1); setFilter(v as Filter); };
  const go = (uuid: string) => router.push({ pathname: '/(app)/students/[uuid]', params: { uuid } });

  return <ScrollView style={{ flex: 1, backgroundColor: c.bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void reload(); }}/>} contentContainerStyle={{ padding: desktop ? 35 : 20, maxWidth: 1280, width: '100%', alignSelf: 'center', paddingBottom: 45 }}>
    <MFHeading eyebrow="CADASTROS & ACOMPANHAMENTO" title="Seus alunos" subtitle="Um lugar para conhecer cada pessoa e acompanhar seus registros." action={<MFButton label="Novo aluno" onPress={() => router.push('/(app)/students/new')}/>} />
    <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 11, marginBottom: 19 }}><MFSearch value={search} onChangeText={setSearch} onSubmit={applySearch} placeholder="Buscar pelo nome do aluno"/><MFFilter values={FILTERS} active={filter} onChange={changeFilter}/></View>
    {error ? <Pressable onPress={() => void reload()} style={{ padding: 15, borderRadius: 12, backgroundColor: c.errorSoft, marginBottom: 14 }}><Text style={{ color: c.error, fontSize: 12 }}>{error} · Tentar novamente</Text></Pressable> : null}
    {!loading ? <Text style={{ color: c.muted, fontSize: 11, marginBottom: 13 }}>{total} {total === 1 ? 'aluno encontrado' : 'alunos encontrados'}</Text> : null}
    {loading ? <ActivityIndicator size="large" color={c.lime} style={{ marginTop: 60 }} /> : students.length === 0 ? <MFEmpty title="Nenhum aluno encontrado" description="Adicione um aluno ou experimente outro filtro para começar." action={<MFButton label="Cadastrar aluno" onPress={() => router.push('/(app)/students/new')}/>}/> : (
      <View style={{ borderRadius: 19, overflow: 'hidden', borderWidth: 1, borderColor: c.border, backgroundColor: c.surface }}>
        {desktop ? <View style={{ height: 51, backgroundColor: c.soft, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}><Text style={{ flex: 2.2, color: c.muted, fontSize: 11, fontWeight: '800' }}>ALUNO</Text><Text style={{ flex: 1.1, color: c.muted, fontSize: 11, fontWeight: '800' }}>CONTATO</Text><Text style={{ flex: .7, color: c.muted, fontSize: 11, fontWeight: '800' }}>IDADE</Text><Text style={{ flex: .8, color: c.muted, fontSize: 11, fontWeight: '800' }}>STATUS</Text><Text style={{ width: 25 }} /></View> : null}
        {students.map((item, i) => <Pressable key={item.uuid} onPress={() => go(item.uuid)} style={{ borderTopWidth: i || desktop ? 1 : 0, borderTopColor: c.border, paddingHorizontal: desktop ? 20 : 15, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ flex: desktop ? 2.2 : 1, flexDirection: 'row', alignItems: 'center', gap: 13 }}><MFStudentAvatar uuid={item.uuid} hasPhoto={item.has_photo} name={item.name} /><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: c.ink, fontWeight: '800', fontSize: 13 }}>{item.name}</Text>{!desktop ? <Text style={{ color: c.muted, marginTop: 6, fontSize: 10 }}>{item.age === null ? 'Idade não informada' : `${item.age} anos`} · {item.archived ? 'Arquivado' : item.active ? 'Ativo' : 'Inativo'}</Text> : <Text style={{ color: c.muted, marginTop: 5, fontSize: 10 }}>{item.contact?.mobile_phone || 'Contato não informado'}</Text>}</View></View>
          {desktop ? <><Text numberOfLines={1} style={{ flex: 1.1, color: c.muted, fontSize: 11 }}>{item.contact?.email || '—'}</Text><Text style={{ flex: .7, color: c.muted, fontSize: 12 }}>{item.age === null ? '—' : `${item.age} anos`}</Text><View style={{ flex: .8 }}><MFBadge label={item.archived ? 'Arquivado' : item.active ? 'Ativo' : 'Inativo'} positive={item.active && !item.archived}/></View></> : null}
          <Ionicons name="chevron-forward" size={19} color={c.muted}/>
        </Pressable>)}
      </View>
    )}
    {!loading && lastPage > 1 ? <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 }}><MFButton label="Anterior" icon="chevron-back" subtle disabled={page <= 1} onPress={() => setPage(x => Math.max(1, x - 1))}/><Text style={{ color: c.muted, fontSize: 12 }}>Página {page} de {lastPage}</Text><MFButton label="Próxima" icon="chevron-forward" subtle disabled={page >= lastPage} onPress={() => setPage(x => Math.min(lastPage, x + 1))}/></View> : null}
  </ScrollView>;
}
