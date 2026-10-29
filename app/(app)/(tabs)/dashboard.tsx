import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getDashboardSummary } from '@/services/dashboard-summary';
import type { DashboardSummary } from '@/types/dashboard-summary';

function formatAssessmentDate(date: string | null): string {
  if (!date) return 'Sem data';
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}/${month}/${year}` : date;
}

const COLORS = {
  background: '#F7F8F6',
  primary: '#123C47',
  green: '#40856C',
  text: '#172D34',
  muted: '#718084',
  white: '#FFFFFF',
  border: '#E4E9E7',
};

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canViewAssessments = summary?.permissions.can_view_assessments !== false;

  const loadSummary = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await getDashboardSummary();
      setSummary(result);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o painel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadSummary();
  }, [loadSummary]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brandSmall}>MF SAÚDE E MOVIMENTO</Text>
            <Text style={styles.pageTitle}>Avaliação Física</Text>
          </View>

          <View style={styles.avatar}>
            <Ionicons
              name="person-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>PAINEL</Text>

          <Text style={styles.heroTitle}>
            Tudo pronto para a próxima avaliação.
          </Text>

          <Text style={styles.heroDescription}>
            Cadastre alunos, registre avaliações e acompanhe a evolução em um
            único lugar.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            disabled={!canViewAssessments}
            onPress={() =>
              router.push('/(app)/(tabs)/avaliacoes')
            }
          >
            <View style={styles.primaryButtonIcon}>
              <Ionicons
                name="add"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.primaryButtonText}>
              Nova avaliação
            </Text>

            <Ionicons
              name="arrow-forward"
              size={20}
              color={COLORS.white}
            />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Resumo</Text>

        <View style={styles.statsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.statCard,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/(app)/(tabs)/alunos')}
          >
            <View style={styles.statIcon}>
              <Ionicons
                name="people-outline"
                size={22}
                color={COLORS.green}
              />
            </View>

            <Text style={styles.statValue}>
              {loading && !summary ? '...' : (summary?.students.count ?? '—')}
            </Text>
            <Text style={styles.statLabel}>
              {summary?.students.label ?? 'Alunos'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.statCard,
              pressed && styles.pressed,
            ]}
            disabled={!canViewAssessments}
            onPress={() =>
              router.push('/(app)/(tabs)/avaliacoes')
            }
          >
            <View style={styles.statIcon}>
              <Ionicons
                name="clipboard-outline"
                size={22}
                color={COLORS.green}
              />
            </View>

            <Text style={styles.statValue}>
              {loading && !summary ? '...' : (summary?.assessments?.total ?? '—')}
            </Text>
            <Text style={styles.statLabel}>Avaliações</Text>
          </Pressable>
        </View>

        {canViewAssessments && summary?.assessments ? (
          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>Rascunhos: {summary.assessments.draft}</Text>
            </View>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>Concluídas: {summary.assessments.completed}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Acesso rápido</Text>

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/(app)/(tabs)/alunos')}
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="person-add-outline"
              size={22}
              color={COLORS.green}
            />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Cadastrar aluno
            </Text>

            <Text style={styles.actionDescription}>
              Adicione um novo aluno à base da MF.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.muted}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.pressed,
          ]}
          disabled={!canViewAssessments}
            onPress={() =>
            router.push('/(app)/(tabs)/avaliacoes')
          }
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="fitness-outline"
              size={22}
              color={COLORS.green}
            />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Avaliações
            </Text>

            <Text style={styles.actionDescription}>
              Consulte avaliações realizadas ou inicie uma nova.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.muted}
          />
        </Pressable>

        <Text style={styles.sectionTitle}>
          Atividade recente
        </Text>

        {error ? (
          <Pressable style={styles.errorCard} onPress={() => void loadSummary()}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tocar para tentar novamente</Text>
          </Pressable>
        ) : null}

        {!canViewAssessments ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Acesso clínico restrito</Text>
            <Text style={styles.emptyDescription}>
              Este perfil visualiza somente os indicadores administrativos.
            </Text>
          </View>
        ) : summary?.recent && summary.recent.length > 0 ? (
          summary.recent.map(item => (
            <Pressable
              key={item.uuid}
              style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
              onPress={() => router.push({
                pathname: '/(app)/assessments/[uuid]',
                params: { uuid: item.uuid },
              })}
            >
              <View style={styles.recentCardTop}>
                <Text style={styles.recentStudent} numberOfLines={1}>
                  {item.student.name ?? 'Aluno sem nome'}
                </Text>
                <Text style={styles.recentStatus}>{item.status_label}</Text>
              </View>
              <Text style={styles.recentDate}>
                Avaliação de {formatAssessmentDate(item.evaluation_date)}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={26} color={COLORS.green} />
            </View>
            <Text style={styles.emptyTitle}>
              {loading ? 'Carregando avaliações...' : 'Nenhuma avaliação registrada'}
            </Text>
            <Text style={styles.emptyDescription}>
              {loading ? 'Consultando informações atualizadas.' : 'As avaliações mais recentes aparecerão aqui.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  brandSmall: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 5,
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '800',
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    padding: 24,
    marginBottom: 30,
  },

  heroEyebrow: {
    color: '#91C3AE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: 10,
  },

  heroDescription: {
    color: '#C8D5D8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: COLORS.green,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  primaryButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  primaryButtonText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    minHeight: 150,
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#EFF6F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
  },

  statLabel: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },

  actionCard: {
    minHeight: 86,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#EFF6F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  actionContent: {
    flex: 1,
    paddingRight: 10,
  },

  actionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },

  actionDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },

  emptyCard: {
    minHeight: 180,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#EFF6F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },

  emptyDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  statusRow: {
    flexDirection: 'row', gap: 10, marginTop: -18, marginBottom: 28, flexWrap: 'wrap',
  },
  statusChip: {
    backgroundColor: '#EAF3EF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13,
  },
  statusChipText: { color: '#315E4D', fontSize: 12, fontWeight: '700' },
  recentCard: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 17, padding: 16, marginBottom: 10,
  },
  recentCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  recentStudent: { color: COLORS.text, fontWeight: '800', fontSize: 14, flex: 1 },
  recentStatus: { color: COLORS.green, fontSize: 11, fontWeight: '700' },
  recentDate: { marginTop: 6, color: COLORS.muted, fontSize: 12 },
  errorCard: {
    padding: 14, borderRadius: 14, backgroundColor: '#FFF3EF', marginBottom: 12,
  },
  errorText: { color: '#9B4646', fontSize: 12 },
  retryText: { color: COLORS.primary, marginTop: 8, fontWeight: '800', fontSize: 12 },

  pressed: {
    opacity: 0.72,
  },
});