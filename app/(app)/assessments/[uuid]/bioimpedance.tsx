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
  getBioimpedancePreview,
  getBioimpedanceRecord,
  saveBioimpedanceRecord,
} from '@/services/bioimpedance';
import type { BioimpedancePreview, BioimpedanceRecord } from '@/types/bioimpedance';

type NumericKey =
  | 'reported_weight_kg'
  | 'body_fat_percentage'
  | 'fat_mass_kg'
  | 'fat_free_mass_kg'
  | 'skeletal_muscle_mass_kg'
  | 'total_body_water_percentage'
  | 'resistance_ohm'
  | 'reactance_ohm';
type TextKey = 'manufacturer' | 'model' | 'software_version' | 'measured_on' | 'conditions' | 'notes';
type FormKey = NumericKey | TextKey;
type Form = Record<FormKey, string>;

const EMPTY: Form = {
  manufacturer: '', model: '', software_version: '', measured_on: '',
  reported_weight_kg: '', body_fat_percentage: '', fat_mass_kg: '',
  fat_free_mass_kg: '', skeletal_muscle_mass_kg: '', total_body_water_percentage: '',
  resistance_ohm: '', reactance_ohm: '', conditions: '', notes: '',
};

const FIELDS: { key: NumericKey; label: string; unit: string; min: number; max: number; strictlyPositive?: boolean }[] = [
  { key: 'reported_weight_kg', label: 'Peso informado pelo equipamento', unit: 'kg', min: 0, max: 500, strictlyPositive: true },
  { key: 'body_fat_percentage', label: 'Percentual de gordura informado', unit: '%', min: 0, max: 100 },
  { key: 'fat_mass_kg', label: 'Massa de gordura informada', unit: 'kg', min: 0, max: 500 },
  { key: 'fat_free_mass_kg', label: 'Massa livre de gordura informada', unit: 'kg', min: 0, max: 500 },
  { key: 'skeletal_muscle_mass_kg', label: 'Massa muscular esquelética informada', unit: 'kg', min: 0, max: 500 },
  { key: 'total_body_water_percentage', label: 'Água corporal informada', unit: '%', min: 0, max: 100 },
  { key: 'resistance_ohm', label: 'Resistência medida', unit: 'Ω', min: 0, max: 5000, strictlyPositive: true },
  { key: 'reactance_ohm', label: 'Reatância medida', unit: 'Ω', min: 0, max: 5000 },
];

function dateToInput(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function dateToApi(raw: string): string | null {
  if (!raw.trim()) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) throw new Error('Use DD/MM/AAAA na data da medição.');
  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (date.getUTCDate() !== Number(dd) || date.getUTCMonth() + 1 !== Number(mm) || date.getUTCFullYear() !== Number(yyyy)) {
    throw new Error('A data da medição não é válida.');
  }
  return `${yyyy}-${mm}-${dd}`;
}

function parseNumber(raw: string, field: (typeof FIELDS)[number]): number | null {
  const clean = raw.trim().replace(',', '.');
  if (!clean) return null;
  if (!/^\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Valor inválido em ${field.label}.`);
  const number = Number(clean);
  if (!Number.isFinite(number) || number < field.min || number > field.max || (field.strictlyPositive && number <= 0)) {
    throw new Error(`Valor fora do intervalo permitido em ${field.label}.`);
  }
  return number;
}

function hydrate(data: BioimpedanceRecord | null | undefined): Form {
  const next: Form = { ...EMPTY };
  if (!data) return next;
  (Object.keys(EMPTY) as FormKey[]).forEach(key => {
    const value = data[key];
    next[key] = value === null || value === undefined ? '' : String(value);
  });
  next.measured_on = dateToInput(data.measured_on);
  return next;
}

export default function AssessmentBioimpedanceScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[]; readOnly?: string | string[] }>();
  const uuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
  const readOnly = (Array.isArray(params.readOnly) ? params.readOnly[0] : params.readOnly) === '1';
  const [form, setForm] = useState<Form>({ ...EMPTY });
  const [preview, setPreview] = useState<BioimpedancePreview | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    async function load() {
      if (!uuid) return;
      try {
        const [response, nextPreview] = await Promise.all([
          getBioimpedanceRecord(uuid), getBioimpedancePreview(uuid),
        ]);
        if (!active) return;
        setForm(hydrate(response.body_composition.bioimpedance));
        setSelectedProtocol(response.body_composition.protocol ?? null);
        setPreview(nextPreview);
        setError('');
      } catch (exception) {
        if (active) setError(exception instanceof Error ? exception.message : 'Não foi possível carregar os dados da bioimpedância.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [uuid]));

  function change(key: FormKey, value: string) {
    setForm(current => ({ ...current, [key]: value }));
    setSuccess('');
  }

  async function save() {
    if (!uuid || saving || readOnly) return;
    try {
      const values: BioimpedanceRecord = {
        manufacturer: form.manufacturer.trim() || null,
        model: form.model.trim() || null,
        software_version: form.software_version.trim() || null,
        measured_on: dateToApi(form.measured_on),
        conditions: form.conditions.trim() || null,
        notes: form.notes.trim() || null,
      };
      for (const field of FIELDS) {
        values[field.key] = parseNumber(form[field.key], field);
      }
      setSaving(true);
      setError('');
      setSuccess('');
      await saveBioimpedanceRecord(uuid, values);
      const refreshed = await getBioimpedancePreview(uuid);
      setPreview(refreshed);
      setSelectedProtocol('bioimpedance');
      setSuccess('Dados do equipamento registrados com sucesso. Nenhuma classificação foi gerada.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível salvar a medição.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#123C47" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>MF AVALIAÇÃO FÍSICA</Text>
            <Text style={styles.title}>Bioimpedância</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={21} color="#40856C" />
          <Text style={styles.noticeText}>
            Transcreva os valores exibidos no equipamento. O aplicativo não realiza equação de bioimpedância,
            não classifica os dados e não os incorpora aos resultados clínicos oficiais ou PDF.
          </Text>
        </View>
        {readOnly ? <Text style={styles.subtle}>Avaliação concluída: consulta somente leitura.</Text> : null}
        {!uuid ? <Text style={styles.error}>Avaliação inválida.</Text> : null}
        {loading && uuid ? <ActivityIndicator size="large" color="#40856C" style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        {!loading && uuid ? (
          <>
            {selectedProtocol !== 'bioimpedance' ? (
              <Text style={styles.warning}>
                O protocolo salvo ainda não é bioimpedância. Ao salvar nesta tela, ele será alterado para bioimpedância.
              </Text>
            ) : null}
            <Text style={styles.section}>Dados do equipamento</Text>
            <View style={styles.card}>
              <Field label="Fabricante" value={form.manufacturer} onChange={value => change('manufacturer', value)} editable={!readOnly} />
              <Field label="Modelo" value={form.model} onChange={value => change('model', value)} editable={!readOnly} />
              <Field label="Versão do software (opcional)" value={form.software_version} onChange={value => change('software_version', value)} editable={!readOnly} />
              <Field label="Data da medição (DD/MM/AAAA)" value={form.measured_on} onChange={value => change('measured_on', value)} editable={!readOnly} placeholder="29/10/2026" />
            </View>

            <Text style={styles.section}>Valores transcritos</Text>
            <View style={styles.card}>
              {FIELDS.map(field => (
                <Field key={field.key} label={`${field.label} (${field.unit})`} value={form[field.key]}
                  onChange={value => change(field.key, value)} editable={!readOnly} numeric placeholder="Não informado" />
              ))}
            </View>

            <Text style={styles.section}>Condições e observações</Text>
            <View style={styles.card}>
              <Field label="Condições da medição (hidratação, horário, alimentação, exercício)"
                value={form.conditions} onChange={value => change('conditions', value)} editable={!readOnly} multiline />
              <Field label="Observações sobre o equipamento ou relatório"
                value={form.notes} onChange={value => change('notes', value)} editable={!readOnly} multiline />
            </View>

            {!readOnly ? (
              <Pressable accessibilityRole="button" style={[styles.button, saving && styles.disabled]}
                onPress={() => void save()} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="save-outline" size={20} color="#FFFFFF" />}
                <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar dados do equipamento'}</Text>
              </Pressable>
            ) : null}

            <Text style={styles.section}>Prévia de conferência</Text>
            <View style={styles.card}>
              <Text style={styles.subtle}>{preview?.notice ?? 'Sem prévia disponível.'}</Text>
              {preview?.measurements.map(metric => (
                <View key={metric.key} style={styles.metric}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>
                    {metric.value === null ? 'Não informado' : `${metric.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${metric.unit}`}
                  </Text>
                </View>
              ))}
              <Text style={styles.subtle}>Origem: relatório do equipamento. Resultado não homologado.</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, editable, numeric = false, multiline = false, placeholder = '' }: {
  label: string; value: string; onChange: (value: string) => void; editable: boolean;
  numeric?: boolean; multiline?: boolean; placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} editable={editable}
        placeholder={placeholder} placeholderTextColor="#98A6A8" keyboardType={numeric ? 'decimal-pad' : 'default'}
        multiline={multiline} maxLength={multiline ? 2000 : 120}
        style={[styles.input, multiline && styles.multiline, !editable && styles.disabledInput]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8F6' },
  content: { padding: 20, paddingBottom: 48, gap: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  back: { width: 42, height: 42, backgroundColor: '#FFFFFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', color: '#40856C', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#172D34' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EAF4EF', padding: 15, borderRadius: 17, gap: 10 },
  noticeText: { flex: 1, fontSize: 12, color: '#34594E', lineHeight: 18 },
  subtle: { fontSize: 12, color: '#718084', lineHeight: 19 },
  error: { fontSize: 12, padding: 13, borderRadius: 11, backgroundColor: '#FDEDED', color: '#A72C2C' },
  success: { fontSize: 12, padding: 13, borderRadius: 11, backgroundColor: '#E7F5EB', color: '#237447' },
  warning: { fontSize: 12, padding: 13, borderRadius: 11, backgroundColor: '#FFF5DE', color: '#886023' },
  section: { fontSize: 16, fontWeight: '800', color: '#172D34', marginTop: 6 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#E1E9E5', padding: 15, gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#456165' },
  input: { borderWidth: 1, borderColor: '#DAE4E1', borderRadius: 12, minHeight: 46, paddingHorizontal: 13, paddingVertical: 9, color: '#172D34', fontSize: 14 },
  multiline: { minHeight: 82, textAlignVertical: 'top' },
  disabledInput: { backgroundColor: '#F7F8F6' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 15, backgroundColor: '#40856C' },
  buttonText: { fontWeight: '800', fontSize: 14, color: '#FFFFFF' },
  disabled: { opacity: 0.5 },
  metric: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EDF1EF', paddingBottom: 9 },
  metricLabel: { fontSize: 11, color: '#586B6D', flex: 1 },
  metricValue: { fontSize: 12, color: '#172D34', fontWeight: '800', textAlign: 'right' },
});
