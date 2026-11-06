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

import { getAssessmentClinicalPreview } from '@/services/clinical-preview';
import type {
  AssessmentClinicalPreviewResponse,
  ClinicalPreviewStatus,
} from '@/types/clinical-preview';

const COLORS = {
  background: '#F7F8F6',
  primary: '#123C47',
  green: '#40856C',
  text: '#172D34',
  muted: '#718084',
  border: '#E4E9E7',
  amber: '#996014',
  amberBg: '#FFF5E4',
};

const SKINFOLD_LABELS: Record<string, string> = {
  chest: 'Peitoral',
  midaxillary: 'Axilar média',
  triceps: 'Tríceps',
  subscapular: 'Subescapular',
  abdominal: 'Abdominal',
  suprailiac: 'Supra-ilíaca',
  thigh: 'Coxa',
};

const STATUS_LABELS: Record<ClinicalPreviewStatus, string> = {
  protocol_not_selected: 'Selecione e salve o protocolo na composição corporal.',
  pending_professional_validation: 'A equação deste protocolo ainda não foi preparada para conferência.',
  unsupported_sex_for_equation: 'Esta equação requer a seleção profissional de uma referência masculino/feminino.',
  missing_age: 'É necessária a data de nascimento do aluno para calcular a idade na avaliação.',
  outside_studied_age_range: 'A idade está fora da faixa estudada no protocolo utilizado.',
  missing_measurements: 'Faltam dobras cutâneas obrigatórias. Preencha e salve antes de conferir.',
  invalid_measurements: 'Existem dobras inválidas. Revise as medidas registradas.',
  invalid_formula_result: 'A equação produziu um resultado fora do intervalo matemático utilizável.',
  preview_available: 'Prévia matemática calculada. Aguardando homologação profissional.',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function numberText(value: number | null, digits: number): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function ClinicalPreviewScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();
  const assessmentUuid = Array.isArray(params.uuid)
    ? params.uuid[0]
    : params.uuid;

  const [result, setResult] = useState<AssessmentClinicalPreviewResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    if (assessmentUuid) {
      void getAssessmentClinicalPreview(assessmentUuid)
        .then(data => {
          if (!active) return;
          setResult(data);
          setError('');
        })
        .catch(exception => {
          if (!active) return;
          setError(exception instanceof Error ? exception.message : 'Erro ao carregar prévia.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => { active = false; };
  }, [assessmentUuid]));

  async function reload() {
    if (!assessmentUuid) return;
    setLoading(true);
    setError('');
    try {
      setResult(await getAssessmentClinicalPreview(assessmentUuid));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Erro ao carregar prévia.');
    } finally {
      setLoading(false);
    }
  }

  const preview = result?.preview;
  const status = preview?.status;
  const statusDescription = status ? STATUS_LABELS[status] : '';
  const hasValue = status === 'preview_available';
  const missingLabels = (preview?.missing_skinfolds ?? [])
    .map(key => SKINFOLD_LABELS[key] ?? key)
    .join(', ');
  const requiredLabels = (preview?.required_skinfolds ?? [])
    .map(key => SKINFOLD_LABELS[key] ?? key)
    .join(', ');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar"
            onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={23} color={COLORS.primary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.eyebrow}>HOMOLOGAÇÃO CLÍNICA</Text>
            <Text style={styles.title}>Prévia das fórmulas</Text>
          </View>
        </View>

        <View style={styles.warning}>
          <Ionicons name="alert-circle-outline" size={24} color={COLORS.amber} />
          <View style={styles.flex}>
            <Text style={styles.warningTitle}>SIMULAÇÃO NÃO HOMOLOGADA</Text>
            <Text style={styles.warningText}>
              Uso exclusivo para conferência profissional. Os valores não são gravados,
              não geram classificação ou laudo e não entram automaticamente no PDF.
            </Text>
          </View>
        </View>

        {!assessmentUuid ? (
          <Text style={styles.error}>Avaliação inválida.</Text>
        ) : loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.green} size="large" />
            <Text style={styles.muted}>Consultando medidas salvas...</Text>
          </View>
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void reload()} style={styles.action}>
              <Text style={styles.actionText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : preview ? (
          <>
            <View style={styles.card}>
              <Text style={styles.smallTitle}>PROTOCOLO SALVO</Text>
              <Text style={styles.protocol}>{preview.protocol_label}</Text>
              <Text style={styles.muted}>Data: {formatDate(result?.evaluation_date ?? null)}</Text>
              <Text style={styles.muted}>Versão: {preview.formula_version}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.smallTitle}>STATUS DA CONFERÊNCIA</Text>
              <Text style={styles.status}>{statusDescription}</Text>
              {requiredLabels ? (
                <Text style={styles.muted}>Dobras exigidas: {requiredLabels}.</Text>
              ) : null}
              {missingLabels ? (
                <Text style={styles.error}>Revisar: {missingLabels}.</Text>
              ) : null}
            </View>

            {hasValue ? (
              <View style={styles.card}>
                <Text style={styles.smallTitle}>RESULTADOS PRELIMINARES</Text>
                <View style={styles.metricRow}>
                  <View style={styles.flex}>
                    <Text style={styles.muted}>Densidade corporal</Text>
                    <Text style={styles.value}>{numberText(preview.body_density_preview, 6)} g/cm³</Text>
                  </View>
                </View>
                <View style={styles.line} />
                <View style={styles.metricRow}>
                  <View style={styles.flex}>
                    <Text style={styles.muted}>Gordura corporal estimada</Text>
                    <Text style={styles.value}>{numberText(preview.body_fat_percentage_preview, 2)}%</Text>
                  </View>
                </View>
                <Text style={styles.muted}>
                  Equação de densidade Jackson–Pollock; conversão percentual pela equação de Siri.
                  Não interpretar como diagnóstico.
                </Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.smallTitle}>REFERÊNCIAS PARA REVISÃO</Text>
              <Text style={styles.muted}>{preview.reference}</Text>
              <Text style={styles.muted}>Faixas estudadas: homens 18–61 anos; mulheres 18–55 anos.</Text>
              <Text style={styles.muted}>
                Demais protocolos e classificações continuam aguardando validação profissional.
              </Text>
            </View>

            <Pressable onPress={() => void reload()} style={styles.action}>
              <Ionicons name="refresh" size={17} color="#FFFFFF" />
              <Text style={styles.actionText}>Recarregar medidas salvas</Text>
            </Pressable>
            <Text style={styles.footer}>
              Para alterar as dobras, volte à Composição corporal, salve e recarregue esta prévia.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerInfo: { flex: 1 },
  eyebrow: { color: COLORS.green, fontSize: 11, fontWeight: '800' },
  title: { color: COLORS.text, fontSize: 21, fontWeight: '800' },
  warning: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.amberBg, borderColor: '#F4DDAE', borderWidth: 1, borderRadius: 17, padding: 16, marginBottom: 16 },
  warningTitle: { fontSize: 12, fontWeight: '800', color: COLORS.amber },
  warningText: { fontSize: 12, color: COLORS.amber, lineHeight: 19, marginTop: 5 },
  flex: { flex: 1 },
  card: { backgroundColor: '#FFFFFF', borderColor: COLORS.border, borderWidth: 1, padding: 17, borderRadius: 18, marginBottom: 13, gap: 7 },
  loading: { paddingVertical: 55, gap: 15, alignItems: 'center' },
  smallTitle: { color: COLORS.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  protocol: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  muted: { color: COLORS.muted, fontSize: 12, lineHeight: 19 },
  status: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginVertical: 6 },
  error: { color: '#AD4747', fontSize: 12, lineHeight: 20 },
  value: { color: COLORS.primary, fontSize: 22, fontWeight: '800', marginTop: 5 },
  metricRow: { flexDirection: 'row', paddingVertical: 7 },
  line: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  action: { backgroundColor: COLORS.green, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15, marginTop: 3 },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  footer: { color: COLORS.muted, fontSize: 11, textAlign: 'center', lineHeight: 19, padding: 7 },
});
