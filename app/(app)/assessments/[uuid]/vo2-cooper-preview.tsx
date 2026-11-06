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

import { getCooperPreview } from '@/services/vo2-cooper-preview';
import type { CooperPreviewData, CooperPreviewStatus } from '@/types/vo2-cooper-preview';

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

const STATUS: Record<CooperPreviewStatus, string> = {
  protocol_not_selected: 'Salve o protocolo antes de consultar a prévia.',
  pending_professional_validation: 'A prévia está disponível apenas para Cooper de 12 minutos. Este protocolo ainda aguarda homologação.',
  missing_age: 'A data de nascimento do aluno é necessária para confirmar a faixa de uso da prévia.',
  outside_review_scope: 'Prévia não disponibilizada para menores de 18 anos neste módulo.',
  missing_distance: 'Informe e salve a distância percorrida em 12 minutos.',
  invalid_distance: 'A distância registrada não produz uma estimativa matemática válida. Revise os dados.',
  invalid_duration: 'O protocolo Cooper exige 12 minutos (720 segundos). Ajuste o tempo salvo.',
  invalid_formula_result: 'Não foi possível obter uma estimativa matemática válida.',
  preview_available: 'Estimativa matemática disponível somente para conferência profissional.',
};

function dateBr(date: string | null): string {
  if (!date) return '—';
  const parts = date.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : date;
}

function decimal(value: number | null, digits: number): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function Vo2CooperPreviewScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();
  const uuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
  const [data, setData] = useState<CooperPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    if (uuid) {
      void getCooperPreview(uuid)
        .then(response => {
          if (!active) return;
          setData(response);
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
      setData(await getCooperPreview(uuid));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Falha ao consultar prévia.');
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
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>HOMOLOGAÇÃO CLÍNICA</Text>
            <Text style={styles.title}>Prévia Cooper 12 min</Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="alert-circle-outline" size={24} color={C.warning} />
          <View style={styles.flex}>
            <Text style={styles.warningTitle}>SIMULAÇÃO NÃO HOMOLOGADA</Text>
            <Text style={styles.warningText}>
              Estimativa indireta, não é resultado de laboratório nem avaliação médica.
              Não é gravada na ficha, não gera classificação e não entra no PDF.
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
              <Text style={styles.subtle}>Protocolo selecionado: {preview.protocol ?? 'Não informado'}</Text>
              <Text style={styles.subtle}>Versão matemática: {preview.formula_version}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>STATUS</Text>
              <Text style={styles.status}>{STATUS[preview.status]}</Text>
              {available ? (
                <>
                  <View style={styles.line} />
                  <Text style={styles.label}>VO₂ MÁXIMO ESTIMADO — PRÉVIA</Text>
                  <Text style={styles.result}>{decimal(preview.estimated_vo2_ml_kg_min, 2)}</Text>
                  <Text style={styles.unit}>{preview.unit}</Text>
                  <Text style={styles.subtle}>Distância utilizada: {decimal(preview.distance_m_used, 0)} metros.</Text>
                </>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>EQUAÇÃO E FONTE</Text>
              <Text style={styles.formula}>VO₂ estimado = {preview.formula}</Text>
              <Text style={styles.subtle}>A distância é convertida de metros para quilômetros.</Text>
              <Text style={styles.subtle}>{preview.reference}</Text>
              <View style={styles.line} />
              <Text style={styles.subtle}>{preview.warning}</Text>
              <Text style={styles.subtle}>
                O protocolo de esforço deve ser indicado e supervisionado conforme avaliação profissional.
                Não realize um teste máximo apenas para usar esta tela.
              </Text>
            </View>

            <Pressable accessibilityRole="button" style={styles.button} onPress={() => void reload()}>
              <Ionicons name="refresh" size={17} color={C.white} />
              <Text style={styles.buttonText}>Recarregar dados salvos</Text>
            </Pressable>
            <Text style={styles.footer}>
              Para atualizar a distância, volte à seção VO₂ máximo, salve as medidas e consulte novamente.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 52, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  eyebrow: { color: C.green, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  title: { fontSize: 21, fontWeight: '800', color: C.text },
  flex: { flex: 1 },
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
  button: { backgroundColor: C.primary, borderRadius: 15, paddingVertical: 15, paddingHorizontal: 18, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: C.white, fontSize: 13, fontWeight: '800' },
  loading: { alignItems: 'center', gap: 12, paddingVertical: 38 },
  footer: { color: C.muted, fontSize: 11, lineHeight: 18, textAlign: 'center' },
});
