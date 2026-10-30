import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getWeltmanPreview,
  getWeltmanSavedRecord,
  saveWeltmanRecord,
} from '@/services/weltman-preview';
import type { WeltmanMeasurements, WeltmanPreview } from '@/types/weltman-preview';

type EntryKey = 'abdomen_upper_cm' | 'abdomen_umbilicus_cm';

function toInput(value: number | null): string {
  return value === null ? '' : String(value).replace('.', ',');
}

function formatNumber(value: number | null, digits = 2): string {
  return value === null ? 'Não informado' : value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function parseCentimeters(raw: string, label: string): number | null {
  const cleaned = raw.trim().replace(',', '.');
  if (!cleaned) return null;
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) throw new Error(`Valor inválido em ${label}.`);
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0 || value > 300) {
    throw new Error(`${label}: informe um valor maior que zero e de até 300 cm.`);
  }
  return value;
}

export default function WeltmanPreviewScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[]; readOnly?: string | string[] }>();
  const uuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
  const readOnly = (Array.isArray(params.readOnly) ? params.readOnly[0] : params.readOnly) === '1';
  const [upper, setUpper] = useState('');
  const [umbilicus, setUmbilicus] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [protocol, setProtocol] = useState<string | null>(null);
  const [preview, setPreview] = useState<WeltmanPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    async function load() {
      if (!uuid) return;
      try {
        const [saved, output] = await Promise.all([
          getWeltmanSavedRecord(uuid),
          getWeltmanPreview(uuid),
        ]);
        if (!active) return;
        setUpper(toInput(saved.record.abdomen_upper_cm));
        setUmbilicus(toInput(saved.record.abdomen_umbilicus_cm));
        setConfirmed(saved.record.applicability_confirmed);
        setWeight(saved.weight_kg);
        setHeight(saved.height_m);
        setProtocol(saved.protocol);
        setPreview(output);
        setDirty(false);
        setError('');
      } catch (exception) {
        if (active) setError(exception instanceof Error ? exception.message : 'Não foi possível carregar o Weltman.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [uuid]));

  function change(key: EntryKey, text: string) {
    if (key === 'abdomen_upper_cm') setUpper(text);
    else setUmbilicus(text);
    setDirty(true);
    setSuccess('');
  }

  async function save() {
    if (!uuid || readOnly || saving) return;
    try {
      const record: WeltmanMeasurements = {
        abdomen_upper_cm: parseCentimeters(upper, 'Abdômen superior'),
        abdomen_umbilicus_cm: parseCentimeters(umbilicus, 'Abdômen no umbigo'),
        applicability_confirmed: confirmed,
      };
      setSaving(true);
      setError('');
      await saveWeltmanRecord(uuid, record);
      const refreshed = await getWeltmanPreview(uuid);
      setPreview(refreshed);
      setProtocol('weltman');
      setDirty(false);
      setSuccess('Medidas salvas. Prévia atualizada sem alterar o resultado clínico oficial.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível salvar as medidas.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#123C47" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>MF AVALIAÇÃO FÍSICA</Text>
            <Text style={styles.title}>Weltman para obesidade</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" color="#40856C" size={21} />
          <Text style={styles.noticeText}>
            Equação de população específica, para conferência profissional. Não representa diagnóstico,
            não é homologada e não integra os resultados oficiais ou relatórios PDF.
          </Text>
        </View>
        {readOnly ? <Text style={styles.subtle}>Avaliação concluída — somente consulta.</Text> : null}
        {!uuid ? <Text style={styles.error}>Avaliação inválida.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        {loading && uuid ? <ActivityIndicator size="large" color="#40856C" style={{ marginTop: 30 }} /> : null}

        {!loading && uuid ? (
          <>
            {protocol !== 'weltman' ? (
              <Text style={styles.warning}>O protocolo salvo não é Weltman. Ao salvar aqui, ele será selecionado.</Text>
            ) : null}

            <Text style={styles.section}>Medidas já cadastradas</Text>
            <View style={styles.card}>
              <Text style={styles.value}>Peso: {weight === null ? 'Não informado' : `${formatNumber(weight)} kg`}</Text>
              <Text style={styles.value}>Altura: {height === null ? 'Não informada' : `${formatNumber(height)} m`}</Text>
              <Text style={styles.hint}>
                Atualize peso e altura na tela de Composição corporal e salve antes de abrir esta prévia.
                A equação feminina utiliza altura em centímetros.
              </Text>
            </View>

            <Text style={styles.section}>Duas medidas abdominais (cm)</Text>
            <View style={styles.card}>
              <MeasureInput
                label="Abdômen superior (medida 1)"
                hint="Ponto superior conforme o procedimento Weltman, entre a região xifoide e o umbigo."
                value={upper}
                editable={!readOnly}
                onChange={value => change('abdomen_upper_cm', value)}
              />
              <MeasureInput
                label="Abdômen na altura do umbigo (medida 2)"
                hint="Circunferência medida no nível umbilical. Não substitua pela cintura automaticamente."
                value={umbilicus}
                editable={!readOnly}
                onChange={value => change('abdomen_umbilicus_cm', value)}
              />
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmed, disabled: readOnly }}
              disabled={readOnly}
              style={styles.confirmRow}
              onPress={() => { setConfirmed(value => !value); setDirty(true); setSuccess(''); }}
            >
              <Ionicons name={confirmed ? 'checkbox' : 'square-outline'} size={25} color="#40856C" />
              <Text style={styles.confirmText}>
                Confirmo, como profissional responsável, que avaliei a aplicabilidade desta equação
                para a pessoa examinada. Isso não substitui a homologação do método.
              </Text>
            </Pressable>

            {!readOnly ? (
              <Pressable accessibilityRole="button" disabled={saving} style={[styles.button, saving && styles.disabled]} onPress={() => void save()}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="save-outline" size={21} color="#FFFFFF" />}
                <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar medidas e atualizar prévia'}</Text>
              </Pressable>
            ) : null}

            <Text style={styles.section}>Prévia matemática</Text>
            <View style={styles.card}>
              {dirty ? <Text style={styles.warning}>Existem alterações não salvas. Os valores abaixo são da última gravação.</Text> : null}
              {preview?.calculated && preview.percentage !== null ? (
                <>
                  <Text style={styles.metricLabel}>Percentual estimado, NÃO HOMOLOGADO</Text>
                  <Text style={styles.metric}>{formatNumber(preview.percentage)}%</Text>
                  <Text style={styles.hint}>Abdômen médio: {formatNumber(preview.inputs.mean_abdomen_cm)} cm</Text>
                </>
              ) : (
                <Text style={styles.warning}>{preview?.reason ?? 'Sem resultado calculado. Registre e salve os dados primeiro.'}</Text>
              )}
              {preview?.formula ? <Text style={styles.hint}>Equação: {preview.formula}</Text> : null}
              {preview?.reference ? <Text style={styles.hint}>Referência: {preview.reference}</Text> : null}
              <Text style={styles.noticeText}>{preview?.notice ?? 'Prévia para validação profissional, sem laudo.'}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MeasureInput({ label, hint, value, onChange, editable }: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} keyboardType="decimal-pad" value={value} onChangeText={onChange}
        editable={editable} placeholder="Ex.: 110,5" placeholderTextColor="#9CA8A9" />
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8F6' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9 },
  back: { backgroundColor: '#FFFFFF', width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', color: '#40856C', letterSpacing: 1.1 },
  title: { fontSize: 21, fontWeight: '800', color: '#172D34' },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: '#EAF3EF', borderRadius: 16, padding: 14 },
  noticeText: { flex: 1, fontSize: 12, color: '#48645D', lineHeight: 18, marginTop: 8 },
  subtle: { fontSize: 12, color: '#576A6F', marginVertical: 7 },
  error: { color: '#A94343', backgroundColor: '#FFF1F1', borderRadius: 12, padding: 12, fontSize: 12 },
  success: { color: '#267454', backgroundColor: '#E9F6ED', borderRadius: 12, padding: 12, fontSize: 12 },
  warning: { color: '#976322', backgroundColor: '#FFF4DF', borderRadius: 12, padding: 12, fontSize: 12 },
  section: { color: '#172D34', fontWeight: '800', fontSize: 17, marginTop: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 17, borderColor: '#E0E7E3', borderWidth: 1, gap: 10 },
  value: { color: '#172D34', fontSize: 14, fontWeight: '700' },
  hint: { color: '#6B7D81', fontSize: 11, lineHeight: 17, marginTop: 4 },
  field: { marginBottom: 12 },
  label: { color: '#1C383E', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { padding: 13, borderWidth: 1, borderColor: '#DAE5DF', borderRadius: 12, color: '#172D34', fontSize: 16 },
  confirmRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  confirmText: { flex: 1, color: '#425D60', fontSize: 12, lineHeight: 19 },
  button: { backgroundColor: '#40856C', borderRadius: 16, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  metricLabel: { color: '#40856C', fontWeight: '800', fontSize: 11 },
  metric: { fontSize: 35, fontWeight: '800', color: '#123C47' },
});
