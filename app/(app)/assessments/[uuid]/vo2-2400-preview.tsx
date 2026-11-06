import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRun2400Preview } from '@/services/vo2-2400-preview';
import type { Run2400PreviewData, Run2400PreviewStatus } from '@/types/vo2-2400-preview';

const C = {
  bg: '#F7F8F6', navy: '#123C47', green: '#40856C',
  muted: '#647778', border: '#DCE7E2', white: '#FFFFFF',
  warn: '#976014', warnBg: '#FFF5E4', danger: '#B44747',
};

const MESSAGES: Record<Run2400PreviewStatus, string> = {
  protocol_not_selected: 'Selecione e salve o protocolo Corrida 2.400 m.',
  other_protocol: 'Este cálculo se aplica apenas ao protocolo Corrida de 2.400 m / 1,5 milha.',
  missing_age: 'A data de nascimento do aluno precisa estar cadastrada.',
  outside_review_scope: 'Esta prévia está limitada a pessoas adultas (18–100 anos).',
  missing_distance: 'Registre e salve a distância exata da corrida.',
  invalid_distance: 'Informe 2.400 m (ou 2.414 m para uma pista de 1,5 milha). Não utilize distâncias diferentes.',
  missing_time: 'Informe o tempo total em minutos e segundos e salve o teste.',
  invalid_time: 'Informe tempo válido em segundos inteiros, entre 6 e 40 minutos.',
  invalid_formula_result: 'O resultado da equação ficou fora da faixa matemática de conferência.',
  preview_available: 'Prévia matemática gerada; aguarda conferência profissional.',
};

function decimal(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
}

export default function Run2400PreviewScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();
  const uuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
  const [data, setData] = useState<Run2400PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!uuid) {
      setError('Avaliação inválida.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setData(await getRun2400Preview(uuid));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Falha ao consultar prévia.');
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useFocusEffect(useCallback(() => {
    void reload();
  }, [reload]));

  const preview = data?.preview;
  const available = preview?.status === 'preview_available';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={styles.back}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={23} color={C.navy} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>PROTOCOLO DE CONFERÊNCIA</Text>
            <Text style={styles.title}>Corrida 2.400 m</Text>
          </View>
        </View>

        <View style={styles.warning}>
          <Ionicons name="alert-circle-outline" size={23} color={C.warn} />
          <View style={styles.flex}>
            <Text style={styles.warningTitle}>PRÉVIA NÃO HOMOLOGADA</Text>
            <Text style={styles.warningText}>
              Estimativa indireta de VO₂ de teste máximo, não é diagnóstico nem prescrição.
              Não modifica os resultados oficiais e não aparece no PDF.
              O teste exige indicação e supervisão de profissional habilitado.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={styles.muted}>Consultando as medidas salvas...</Text>
          </View>
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : preview ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>STATUS DO CÁLCULO</Text>
              <Text style={styles.status}>{MESSAGES[preview.status] ?? 'Conferir dados registrados.'}</Text>
              <Text style={styles.muted}>Versão da equação: {preview.formula_version}</Text>
              {available ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.label}>VO₂ ESTIMADO — APENAS PRÉVIA</Text>
                  <Text style={styles.result}>{decimal(preview.estimated_vo2_ml_kg_min)}</Text>
                  <Text style={styles.unit}>{preview.unit}</Text>
                  <Text style={styles.muted}>Distância registrada: {decimal(preview.distance_m_used, 0)} m.</Text>
                  <Text style={styles.muted}>Tempo: {preview.time_seconds_used !== null
                    ? `${Math.floor(preview.time_seconds_used / 60)}:${String(preview.time_seconds_used % 60).padStart(2, '0')}`
                    : '—'}</Text>
                </>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>FÓRMULA E REFERÊNCIA</Text>
              <Text style={styles.formula}>3,5 + 483 / tempo (minutos)</Text>
              <Text style={styles.muted}>{preview.reference}</Text>
              <Text style={styles.muted}>O tempo precisa estar salvo em segundos; a equação usa minutos decimais.</Text>
              <View style={styles.divider} />
              <Text style={styles.muted}>{preview.warning}</Text>
            </View>
          </>
        ) : null}

        <Pressable accessibilityRole="button" style={styles.button} onPress={() => void reload()}>
          <Ionicons name="refresh" size={18} color={C.white} />
          <Text style={styles.buttonText}>Atualizar prévia</Text>
        </Pressable>
        <Text style={styles.footer}>
          Para alterar as medidas, volte à seção VO₂ máximo e salve o teste antes de consultar novamente.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, gap: 15 },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, backgroundColor: C.white, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  flex: { flex: 1 },
  eyebrow: { color: C.green, fontSize: 10, fontWeight: '800' },
  title: { color: C.navy, fontSize: 21, fontWeight: '800' },
  warning: { backgroundColor: C.warnBg, padding: 16, borderRadius: 17, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#F2DFB8' },
  warningTitle: { fontWeight: '800', fontSize: 12, color: C.warn, marginBottom: 5 },
  warningText: { fontSize: 12, lineHeight: 19, color: C.warn },
  card: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, gap: 9 },
  label: { color: C.green, fontSize: 10, fontWeight: '800' },
  status: { color: C.navy, fontWeight: '700', fontSize: 14 },
  muted: { color: C.muted, fontSize: 12, lineHeight: 18 },
  result: { color: C.navy, fontSize: 42, fontWeight: '800' },
  unit: { color: C.green, fontSize: 13, fontWeight: '700' },
  divider: { height: 1, marginVertical: 7, backgroundColor: C.border },
  formula: { color: C.navy, fontSize: 15, fontWeight: '700' },
  loading: { alignItems: 'center', paddingVertical: 32, gap: 14 },
  error: { color: C.danger, fontSize: 13 },
  button: { backgroundColor: C.navy, borderRadius: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, gap: 9 },
  buttonText: { color: C.white, fontSize: 13, fontWeight: '800' },
  footer: { textAlign: 'center', color: C.muted, fontSize: 11, lineHeight: 18 },
});
