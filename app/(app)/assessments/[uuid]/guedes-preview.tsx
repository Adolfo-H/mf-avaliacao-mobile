import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAssessmentGuedesPreview } from '@/services/guedes-preview';
import type { GuedesPreviewResponse } from '@/types/guedes-preview';

const COLORS = {
  background: '#F7F8F6', primary: '#123C47', green: '#40856C',
  text: '#172D34', muted: '#718084', border: '#E4E9E7',
  amber: '#926419', amberBg: '#FFF4E0', white: '#FFFFFF',
};
const FOLD_NAMES: Record<string, string> = {
  triceps: 'Tríceps', suprailiac: 'Supra-ilíaca', abdominal: 'Abdominal',
  subscapular: 'Subescapular', thigh: 'Coxa',
};

function formatNumber(value: number | null, digits: number): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
}

export default function GuedesPreviewScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();
  const uuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
  const [data, setData] = useState<GuedesPreviewResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    if (uuid) {
      void getAssessmentGuedesPreview(uuid)
        .then(response => {
          if (!active) return;
          setData(response);
          setError('');
        })
        .catch(reason => {
          if (!active) return;
          setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a prévia.');
        })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [uuid]));

  async function reload(): Promise<void> {
    if (!uuid) return;
    setLoading(true);
    setError('');
    try {
      setData(await getAssessmentGuedesPreview(uuid));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao consultar a prévia.');
    } finally {
      setLoading(false);
    }
  }

  const p = data?.preview;
  const ready = p?.status === 'preview_available';
  const required = (p?.required_skinfolds ?? []).map(key => FOLD_NAMES[key] ?? key).join(', ');
  const missing = (p?.missing_skinfolds ?? []).map(key => FOLD_NAMES[key] ?? key).join(', ');
  const date = data?.evaluation_date;
  const displayDate = date ? date.split('-').reverse().join('/') : '—';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar"
            onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={23} color={COLORS.primary} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>PRÉVIA CLÍNICA · ETAPA 08D</Text>
            <Text style={styles.title}>Guedes · 3 dobras</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="alert-circle-outline" size={24} color={COLORS.amber} />
          <View style={styles.flex}>
            <Text style={styles.noticeTitle}>NÃO HOMOLOGADO</Text>
            <Text style={styles.noticeText}>
              Somente conferência matemática. Nenhum percentual é salvo na ficha,
              classificado ou incluído no relatório PDF sem aprovação profissional.
            </Text>
          </View>
        </View>

        {!uuid ? (
          <Text style={styles.error}>Avaliação inválida.</Text>
        ) : loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.muted}>Consultando medidas salvas...</Text>
          </View>
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.error}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void reload()} style={styles.action}>
              <Text style={styles.actionText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : p ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>DADOS DA AVALIAÇÃO</Text>
              <Text style={styles.line}>Data: {displayDate}</Text>
              <Text style={styles.line}>Idade: {p.age_at_evaluation ?? '—'} anos</Text>
              <Text style={styles.line}>
                Referência da equação: {p.sex === 'male' ? 'Masculina' : p.sex === 'female' ? 'Feminina' : 'Não definida'}
              </Text>
              <Text style={styles.muted}>Versão: {p.formula_version}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>VERIFICAÇÃO</Text>
              <Text style={styles.message}>{p.message}</Text>
              {p.studied_age_range ? (
                <Text style={styles.line}>
                  Faixa conservadora: {p.studied_age_range.min}–{p.studied_age_range.max} anos.
                </Text>
              ) : null}
              {required ? <Text style={styles.line}>Dobras necessárias: {required}.</Text> : null}
              {missing ? <Text style={styles.error}>Ainda faltam: {missing}.</Text> : null}
            </View>

            {ready ? (
              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>RESULTADO MATEMÁTICO</Text>
                <Text style={styles.result}>{formatNumber(p.body_fat_percentage_preview, 2)}%</Text>
                <Text style={styles.muted}>Gordura corporal estimada · prévia não homologada</Text>
                <View style={styles.divider} />
                <Text style={styles.line}>Soma das 3 dobras: {formatNumber(p.sum_skinfolds_mm, 2)} mm</Text>
                <Text style={styles.line}>Densidade corporal: {formatNumber(p.body_density_g_ml, 5)} g/mL</Text>
                <Text style={styles.formula}>{p.formula}</Text>
                <Text style={styles.formula}>{p.conversion}</Text>
              </View>
            ) : null}
            <Text style={styles.footnote}>{p.reference}</Text>
            <Pressable accessibilityRole="button" style={styles.action} onPress={() => void reload()}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.white} />
              <Text style={styles.actionText}>Atualizar prévia</Text>
            </Pressable>
          </>
        ) : <Text style={styles.error}>Não há dados disponíveis.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  eyebrow: { color: COLORS.green, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  title: { color: COLORS.text, fontSize: 23, fontWeight: '800' },
  notice: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: COLORS.amberBg, borderRadius: 17, marginBottom: 18 },
  noticeTitle: { color: COLORS.amber, fontSize: 12, fontWeight: '800' },
  noticeText: { color: COLORS.amber, marginTop: 5, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1, borderRadius: 19, padding: 18, marginBottom: 13, gap: 9 },
  cardEyebrow: { color: COLORS.green, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  message: { color: COLORS.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  line: { color: COLORS.text, fontSize: 12, lineHeight: 19 },
  muted: { color: COLORS.muted, fontSize: 12 },
  error: { color: '#B44747', fontSize: 12, lineHeight: 19 },
  result: { color: COLORS.primary, fontSize: 39, fontWeight: '800' },
  formula: { color: COLORS.muted, fontSize: 11, lineHeight: 17 },
  divider: { borderTopColor: COLORS.border, borderTopWidth: 1, marginVertical: 4 },
  loading: { paddingVertical: 55, alignItems: 'center', gap: 12 },
  action: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  actionText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  footnote: { fontSize: 10, lineHeight: 17, color: COLORS.muted, marginVertical: 12 },
});
