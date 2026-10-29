import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Fragment, useCallback, useRef, useState } from 'react';
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

import { getStudentAssessmentEvolution } from '@/services/assessment-evolution';
import type {
  EvolutionMetric,
  EvolutionMetricGroup,
  EvolutionPeriodMonths,
  EvolutionPoint,
  StudentAssessmentEvolutionData,
} from '@/types/assessment-evolution';

const COLOR = {
  background: '#F7F8F6',
  card: '#FFFFFF',
  dark: '#123C47',
  text: '#172D34',
  green: '#40856C',
  pale: '#EAF3EF',
  muted: '#718084',
  border: '#E1E9E4',
  orange: '#E37747',
};

const GROUPS: { key: EvolutionMetricGroup; title: string }[] = [
  { key: 'body', title: 'Composição' },
  { key: 'circumference', title: 'Perímetros' },
  { key: 'ratio', title: 'Índices' },
];
const PERIODS: EvolutionPeriodMonths[] = [3, 6, 12];

function dateLabel(iso: string | null): string {
  if (!iso) return 'Sem data';
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}/${month}/${year}` : iso;
}

function shortDate(iso: string | null): string {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}/${month}` : iso;
}

function formatted(value: number | null, digits: number, unit: string | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const number = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
  return unit ? `${number} ${unit}` : number;
}

function numberWithSign(value: number | null, metric: EvolutionMetric): string {
  if (value === null) return 'Indisponível';
  const text = formatted(value, metric.digits, metric.unit);
  return value > 0 ? `+${text}` : text;
}

function validPoints(metric: EvolutionMetric): (EvolutionPoint & { value: number })[] {
  return metric.points.filter(
    (point): point is EvolutionPoint & { value: number } =>
      point.value !== null && Number.isFinite(point.value)
  );
}

/**
 * Gráfico de linhas sem dependência externa. Não liga pontos separados
 * por avaliações sem medida e jamais transforma ausência de medida em zero.
 */
function EvolutionLineChart({ metric }: { metric: EvolutionMetric }) {
  const observations = metric.points;
  const valid = validPoints(metric);
  if (valid.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Ionicons name="analytics-outline" size={31} color="#93ABA4" />
        <Text style={styles.emptyTitle}>Nenhuma medição disponível</Text>
        <Text style={styles.mutedCenter}>
          Este indicador ainda não possui resultados registrados no período.
        </Text>
      </View>
    );
  }

  const SPACE = 76;
  const LEFT = 36;
  const TOP = 24;
  const DRAW_HEIGHT = 146;
  const width = Math.max(312, LEFT * 2 + (observations.length - 1) * SPACE);
  const values = valid.map(point => point.value);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const expansion = Math.max(0.01, (highest - lowest) * 0.13, Math.abs(highest) * 0.01);
  const minScale = lowest - expansion;
  const maxScale = highest + expansion;

  const location = (point: EvolutionPoint, index: number) => ({
    x: LEFT + index * SPACE,
    y:
      point.value === null
        ? null
        : TOP + ((maxScale - point.value) / (maxScale - minScale)) * DRAW_HEIGHT,
  });

  const segments = observations.slice(1).flatMap((point, index) => {
    const previous = observations[index];
    if (previous.value === null || point.value === null) return [];
    const a = location(previous, index);
    const b = location(point, index + 1);
    if (a.y === null || b.y === null) return [];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const rotation = `${angle}deg` as `${number}deg`;
    return [
      <View
        key={`line-${point.assessment_uuid}`}
        style={[
          styles.lineSegment,
          {
            width: length,
            left: (a.x + b.x) / 2 - length / 2,
            top: (a.y + b.y) / 2 - 1.25,
            transform: [{ rotate: rotation }],
          },
        ]}
      />,
    ];
  });

  return (
    <View>
      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>
          Escala: {formatted(minScale, metric.digits, metric.unit)} a{' '}
          {formatted(maxScale, metric.digits, metric.unit)}
        </Text>
        <Text style={styles.scaleText}>Arraste para ver as datas</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width, height: 225 }}>
          {[0, 0.5, 1].map((position, index) => (
            <View
              key={`grid-${index}`}
              style={[styles.gridLine, { top: TOP + position * DRAW_HEIGHT }]}
            />
          ))}
          {segments}
          {observations.map((point, index) => {
            const coordinate = location(point, index);
            return (
              <Fragment key={point.assessment_uuid}>
                {coordinate.y === null ? (
                  <Text
                    style={[styles.missingPoint, { left: coordinate.x - 8, top: TOP + DRAW_HEIGHT / 2 - 7 }]}
                  >
                    —
                  </Text>
                ) : (
                  <View
                    style={[
                      styles.dot,
                      { left: coordinate.x - 5, top: coordinate.y - 5 },
                    ]}
                  />
                )}
                <Text style={[styles.pointDate, { left: coordinate.x - 31, top: 183 }]}>
                  {shortDate(point.evaluation_date)}
                </Text>
              </Fragment>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function MetricSummary({ metric }: { metric: EvolutionMetric }) {
  const valid = validPoints(metric);
  const first = valid[0];
  const last = valid[valid.length - 1];
  const delta = first && last && valid.length >= 2 ? last.value - first.value : null;

  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryCell}>
        <Text style={styles.smallLabel}>Primeiro registro</Text>
        <Text style={styles.summaryValue}>
          {formatted(first?.value ?? null, metric.digits, metric.unit)}
        </Text>
        <Text style={styles.smallDate}>{dateLabel(first?.evaluation_date ?? null)}</Text>
      </View>
      <View style={styles.summaryCell}>
        <Text style={styles.smallLabel}>Último registro</Text>
        <Text style={styles.summaryValue}>
          {formatted(last?.value ?? null, metric.digits, metric.unit)}
        </Text>
        <Text style={styles.smallDate}>{dateLabel(last?.evaluation_date ?? null)}</Text>
      </View>
      <View style={styles.summaryCell}>
        <Text style={styles.smallLabel}>Variação</Text>
        <Text style={styles.summaryValue}>{numberWithSign(delta, metric)}</Text>
        <Text style={styles.smallDate}>Diferença numérica</Text>
      </View>
    </View>
  );
}

export default function StudentAssessmentEvolutionScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();
  const studentUuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
  const [period, setPeriod] = useState<EvolutionPeriodMonths>(6);
  const [group, setGroup] = useState<EvolutionMetricGroup>('body');
  const [metricKey, setMetricKey] = useState('weight_kg');
  const [data, setData] = useState<StudentAssessmentEvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(
    async (refresh = false) => {
      const id = ++requestId.current;
      if (!studentUuid) {
        setError('Identificação do aluno inválida.');
        setLoading(false);
        return;
      }
      try {
        if (refresh) setRefreshing(true);
        else {
          setLoading(true);
          setData(null);
        }
        setError('');
        const result = await getStudentAssessmentEvolution(studentUuid, period);
        if (id !== requestId.current) return;
        setData(result);
      } catch (exception) {
        if (id !== requestId.current) return;
        setError(
          exception instanceof Error ? exception.message : 'Não foi possível carregar a evolução.'
        );
        if (!refresh) setData(null);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [studentUuid, period]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        requestId.current += 1;
      };
    }, [load])
  );

  const available = data?.metrics.filter(metric => metric.group === group) ?? [];
  const current = available.find(metric => metric.key === metricKey) ?? available[0];
  const latestPoints = current?.points.slice(-12).reverse() ?? [];

  function selectGroup(next: EvolutionMetricGroup) {
    setGroup(next);
    const first = data?.metrics.find(metric => metric.group === next);
    if (first) setMetricKey(first.key);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
          />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={COLOR.dark} />
          </Pressable>
          <View style={styles.headerDetails}>
            <Text style={styles.eyebrow}>EVOLUÇÃO CORPORAL</Text>
            <Text style={styles.heading}>Gráficos de evolução</Text>
          </View>
        </View>
        <Text style={styles.description}>
          Acompanhe medidas registradas nas avaliações concluídas do aluno.
        </Text>

        <Text style={styles.sectionTitle}>Período</Text>
        <View style={styles.periodRow}>
          {PERIODS.map(months => (
            <Pressable
              key={months}
              onPress={() => setPeriod(months)}
              style={[styles.periodChip, period === months && styles.periodActive]}
            >
              <Text style={[styles.periodText, period === months && styles.periodActiveText]}>
                {months === 12 ? '1 ano' : `${months} meses`}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={23} color="#A34A44" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void load()}>
              <Text style={styles.retry}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !data ? (
          <View style={styles.loading}>
            <ActivityIndicator color={COLOR.green} size="large" />
            <Text style={styles.mutedCenter}>Carregando indicadores...</Text>
          </View>
        ) : data ? (
          <>
            <View style={styles.infoCard}>
              <View>
                <Text style={styles.eyebrow}>ALUNO</Text>
                <Text style={styles.studentName}>{data.student.name}</Text>
                <Text style={styles.smallDate}>
                  {dateLabel(data.period_start)} até {dateLabel(data.period_end)}
                </Text>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countNumber}>{data.assessment_count}</Text>
                <Text style={styles.countLabel}>avaliações</Text>
              </View>
            </View>

            {data.has_more ? (
              <Text style={styles.warning}>
                Existem mais de 200 avaliações no período. São exibidas as 200 mais recentes.
              </Text>
            ) : null}

            {data.assessment_count === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color="#87A29A" />
                <Text style={styles.emptyTitle}>Sem avaliações concluídas</Text>
                <Text style={styles.mutedCenter}>
                  Não foram encontradas avaliações concluídas nesse período.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Categoria</Text>
                <View style={styles.groupRow}>
                  {GROUPS.map(option => (
                    <Pressable
                      key={option.key}
                      onPress={() => selectGroup(option.key)}
                      style={[styles.groupChip, group === option.key && styles.groupActive]}
                    >
                      <Text style={[styles.groupLabel, group === option.key && styles.groupActiveLabel]}>
                        {option.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Indicador</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.metricsScroll}
                >
                  {available.map(metric => (
                    <Pressable
                      key={metric.key}
                      onPress={() => setMetricKey(metric.key)}
                      style={[styles.metricChip, current?.key === metric.key && styles.metricSelected]}
                    >
                      <Text
                        style={[styles.metricChipLabel, current?.key === metric.key && styles.metricSelectedLabel]}
                      >
                        {metric.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {current ? (
                  <>
                    <View style={styles.chartCard}>
                      <View style={styles.chartHeader}>
                        <View style={styles.chartHeadingBox}>
                          <Text style={styles.chartTitle}>{current.label}</Text>
                          <Text style={styles.chartSubTitle}>
                            {current.valid_points} medição(ões) disponível(is)
                          </Text>
                        </View>
                        <Ionicons name="analytics-outline" size={24} color={COLOR.green} />
                      </View>
                      <EvolutionLineChart metric={current} />
                      <MetricSummary metric={current} />
                    </View>

                    <Text style={styles.sectionTitle}>Medições mais recentes</Text>
                    <View style={styles.entriesCard}>
                      {latestPoints.map((point, index) => (
                        <View
                          key={point.assessment_uuid}
                          style={[styles.entryRow, index > 0 && styles.entryBorder]}
                        >
                          <Text style={styles.entryDate}>{dateLabel(point.evaluation_date)}</Text>
                          <Text style={styles.entryValue}>
                            {formatted(point.value, current.digits, current.unit)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
              </>
            )}
            <Text style={styles.notice}>{data.note}</Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.background },
  content: { paddingHorizontal: 18, paddingTop: 17, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  back: { height: 44, width: 44, backgroundColor: COLOR.card, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerDetails: { flex: 1 },
  eyebrow: { color: COLOR.green, fontSize: 10, fontWeight: '800' },
  heading: { color: COLOR.text, fontWeight: '800', fontSize: 21 },
  description: { color: COLOR.muted, fontSize: 12, lineHeight: 20, marginBottom: 22 },
  sectionTitle: { color: COLOR.text, fontWeight: '800', fontSize: 15, marginTop: 15, marginBottom: 11 },
  periodRow: { flexDirection: 'row', gap: 9 },
  periodChip: { paddingVertical: 11, flex: 1, backgroundColor: COLOR.card, borderRadius: 12, borderWidth: 1, borderColor: COLOR.border, alignItems: 'center' },
  periodActive: { backgroundColor: COLOR.dark, borderColor: COLOR.dark },
  periodText: { color: COLOR.muted, fontSize: 12, fontWeight: '800' },
  periodActiveText: { color: COLOR.card },
  groupRow: { flexDirection: 'row', gap: 8 },
  groupChip: { flex: 1, alignItems: 'center', backgroundColor: COLOR.card, borderRadius: 11, borderWidth: 1, borderColor: COLOR.border, paddingVertical: 11 },
  groupActive: { backgroundColor: COLOR.pale, borderColor: '#97B9A9' },
  groupLabel: { fontSize: 11, fontWeight: '700', color: COLOR.muted },
  groupActiveLabel: { color: COLOR.dark },
  metricsScroll: { paddingVertical: 2, gap: 8, paddingRight: 10 },
  metricChip: { backgroundColor: COLOR.card, borderWidth: 1, borderColor: COLOR.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  metricSelected: { backgroundColor: COLOR.green, borderColor: COLOR.green },
  metricChipLabel: { fontSize: 12, fontWeight: '700', color: COLOR.muted },
  metricSelectedLabel: { color: COLOR.card },
  infoCard: { backgroundColor: COLOR.card, borderRadius: 18, padding: 17, marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLOR.border },
  studentName: { color: COLOR.text, fontSize: 17, fontWeight: '800', marginTop: 3, marginBottom: 5 },
  countPill: { backgroundColor: COLOR.pale, borderRadius: 13, paddingVertical: 9, paddingHorizontal: 13, alignItems: 'center' },
  countNumber: { color: COLOR.green, fontSize: 19, fontWeight: '800' },
  countLabel: { color: COLOR.green, fontSize: 10, fontWeight: '700' },
  chartCard: { marginTop: 17, backgroundColor: COLOR.card, borderRadius: 19, padding: 14, borderWidth: 1, borderColor: COLOR.border },
  chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  chartHeadingBox: { flex: 1 },
  chartTitle: { color: COLOR.text, fontSize: 16, fontWeight: '800' },
  chartSubTitle: { color: COLOR.muted, fontSize: 11, marginTop: 4 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 15 },
  scaleText: { color: COLOR.muted, fontSize: 9, flexShrink: 1 },
  gridLine: { position: 'absolute', height: 1, left: 0, right: 0, backgroundColor: '#E9EFEB' },
  lineSegment: { position: 'absolute', backgroundColor: COLOR.green, height: 2.5, borderRadius: 3 },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: COLOR.green, borderWidth: 2, borderColor: COLOR.card },
  missingPoint: { position: 'absolute', color: '#ABBBB5', fontSize: 17 },
  pointDate: { position: 'absolute', width: 62, textAlign: 'center', color: COLOR.muted, fontSize: 10 },
  chartEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 45, gap: 9 },
  emptyTitle: { color: COLOR.text, fontSize: 15, fontWeight: '800' },
  mutedCenter: { color: COLOR.muted, fontSize: 12, textAlign: 'center', lineHeight: 19 },
  summaryRow: { borderTopWidth: 1, borderTopColor: COLOR.border, flexDirection: 'row', paddingTop: 15, gap: 5 },
  summaryCell: { flex: 1, minWidth: 0 },
  smallLabel: { color: COLOR.muted, fontSize: 9, fontWeight: '700' },
  summaryValue: { color: COLOR.text, fontSize: 13, fontWeight: '800', marginTop: 6 },
  smallDate: { color: COLOR.muted, fontSize: 10, marginTop: 4 },
  entriesCard: { borderRadius: 17, backgroundColor: COLOR.card, paddingHorizontal: 16, marginBottom: 13 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  entryBorder: { borderTopWidth: 1, borderTopColor: COLOR.border },
  entryDate: { color: COLOR.muted, fontSize: 12 },
  entryValue: { color: COLOR.text, fontWeight: '800', fontSize: 13 },
  warning: { color: '#985C2C', backgroundColor: '#FFF2DF', borderRadius: 12, padding: 11, fontSize: 11, marginTop: 10 },
  notice: { color: COLOR.muted, lineHeight: 18, fontSize: 11, paddingVertical: 22 },
  errorCard: { backgroundColor: '#FFF0EE', alignItems: 'center', gap: 9, borderRadius: 16, padding: 16, marginTop: 15 },
  errorText: { fontSize: 12, color: '#A34A44', textAlign: 'center' },
  retry: { color: COLOR.dark, fontSize: 12, fontWeight: '800' },
  loading: { gap: 12, alignItems: 'center', paddingVertical: 65 },
  emptyCard: { backgroundColor: COLOR.card, borderRadius: 18, alignItems: 'center', padding: 28, gap: 8, marginTop: 16 },
});
