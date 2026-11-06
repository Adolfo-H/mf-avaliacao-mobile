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

import { getRockportPreview } from '@/services/vo2-rockport-preview';
import type { RockportPreviewData, RockportPreviewStatus } from '@/types/vo2-rockport-preview';

const C = {
  background: '#F7F8F6',
  primary: '#123C47',
  green: '#40856C',
  text: '#172D34',
  muted: '#718084',
  white: '#FFFFFF',
  border: '#E4E9E7',
  warning: '#996014',
  warningBg: '#FFF5E4',
  danger: '#AE4B4B',
};

const STATUS: Record<RockportPreviewStatus, string> = {
  protocol_not_selected: 'Salve o protocolo utilizado para consultar a prévia.',
  pending_professional_validation: 'Selecione o protocolo Caminhada de 1 milha; os demais protocolos têm cálculos independentes.',
  missing_age: 'A data de nascimento do aluno precisa estar cadastrada.',
  outside_original_age_range: 'Fora da população de referência original: apenas 30 a 69 anos nesta prévia.',
  sex_not_supported_by_equation: 'A equação histórica utiliza coeficientes masculino/feminino. Sem um destes registros, não é possível calcular por este método.',
  missing_distance: 'Salve a distância real da caminhada de 1 milha.',
  invalid_mile_distance: 'A equação exige uma milha (aproximadamente 1.609 m). Informe 1609 ou 1610 m; 1600 m não é uma milha completa.',
  missing_time: 'Informe e salve o tempo total para completar 1 milha.',
  invalid_time: 'Confira o tempo registrado: deve estar entre 8 e 40 minutos, em segundos inteiros.',
  missing_weight: 'Informe e salve o peso em kg medido no teste.',
  invalid_weight: 'Confira o peso registrado em kg; o valor está fora da faixa de conferência deste módulo.',
  missing_heart_rate: 'Informe e salve a frequência cardíaca imediatamente após a caminhada.',
  invalid_heart_rate: 'Confira a frequência cardíaca em bpm. O valor está fora da faixa de conferência.',
  invalid_formula_result: 'A equação produziu um valor fora da faixa prevista. Revise os dados com um profissional.',
  preview_available: 'Estimativa matemática disponível apenas para conferência profissional.',
};

function dateBr(date: string | null): string {
  if (!date) return '—';
  const parts = date.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : date;
}

function decimal(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function minuteSecond(seconds: number | null): string {
  if (seconds === null) return '—';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export default function Vo2RockportPreviewScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();
  const uuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
  const [data, setData] = useState<RockportPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    if (uuid) {
      void getRockportPreview(uuid)
        .then(result => {
          if (!active) return;
          setData(result);
          setError('');
        })
        .catch(exception => {
          if (!active) return;
          setError(exception instanceof Error ? exception.message : 'Não foi possível consultar a prévia.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => { active = false; };
  }, [uuid]));

  async function reload(): Promise<void> {
    if (!uuid) return;
    setLoading(true);
    setError('');
    try {
      setData(await getRockportPreview(uuid));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Falha ao consultar a prévia.');
    } finally {
      setLoading(false);
    }
  }

  const preview = data?.preview;
  const available = preview?.status === 'preview_available';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={23} color={C.primary} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>HOMOLOGAÇÃO CLÍNICA</Text>
            <Text style={styles.title}>Prévia Rockport — 1 milha</Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="alert-circle-outline" size={24} color={C.warning} />
          <View style={styles.flex}>
            <Text style={styles.warningTitle}>ESTIMATIVA NÃO HOMOLOGADA</Text>
            <Text style={styles.warningText}>
              Prévia matemática, não é diagnóstico nem resultado laboratorial.
              Não é gravada na avaliação, não gera classificação e não entra no PDF.
              O teste físico deve ser indicado e supervisionado por profissional habilitado.
            </Text>
          </View>
        </View>

        {!uuid ? (
          <Text style={styles.error}>Avaliação inválida.</Text>
        ) : loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={styles.subtle}>Consultando dados salvos...</Text>
          </View>
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{error}</Text>
            <Pressable accessibilityRole="button" style={styles.button} onPress={() => void reload()}>
              <Text style={styles.buttonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : preview ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>AVALIAÇÃO</Text>
              <Text style={styles.value}>{dateBr(data?.evaluation_date ?? null)}</Text>
              <Text style={styles.subtle}>Protocolo: {preview.protocol ?? 'Não informado'}</Text>
              <Text style={styles.subtle}>Versão da equação: {preview.formula_version}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>RESULTADO DA CONFERÊNCIA</Text>
              <Text style={styles.status}>{STATUS[preview.status]}</Text>
              {available ? (
                <>
                  <View style={styles.line} />
                  <Text style={styles.label}>VO₂ ESTIMADO — NÃO HOMOLOGADO</Text>
                  <Text style={styles.result}>{decimal(preview.estimated_vo2_ml_kg_min)}</Text>
                  <Text style={styles.unit}>{preview.unit}</Text>
                  <View style={styles.line} />
                  <Info label="Distância" value={`${decimal(preview.distance_m_used, 0)} m`} />
                  <Info label="Tempo" value={minuteSecond(preview.time_seconds_used)} />
                  <Info label="FC final" value={`${decimal(preview.heart_rate_bpm_used, 0)} bpm`} />
                  <Info label="Peso medido no teste" value={`${decimal(preview.weight_kg_used)} kg`} />
                  <Info label="Idade na avaliação" value={`${preview.age_years_used ?? '—'} anos`} />
                </>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>EQUAÇÃO E LIMITAÇÕES</Text>
              <Text style={styles.formula}>{preview.formula}</Text>
              <Text style={styles.subtle}>O peso em kg é convertido para libras e o tempo em segundos para minutos decimais.</Text>
              <Text style={styles.subtle}>Kline et al., 1987 (PMID 3600239). Amostra original de 30–69 anos.</Text>
              <View style={styles.line} />
              <Text style={styles.subtle}>{preview.warning}</Text>
            </View>

            <Pressable accessibilityRole="button" style={styles.button} onPress={() => void reload()}>
              <Ionicons name="refresh" size={17} color={C.white} />
              <Text style={styles.buttonText}>Recarregar dados salvos</Text>
            </Pressable>
            <Text style={styles.footer}>
              Para ajustar os dados, volte à seção VO₂ máximo, salve distância, tempo, peso e FC final; depois consulte novamente.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.subtle}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  flex: { flex: 1 },
  eyebrow: { color: C.green, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '800', color: C.text },
  warningCard: { flexDirection: 'row', backgroundColor: C.warningBg, padding: 17, borderRadius: 18, gap: 12, borderWidth: 1, borderColor: '#F2DFB8' },
  warningTitle: { color: C.warning, fontWeight: '800', marginBottom: 5, fontSize: 12 },
  warningText: { color: C.warning, fontSize: 12, lineHeight: 19 },
  card: { backgroundColor: C.white, borderRadius: 19, padding: 19, gap: 9, borderWidth: 1, borderColor: C.border },
  label: { fontSize: 10, fontWeight: '800', color: C.green, letterSpacing: 0.5 },
  value: { color: C.text, fontSize: 18, fontWeight: '700' },
  subtle: { color: C.muted, fontSize: 12, lineHeight: 19 },
  status: { color: C.text, fontSize: 14, fontWeight: '700', lineHeight: 22 },
  result: { fontSize: 40, fontWeight: '800', color: C.primary },
  unit: { color: C.green, fontWeight: '700', fontSize: 13 },
  formula: { color: C.text, fontSize: 13, fontWeight: '700' },
  error: { color: C.danger, fontSize: 13, lineHeight: 20 },
  line: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  infoValue: { color: C.text, fontSize: 12, fontWeight: '700' },
  button: { backgroundColor: C.primary, borderRadius: 15, paddingVertical: 15, paddingHorizontal: 18, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: C.white, fontSize: 13, fontWeight: '800' },
  loading: { alignItems: 'center', gap: 12, paddingVertical: 38 },
  footer: { color: C.muted, fontSize: 11, lineHeight: 18, textAlign: 'center' },
});
