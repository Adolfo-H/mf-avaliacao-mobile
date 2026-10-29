import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import {
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listStudentAssessmentHistory } from '@/services/assessment-history';
import type {
  StudentAssessmentHistoryEntry,
  StudentAssessmentHistoryResponse,
} from '@/types/assessment-history';
import type { AssessmentStatus } from '@/types/assessment';

type Filter = 'all' | AssessmentStatus;

function formatDate(date: string | null): string {
  if (!date) return 'Data não informada';

  const parts = date.split('-');
  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatNumber(
  value: number | null,
  digits = 1
): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatProtocol(key: string | null): string {
  if (!key) return 'Não informado';

  const labels: Record<string, string> = {
    pollock_7: 'Pollock 7 dobras',
    pollock_3: 'Pollock 3 dobras',
    guedes_3: 'Guedes 3 dobras',
    bioimpedance: 'Bioimpedância',
    weltman: 'Weltman',
  };

  return labels[key] ?? key;
}

function getUuid(value?: string | string[]): string | null {
  const uuid = Array.isArray(value) ? value[0] : value;
  return uuid?.trim() || null;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function HistoryCard({
  item,
}: {
  item: StudentAssessmentHistoryEntry;
}) {
  const isCompleted = item.status === 'completed';

  return (
    <Pressable
      style={styles.historyCard}
      onPress={() =>
        router.push({
          pathname: '/(app)/assessments/[uuid]',
          params: { uuid: item.uuid },
        })
      }
    >
      <View style={styles.historyHeader}>
        <View style={styles.historyHeaderInfo}>
          <Text style={styles.historyDate}>
            {formatDate(item.evaluation_date)}
          </Text>
          <Text style={styles.evaluatorText}>
            {item.evaluator.name || 'Avaliador não informado'}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            isCompleted ? styles.completedPill : styles.draftPill,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isCompleted
                ? styles.completedStatusText
                : styles.draftStatusText,
            ]}
          >
            {item.status_label || (isCompleted ? 'Concluída' : 'Rascunho')}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Peso" value={
          item.weight_kg === null
            ? '—'
            : `${formatNumber(item.weight_kg, 2)} kg`
        } />
        <Metric label="Altura" value={
          item.height_m === null
            ? '—'
            : `${formatNumber(item.height_m, 2)} m`
        } />
        <Metric label="IMC" value={formatNumber(item.bmi, 2)} />
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Gordura" value={
          item.body_fat_percentage === null
            ? '—'
            : `${formatNumber(item.body_fat_percentage, 2)}%`
        } />
        <Metric
          label="Idade na avaliação"
          value={
            item.age_at_evaluation === null
              ? '—'
              : `${item.age_at_evaluation} anos`
          }
        />
      </View>

      <Text style={styles.protocolText}>
        Protocolo: {formatProtocol(item.protocol)}
      </Text>

      <View style={styles.cardBottom}>
        <Text style={styles.progressText}>
          {item.progress.completed}/{item.progress.total} seções concluídas
        </Text>
        <View style={styles.detailAction}>
          <Text style={styles.detailActionText}>
            Ver avaliação
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#40856C"
          />
        </View>
      </View>
    </Pressable>
  );
}

const filters: { key: Filter; title: string }[] = [
  { key: 'all', title: 'Todas' },
  { key: 'completed', title: 'Concluídas' },
  { key: 'draft', title: 'Rascunhos' },
];

export default function StudentAssessmentHistoryScreen() {
  const params = useLocalSearchParams<{
    uuid?: string | string[];
  }>();
  const studentUuid = getUuid(params.uuid);

  const [filter, setFilter] = useState<Filter>('all');
  const [data, setData] = useState<StudentAssessmentHistoryEntry[]>([]);
  const [meta, setMeta] = useState<
    StudentAssessmentHistoryResponse['meta'] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(
    async (
      page: number,
      selectedFilter: Filter,
      isRefresh = false
    ) => {
      const id = ++requestId.current;
      if (!studentUuid) {
        setError('Aluno inválido.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError('');

        const response = await listStudentAssessmentHistory(studentUuid, {
          page,
          per_page: 10,
          status: selectedFilter === 'all' ? undefined : selectedFilter,
        });

        if (id !== requestId.current) return;

        setData(response.data);
        setMeta(response.meta);
      } catch (exception) {
        if (id !== requestId.current) return;
        setError(
          exception instanceof Error
            ? exception.message
            : 'Não foi possível carregar o histórico.'
        );
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [studentUuid]
  );

  useFocusEffect(
    useCallback(() => {
      void load(1, filter);

      return () => {
        requestId.current += 1;
      };
    }, [load, filter])
  );

  const currentPage = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void load(currentPage, filter, true);
            }}
          />
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#123C47" />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.eyebrow}>ALUNO</Text>
            <Text style={styles.headerTitle}>Histórico de avaliações</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Consulte avaliações anteriores e acompanhe os indicadores registrados.
        </Text>

        <Pressable
          style={styles.evolutionShortcut}
          onPress={() => {
            if (!studentUuid) return;
            router.push({
              pathname: '/(app)/students/[uuid]/assessment-evolution',
              params: { uuid: studentUuid },
            });
          }}
        >
          <View style={styles.evolutionShortcutIcon}>
            <Ionicons name="stats-chart-outline" size={21} color="#40856C" />
          </View>
          <View style={styles.evolutionShortcutText}>
            <Text style={styles.evolutionShortcutTitle}>Gráficos de evolução</Text>
            <Text style={styles.evolutionShortcutDescription}>
              Peso, IMC, RCQ e perímetros por data
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color="#40856C" />
        </Pressable>

        <Pressable
          style={styles.photoComparisonShortcut}
          onPress={() => {
            if (!studentUuid) return;
            router.push({
              pathname: '/(app)/students/[uuid]/assessment-photo-comparison',
              params: { uuid: studentUuid },
            });
          }}
        >
          <View style={styles.photoComparisonIcon}>
            <Ionicons name="images-outline" size={21} color="#40856C" />
          </View>
          <View style={styles.photoComparisonText}>
            <Text style={styles.photoComparisonTitle}>Comparar fotografias</Text>
            <Text style={styles.photoComparisonDescription}>
              Veja fotos de duas avaliações lado a lado
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color="#40856C" />
        </Pressable>

        <Pressable
          style={styles.reportShortcut}
          onPress={() => {
            if (!studentUuid) return;
            router.push({
              pathname: '/(app)/students/[uuid]/assessment-reports',
              params: { uuid: studentUuid },
            });
          }}
        >
          <View style={styles.reportShortcutIcon}>
            <Ionicons name="document-text-outline" size={21} color="#40856C" />
          </View>
          <View style={styles.reportShortcutText}>
            <Text style={styles.reportShortcutTitle}>Relatório em PDF</Text>
            <Text style={styles.reportShortcutDescription}>
              Gere e visualize o relatório de uma avaliação concluída
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color="#40856C" />
        </Pressable>

        <Pressable
          style={styles.comparisonShortcut}
          onPress={() => {
            if (!studentUuid) return;
            router.push({
              pathname: '/(app)/students/[uuid]/assessment-comparison',
              params: { uuid: studentUuid },
            });
          }}
        >
          <View style={styles.comparisonShortcutIcon}>
            <Ionicons name="git-compare-outline" size={21} color="#40856C" />
          </View>
          <View style={styles.comparisonShortcutText}>
            <Text style={styles.comparisonShortcutTitle}>
              Comparar duas avaliações
            </Text>
            <Text style={styles.comparisonShortcutDescription}>
              Veja as diferenças de peso, IMC e medidas
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color="#40856C" />
        </Pressable>

        <View style={styles.filtersRow}>
          {filters.map(option => (
            <Pressable
              key={option.key}
              onPress={() => setFilter(option.key)}
              style={[
                styles.filterButton,
                filter === option.key && styles.filterButtonActive,
              ]}
            >
              <Text style={[
                styles.filterText,
                filter === option.key && styles.filterTextActive,
              ]}>
                {option.title}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={23} color="#AE4B4B" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void load(currentPage, filter)}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color="#40856C" />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        ) : !error && data.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color="#82928E" />
            <Text style={styles.emptyTitle}>Nenhuma avaliação encontrada</Text>
            <Text style={styles.emptyText}>
              Não existem avaliações disponíveis para este filtro.
            </Text>
          </View>
        ) : !error ? (
          <>
            <Text style={styles.countText}>
              {meta?.total ?? 0} avaliação(ões) encontrada(s)
            </Text>
            {data.map(item => (
              <HistoryCard key={item.uuid} item={item} />
            ))}

            {lastPage > 1 ? (
              <View style={styles.pagination}>
                <Pressable
                  style={[
                    styles.pageButton,
                    currentPage <= 1 && styles.pageButtonDisabled,
                  ]}
                  disabled={currentPage <= 1 || loading}
                  onPress={() => void load(currentPage - 1, filter)}
                >
                  <Ionicons name="chevron-back" size={18} color="#123C47" />
                  <Text style={styles.pageButtonText}>Anterior</Text>
                </Pressable>

                <Text style={styles.pageLabel}>
                  {currentPage} / {lastPage}
                </Text>

                <Pressable
                  style={[
                    styles.pageButton,
                    currentPage >= lastPage && styles.pageButtonDisabled,
                  ]}
                  disabled={currentPage >= lastPage || loading}
                  onPress={() => void load(currentPage + 1, filter)}
                >
                  <Text style={styles.pageButtonText}>Próxima</Text>
                  <Ionicons name="chevron-forward" size={18} color="#123C47" />
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}

        <Pressable
          style={styles.newAssessmentButton}
          onPress={() => router.push('/(app)/assessments/new')}
        >
          <Ionicons name="add-circle-outline" size={19} color="#FFFFFF" />
          <Text style={styles.newAssessmentText}>Nova avaliação</Text>
        </Pressable>
        <Text style={styles.footerNote}>
          Resultados ainda não calculados aparecem como “—”.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8F6' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 44 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  backButton: {
    width: 44, height: 44, backgroundColor: '#FFFFFF',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: { flex: 1 },
  eyebrow: { color: '#40856C', fontSize: 10, fontWeight: '800' },
  headerTitle: { color: '#172D34', fontSize: 21, fontWeight: '800' },
  description: {
    fontSize: 12, color: '#66787A', lineHeight: 19, marginBottom: 17,
  },
  evolutionShortcut: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15,
    borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1,
    borderColor: '#D6E5DC', marginBottom: 11,
  },
  evolutionShortcutIcon: {
    backgroundColor: '#EAF3EF', width: 43, height: 43, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  evolutionShortcutText: { flex: 1 },
  evolutionShortcutTitle: { color: '#172D34', fontSize: 13, fontWeight: '800' },
  evolutionShortcutDescription: { color: '#748589', marginTop: 4, fontSize: 10 },
  photoComparisonShortcut: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15,
    borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1,
    borderColor: '#D6E5DC', marginBottom: 11,
  },
  photoComparisonIcon: {
    backgroundColor: '#EAF3EF', width: 43, height: 43, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  photoComparisonText: { flex: 1 },
  photoComparisonTitle: { color: '#172D34', fontSize: 13, fontWeight: '800' },
  photoComparisonDescription: { color: '#748589', marginTop: 4, fontSize: 10 },
  reportShortcut: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#D6E5DC', backgroundColor: '#FFFFFF',
    borderRadius: 17, padding: 15, marginBottom: 11,
  },
  reportShortcutIcon: {
    backgroundColor: '#EAF3EF', width: 43, height: 43, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  reportShortcutText: { flex: 1 },
  reportShortcutTitle: { color: '#172D34', fontSize: 13, fontWeight: '800' },
  reportShortcutDescription: { color: '#748589', marginTop: 4, fontSize: 10 },
  comparisonShortcut: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15,
    borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1,
    borderColor: '#D6E5DC', marginBottom: 17,
  },
  comparisonShortcutIcon: {
    backgroundColor: '#EAF3EF', width: 43, height: 43, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  comparisonShortcutText: { flex: 1 },
  comparisonShortcutTitle: { color: '#172D34', fontSize: 13, fontWeight: '800' },
  comparisonShortcutDescription: { color: '#748589', marginTop: 4, fontSize: 10 },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  filterButton: {
    backgroundColor: '#FFFFFF', borderColor: '#E3E9E6', borderWidth: 1,
    paddingVertical: 10, paddingHorizontal: 11, borderRadius: 12,
  },
  filterButtonActive: { backgroundColor: '#40856C', borderColor: '#40856C' },
  filterText: { color: '#718084', fontWeight: '700', fontSize: 11 },
  filterTextActive: { color: '#FFFFFF' },
  countText: { color: '#718084', fontSize: 11, marginBottom: 12 },
  historyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 22,
    borderWidth: 1, borderColor: '#E4E9E7', padding: 17,
    marginBottom: 13,
  },
  historyHeader: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  historyHeaderInfo: { flex: 1 },
  historyDate: { color: '#172D34', fontSize: 16, fontWeight: '800' },
  evaluatorText: { color: '#718084', fontSize: 11, marginTop: 3 },
  statusPill: {
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  completedPill: { backgroundColor: '#EAF5EE' },
  draftPill: { backgroundColor: '#FFF4DE' },
  statusText: { fontSize: 10, fontWeight: '800' },
  completedStatusText: { color: '#40856C' },
  draftStatusText: { color: '#9A6F2C' },
  metricsRow: { flexDirection: 'row', gap: 9, marginBottom: 13 },
  metric: { flex: 1 },
  metricLabel: { fontSize: 10, color: '#829095', marginBottom: 3 },
  metricValue: { fontSize: 12, fontWeight: '800', color: '#172D34' },
  protocolText: { color: '#647679', fontSize: 11, marginTop: 3 },
  cardBottom: {
    marginTop: 14, paddingTop: 12, borderTopWidth: 1,
    borderTopColor: '#EEF2F0', flexDirection: 'row', gap: 9,
    alignItems: 'center', justifyContent: 'space-between',
  },
  progressText: { color: '#78888B', fontSize: 10, flex: 1 },
  detailAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailActionText: { color: '#40856C', fontWeight: '800', fontSize: 11 },
  pagination: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginVertical: 15,
  },
  pageButton: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    padding: 10, borderRadius: 12, backgroundColor: '#FFFFFF',
  },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { fontWeight: '700', fontSize: 11, color: '#123C47' },
  pageLabel: { color: '#66787A', fontWeight: '700', fontSize: 12 },
  centerBlock: { alignItems: 'center', paddingVertical: 60, gap: 11 },
  loadingText: { color: '#66787A', fontSize: 12 },
  errorCard: {
    backgroundColor: '#FFF2F0', borderRadius: 18, padding: 17,
    marginBottom: 16, alignItems: 'center', gap: 8,
  },
  errorText: { color: '#AE4B4B', fontSize: 12, textAlign: 'center' },
  retryText: { color: '#123C47', fontWeight: '800', fontSize: 12 },
  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 27,
    alignItems: 'center', gap: 9, marginBottom: 18,
  },
  emptyTitle: { color: '#172D34', fontSize: 15, fontWeight: '800' },
  emptyText: { color: '#829095', textAlign: 'center', fontSize: 12 },
  newAssessmentButton: {
    marginTop: 15, backgroundColor: '#123C47', borderRadius: 15,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 8,
  },
  newAssessmentText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  footerNote: { marginTop: 14, textAlign: 'center', color: '#879396', fontSize: 10 },
});
