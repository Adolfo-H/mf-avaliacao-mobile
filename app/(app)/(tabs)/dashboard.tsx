import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMFTheme } from '@/contexts/MFThemeContext';
import { getDashboardSummary } from '@/services/dashboard-summary';
import type { DashboardSummary, DashboardRecentAssessment } from '@/types/dashboard-summary';

function brDate(value: string | null) {
  if (!value) return 'Sem data';
  const [y, m, d] = value.split('-');
  return y && m && d ? `${d}/${m}/${y}` : value;
}

export default function DashboardScreen() {
  const { colors: c, desktop } = useMFTheme();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getDashboardSummary()); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o painel.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const allowed = data?.permissions.can_view_assessments !== false && user?.role !== 'reception';
  const firstDraft = data?.recent.find(item => item.status === 'draft');
  const metric = [
    { name: data?.students.label ?? 'Alunos ativos', value: data?.students.count, icon: 'people-outline' as const, href: '/(app)/(tabs)/alunos' as const, note: 'Base de acompanhamento' },
    { name: 'Avaliações', value: data?.assessments?.total, icon: 'pulse-outline' as const, href: '/(app)/(tabs)/avaliacoes' as const, note: 'Registros da equipe' },
    { name: 'Em andamento', value: data?.assessments?.draft, icon: 'time-outline' as const, href: '/(app)/(tabs)/avaliacoes' as const, note: 'Rascunhos para retomar' },
    { name: 'Concluídas', value: data?.assessments?.completed, icon: 'checkmark-circle-outline' as const, href: '/(app)/(tabs)/avaliacoes' as const, note: 'Registros preservados' },
  ];
  const card: ViewStyle = { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 20, padding: desktop ? 24 : 19 };
  const head = user?.name?.split(' ')[0] ?? 'Equipe';
  const total = data?.assessments?.total ?? 0;
  const done = data?.assessments?.completed ?? 0;
  const pct = total > 0 ? Math.round(100 * done / total) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: desktop ? 34 : 18, maxWidth: 1300, width: '100%', alignSelf: 'center', paddingBottom: 58 }}>
      <Text style={{ color: c.greenText, fontWeight: '800', fontSize: 11, letterSpacing: 1.6, marginBottom: 9 }}>SEU ESPAÇO DE ACOMPANHAMENTO</Text>
      <Text style={{ color: c.ink, fontFamily: 'Manrope', fontWeight: '800', fontSize: desktop ? 31 : 27, letterSpacing: -0.8 }}>Um novo olhar para cada evolução.</Text>
      <Text style={{ marginTop: 9, color: c.muted, fontSize: 13, marginBottom: 26 }}>Olá, {head}. Seu acompanhamento começa aqui.</Text>

      {error ? <Pressable onPress={() => void load()} style={{ ...card, marginBottom: 16, backgroundColor: c.errorSoft }}><Text style={{ color: c.error }}>{error} · Toque para tentar novamente.</Text></Pressable> : null}

      <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 18, marginBottom: 20 }}>
        <View style={{ flex: desktop ? 1.7 : undefined, minHeight: desktop ? 252 : 242, borderRadius: 23, backgroundColor: '#343D5A', overflow: 'hidden', padding: desktop ? 30 : 25, justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: c.lime, fontWeight: '800', fontSize: 10, letterSpacing: 1.7 }}>CADA AVALIAÇÃO CONTA</Text>
            <Text style={{ color: '#FFFFFF', fontSize: desktop ? 30 : 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 10 }}>Cuidar começa\npor conhecer.</Text>
            <Text style={{ color: '#D9E0F0', fontSize: 12, lineHeight: 19, marginTop: 9, maxWidth: 360 }}>Uma visão completa para acompanhar cada pessoa, do primeiro registro à sua evolução.</Text>
          </View>
          <Pressable disabled={!allowed} onPress={() => router.push('/(app)/assessments/new')} style={{ alignSelf: 'flex-start', borderRadius: 13, paddingHorizontal: 19, minHeight: 46, backgroundColor: c.lime, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 9, opacity: allowed ? 1 : .6 }}>
            <Ionicons name="add" color={c.onLime} size={21}/><Text style={{ fontSize: 13, fontWeight: '800', color: c.onLime }}>Nova avaliação</Text>
          </Pressable>
        </View>

        <View style={{ ...card, flex: desktop ? 1 : undefined, minHeight: desktop ? 252 : 174 }}>
          <Text style={{ color: c.ink, fontSize: 15, fontWeight: '800', marginBottom: 22 }}>Continue de onde parou</Text>
          {loading && !data ? <ActivityIndicator color={c.lime} /> : firstDraft && allowed ? (
            <>
              <Text style={{ color: c.ink, fontWeight: '800', fontSize: 14 }}>{firstDraft.student.name ?? 'Avaliação em andamento'}</Text>
              <Text style={{ color: c.muted, fontSize: 11, marginTop: 6, marginBottom: 14 }}>Avaliação de {brDate(firstDraft.evaluation_date)}</Text>
              <Text style={{ color: c.greenText, fontSize: 11, fontWeight: '700', marginBottom: 15 }}>Avaliação ainda em preenchimento</Text>
              <Pressable onPress={() => router.push({ pathname: '/(app)/assessments/[uuid]', params: { uuid: firstDraft.uuid } })} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: c.ink, fontWeight: '800', fontSize: 12 }}>Continuar avaliação →</Text>
              </Pressable>
            </>
          ) : <Text style={{ color: c.muted, fontSize: 13, lineHeight: 20 }}>Não há avaliações em andamento para retomar.</Text>}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        {metric.map(m => <Pressable key={m.name} disabled={m.name !== metric[0].name && !allowed} onPress={() => router.push(m.href)} style={{ ...card, width: desktop ? '23.6%' : '48%', minHeight: desktop ? 138 : 136, padding: 16, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name={m.icon} size={20} color={c.muted} />
            <Text numberOfLines={2} style={{ color: c.muted, flexShrink: 1, fontSize: 11 }}>{m.name}</Text>
          </View>
          <Text style={{ color: c.ink, fontSize: 29, fontWeight: '800' }}>{loading && !data ? '···' : m.value ?? '—'}</Text>
          <Text numberOfLines={1} style={{ color: c.greenText, fontSize: 10, fontWeight: '700' }}>{m.note}</Text>
        </Pressable>)}
      </View>

      <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 18 }}>
        <View style={{ ...card, flex: desktop ? 1.4 : undefined }}>
          <Text style={{ color: c.ink, fontSize: 17, fontWeight: '800' }}>Seu acompanhamento</Text>
          <Text style={{ color: c.muted, marginTop: 5, fontSize: 12 }}>Distribuição das avaliações registradas</Text>
          <Text style={{ color: c.ink, fontSize: 30, fontWeight: '800', marginTop: 28 }}>{total} <Text style={{ fontSize: 12, fontWeight: '500', color: c.muted }}>avaliações</Text></Text>
          <View style={{ marginTop: 19, backgroundColor: c.soft, height: 13, borderRadius: 99, overflow: 'hidden' }}><View style={{ width: `${pct}%`, height: 13, backgroundColor: c.lime, borderRadius: 99 }} /></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}><Text style={{ fontSize: 12, color: c.muted }}>{done} concluídas</Text><Text style={{ fontSize: 12, color: c.greenText, fontWeight: '800' }}>{pct}% concluídas</Text></View>
          <Text style={{ color: c.muted, marginTop: 19, fontSize: 11, lineHeight: 17 }}>Dados reais do sistema. Sem projeções ou histórico mensal inventado.</Text>
        </View>
        <View style={{ ...card, flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}><Text style={{ fontSize: 17, color: c.ink, fontWeight: '800' }}>Avaliações recentes</Text><Pressable onPress={() => router.push('/(app)/(tabs)/avaliacoes')}><Text style={{ color: c.greenText, fontWeight: '800', fontSize: 12 }}>Ver todas</Text></Pressable></View>
          {allowed && data?.recent.length ? data.recent.slice(0, 3).map((item: DashboardRecentAssessment) => <Pressable key={item.uuid} onPress={() => router.push({ pathname: '/(app)/assessments/[uuid]', params: { uuid: item.uuid } })} style={{ padding: 14, marginBottom: 9, borderWidth: 1, borderColor: c.border, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 39, height: 39, borderRadius: 13, backgroundColor: c.greenSoft, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="person-outline" color={c.greenText} size={19}/></View>
            <View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: c.ink, fontSize: 12, fontWeight: '800' }}>{item.student.name ?? 'Aluno'}</Text><Text style={{ color: c.muted, marginTop: 4, fontSize: 10 }}>{brDate(item.evaluation_date)} · {item.status_label}</Text></View>
            <Ionicons name="chevron-forward" size={17} color={c.muted}/>
          </Pressable>) : <Text style={{ color: c.muted, fontSize: 12 }}>Sem avaliações recentes para mostrar.</Text>}
        </View>
      </View>
    </ScrollView>
  );
}
