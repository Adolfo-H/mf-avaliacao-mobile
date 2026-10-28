import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
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

import { getStudentAssessmentComparison } from '@/services/assessment-comparison';
import { listStudentAssessmentHistory } from '@/services/assessment-history';
import type {
  AssessmentComparisonResponse,
  ComparisonMetric,
} from '@/types/assessment-comparison';
import type { StudentAssessmentHistoryEntry } from '@/types/assessment-history';

type ComparisonData = AssessmentComparisonResponse['data'];

const PER_PAGE = 20;

function formatDate(value: string | null): string {
  if (!value) return 'Sem data';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function numberText(value: number | null, decimals = 2): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function measureText(value: number | null, unit: string | null, digits: number): string {
  if (value === null) return '—';
  return `${numberText(value, digits)}${unit ? ` ${unit}` : ''}`;
}

function variationText(metric: ComparisonMetric): string {
  const { delta, unit } = metric;
  if (delta === null) return 'Não disponível';
  const digits = metric.key === 'waist_to_hip_ratio' ? 4 : 2;
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${numberText(delta, digits)}${unit ? ` ${unit}` : ''}`;
}

function ComparisonBar({
  value,
  maxValue,
  isNew,
}: {
  value: number;
  maxValue: number;
  isNew: boolean;
}) {
  const ratio = maxValue > 0 ? Math.min(100, Math.max(0, (100 * value) / maxValue)) : 0;
  const width = `${ratio}%` as `${number}%`;

  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          isNew ? styles.newBar : styles.oldBar,
          { width },
        ]}
      />
    </View>
  );
}

function MetricCard({ metric }: { metric: ComparisonMetric }) {
  const digits = metric.key === 'waist_to_hip_ratio' ? 4 : 2;
  const showBars =
    metric.base !== null &&
    metric.target !== null &&
    metric.base >= 0 &&
    metric.target >= 0;
  const maxValue = Math.max(metric.base ?? 0, metric.target ?? 0);

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{metric.label}</Text>
        <Text style={styles.metricChange}>
          Variação: {variationText(metric)}
        </Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricSideLabel}>Anterior</Text>
        <Text style={styles.metricValue}>
          {measureText(metric.base, metric.unit, digits)}
        </Text>
      </View>
      {showBars ? (
        <ComparisonBar value={metric.base!} maxValue={maxValue} isNew={false} />
      ) : null}

      <View style={[styles.metricRow, styles.secondMetricRow]}>
        <Text style={styles.metricSideLabel}>Mais recente</Text>
        <Text style={styles.metricValue}>
          {measureText(metric.target, metric.unit, digits)}
        </Text>
      </View>
      {showBars ? (
        <ComparisonBar value={metric.target!} maxValue={maxValue} isNew />
      ) : null}
    </View>
  );
}

export default function StudentAssessmentComparisonScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();
  const studentUuid = Array.isArray(params.uuid)
    ? params.uuid[0]
    : params.uuid;

  const [items, setItems] = useState<StudentAssessmentHistoryEntry[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');
  const [comparisonError, setComparisonError] = useState('');
  const requestCounter = useRef(0);

  const loadHistory = useCallback(
    async (requestedPage: number, append = false, refresh = false) => {
      const id = ++requestCounter.current;

      if (!studentUuid) {
        setError('Identificação do aluno inválida.');
        setLoading(false);
        return;
      }

      try {
        if (append) setLoadingMore(true);
        else if (refresh) setRefreshing(true);
        else setLoading(true);

        setError('');
        const response = await listStudentAssessmentHistory(studentUuid, {
          page: requestedPage,
          per_page: PER_PAGE,
          status: 'completed',
        });

        if (id !== requestCounter.current) return;

        setItems(previous => {
          if (!append) return response.data;
          const known = new Set(previous.map(item => item.uuid));
          return [
            ...previous,
            ...response.data.filter(item => !known.has(item.uuid)),
          ];
        });
        setPage(response.meta.current_page);
        setLastPage(response.meta.last_page);
      } catch (exception) {
        if (id !== requestCounter.current) return;
        setError(
          exception instanceof Error
            ? exception.message
            : 'Não foi possível carregar avaliações concluídas.'
        );
      } finally {
        if (id === requestCounter.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [studentUuid]
  );

  useFocusEffect(
    useCallback(() => {
      setSelection([]);
      setComparison(null);
      setComparisonError('');
      void loadHistory(1);

      return () => {
        requestCounter.current += 1;
      };
    }, [loadHistory])
  );

  function toggleSelection(uuid: string) {
    if (comparing) return;

    setComparison(null);
    setComparisonError('');
    setSelection(current => {
      if (current.includes(uuid)) return current.filter(value => value !== uuid);
      if (current.length >= 2) return [uuid];
      return [...current, uuid];
    });
  }

  async function handleCompare() {
    if (!studentUuid || selection.length !== 2 || comparing) return;

    try {
      setComparing(true);
      setComparisonError('');
      const result = await getStudentAssessmentComparison(
        studentUuid,
        selection[0],
        selection[1]
      );
      setComparison(result);
    } catch (exception) {
      setComparison(null);
      setComparisonError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível comparar as avaliações.'
      );
    } finally {
      setComparing(false);
    }
  }

  function refresh() {
    if (comparing) return;
    setSelection([]);
    setComparison(null);
    setComparisonError('');
    void loadHistory(1, false, true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#123C47" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>EVOLUÇÃO DO ALUNO</Text>
            <Text style={styles.heading}>Comparar avaliações</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Escolha duas avaliações concluídas. A comparação é feita da mais
          antiga para a mais recente, independentemente da ordem escolhida.
        </Text>

        <View style={styles.selectionCounter}>
          <Ionicons name="checkmark-circle-outline" color="#40856C" size={18} />
          <Text style={styles.selectionLabel}>
            {selection.length} de 2 avaliações selecionadas
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadHistory(1)}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#40856C" />
            <Text style={styles.muted}>Carregando avaliações...</Text>
          </View>
        ) : error ? null : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={29} color="#718084" />
            <Text style={styles.emptyTitle}>Ainda não há avaliações concluídas</Text>
            <Text style={styles.muted}>
              Conclua pelo menos duas avaliações para comparar resultados.
            </Text>
          </View>
        ) : (
          items.map(item => {
            const selectedIndex = selection.indexOf(item.uuid);
            const selected = selectedIndex >= 0;
            return (
              <Pressable
                key={item.uuid}
                onPress={() => toggleSelection(item.uuid)}
                disabled={comparing}
                style={[styles.assessmentCard, selected && styles.selectedCard]}
              >
                <View style={styles.assessmentIcon}>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    color={selected ? '#40856C' : '#889898'}
                    size={25}
                  />
                </View>
                <View style={styles.assessmentInfo}>
                  <Text style={styles.assessmentDate}>
                    {formatDate(item.evaluation_date)}
                  </Text>
                  <Text style={styles.muted}>
                    {item.evaluator.name || 'Avaliador não informado'}
                  </Text>
                  <Text style={styles.assessmentSummary}>
                    Peso: {measureText(item.weight_kg, 'kg', 2)}  ·  IMC: {numberText(item.bmi)}
                  </Text>
                </View>
                {selected ? (
                  <Text style={styles.indexLabel}>{selectedIndex + 1}</Text>
                ) : null}
              </Pressable>
            );
          })
        )}

        {!loading && !error && page < lastPage ? (
          <Pressable
            style={styles.loadMore}
            disabled={loadingMore}
            onPress={() => void loadHistory(page + 1, true)}
          >
            {loadingMore ? (
              <ActivityIndicator color="#123C47" />
            ) : (
              <Text style={styles.loadMoreText}>Carregar mais avaliações</Text>
            )}
          </Pressable>
        ) : null}

        <Pressable
          disabled={selection.length !== 2 || comparing}
          onPress={() => void handleCompare()}
          style={[
            styles.compareButton,
            (selection.length !== 2 || comparing) && styles.disabledButton,
          ]}
        >
          {comparing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="git-compare-outline" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.compareButtonText}>
            {comparing ? 'Comparando...' : 'Comparar selecionadas'}
          </Text>
        </Pressable>

        {comparisonError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{comparisonError}</Text>
          </View>
        ) : null}

        {comparison ? (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>Resultado da comparação</Text>
            <View style={styles.periodCard}>
              <View style={styles.periodColumn}>
                <Text style={styles.periodLabel}>ANTERIOR</Text>
                <Text style={styles.periodDate}>
                  {formatDate(comparison.base.evaluation_date)}
                </Text>
                <Text style={styles.muted}>{comparison.base.evaluator.name || '—'}</Text>
              </View>
              <Ionicons name="arrow-forward-outline" size={20} color="#718084" />
              <View style={styles.periodColumn}>
                <Text style={styles.periodLabel}>MAIS RECENTE</Text>
                <Text style={styles.periodDate}>
                  {formatDate(comparison.target.evaluation_date)}
                </Text>
                <Text style={styles.muted}>{comparison.target.evaluator.name || '—'}</Text>
              </View>
            </View>
            {comparison.metrics.map(metric => (
              <MetricCard key={metric.key} metric={metric} />
            ))}
            <Text style={styles.notice}>{comparison.note}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8F6' },
  content: { paddingHorizontal: 19, paddingTop: 17, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 },
  headerText: { flex: 1 },
  backButton: {
    backgroundColor: '#FFFFFF', borderRadius: 14, height: 44, width: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { color: '#40856C', fontSize: 10, fontWeight: '800' },
  heading: { color: '#172D34', fontSize: 21, fontWeight: '800' },
  description: { color: '#6E8082', fontSize: 12, lineHeight: 19, marginBottom: 16 },
  selectionCounter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E9F2ED', borderRadius: 14, padding: 14, marginBottom: 15,
  },
  selectionLabel: { color: '#336B55', fontSize: 12, fontWeight: '800' },
  assessmentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderWidth: 1, borderColor: '#E5EBE7', backgroundColor: '#FFFFFF',
    borderRadius: 16, marginBottom: 10,
  },
  selectedCard: { borderColor: '#40856C', backgroundColor: '#F1F8F4' },
  assessmentIcon: { width: 28 },
  assessmentInfo: { flex: 1, gap: 3 },
  assessmentDate: { fontSize: 15, color: '#172D34', fontWeight: '800' },
  assessmentSummary: { fontSize: 11, color: '#60777A', marginTop: 3 },
  indexLabel: { color: '#40856C', fontSize: 15, fontWeight: '800' },
  muted: { fontSize: 11, color: '#718084' },
  loadingBox: { alignItems: 'center', gap: 12, paddingVertical: 35 },
  emptyBox: {
    padding: 25, alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#172D34', textAlign: 'center' },
  loadMore: { padding: 14, borderRadius: 13, alignItems: 'center', marginVertical: 12 },
  loadMoreText: { color: '#123C47', fontSize: 12, fontWeight: '800' },
  compareButton: {
    backgroundColor: '#123C47', borderRadius: 16, padding: 16,
    marginVertical: 18, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 9,
  },
  disabledButton: { opacity: 0.46 },
  compareButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  errorBox: {
    borderRadius: 16, padding: 16, backgroundColor: '#FFF0EE',
    alignItems: 'center', gap: 9, marginBottom: 15,
  },
  errorText: { color: '#A34444', fontSize: 12, textAlign: 'center' },
  retryText: { color: '#123C47', fontSize: 12, fontWeight: '800' },
  results: { gap: 12, marginTop: 10 },
  resultsTitle: { color: '#172D34', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  periodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#FFFFFF', borderRadius: 17, padding: 14,
  },
  periodColumn: { flex: 1, gap: 5 },
  periodLabel: { color: '#7B898A', fontSize: 9, fontWeight: '800' },
  periodDate: { color: '#172D34', fontSize: 13, fontWeight: '800' },
  metricCard: { borderRadius: 17, backgroundColor: '#FFFFFF', padding: 16 },
  metricHeader: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 9,
    alignItems: 'center', marginBottom: 12,
  },
  metricTitle: { flex: 1, fontSize: 14, color: '#172D34', fontWeight: '800' },
  metricChange: { fontSize: 11, color: '#63777B', fontWeight: '700' },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  secondMetricRow: { marginTop: 10 },
  metricSideLabel: { color: '#7C8B8E', fontSize: 11 },
  metricValue: { color: '#172D34', fontSize: 12, fontWeight: '800' },
  barTrack: { height: 8, borderRadius: 7, backgroundColor: '#EAF0EF', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 7 },
  oldBar: { backgroundColor: '#9DB5B5' },
  newBar: { backgroundColor: '#40856C' },
  notice: { color: '#718084', fontSize: 11, lineHeight: 18, marginTop: 5 },
});
