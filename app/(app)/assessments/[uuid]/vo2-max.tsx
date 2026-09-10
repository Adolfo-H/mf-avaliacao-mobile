import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getAssessmentVo2Max,
  updateAssessmentVo2Max,
} from '@/services/vo2-max';
import {
  AssessmentVo2Max,
  Vo2ActivityLevel,
  Vo2ProtocolKey,
} from '@/types/vo2-max';

type FormState = {
  activityLevel: Vo2ActivityLevel | null;
  protocol: Vo2ProtocolKey | null;
  distanceM: string;
  timeMinutes: string;
  timeSeconds: string;
  heartRateBpm: string;
  weightKg: string;
  testDate: string;
  conditions: string;
  observations: string;
};

const EMPTY_FORM: FormState = {
  activityLevel: null,
  protocol: null,
  distanceM: '',
  timeMinutes: '',
  timeSeconds: '',
  heartRateBpm: '',
  weightKg: '',
  testDate: '',
  conditions: '',
  observations: '',
};

export default function Vo2MaxScreen() {
  const params = useLocalSearchParams<{
    uuid?: string | string[];
    readOnly?: string | string[];
  }>();

  const uuid = one(params.uuid);
  const readOnly = one(params.readOnly) === '1';

  const [data, setData] =
    useState<AssessmentVo2Max | null>(null);
  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState('');
  const [success, setSuccess] =
    useState('');

  const hydrate = useCallback(
    (response: AssessmentVo2Max) => {
      const test = response.vo2_max.test ?? {};
      const total = test.time_seconds ?? null;

      setForm({
        activityLevel:
          response.vo2_max.activity_level,
        protocol:
          response.vo2_max.protocol,
        distanceM:
          inputValue(test.distance_m),
        timeMinutes:
          total === null
            ? ''
            : String(Math.floor(total / 60)),
        timeSeconds:
          total === null
            ? ''
            : String(total % 60),
        heartRateBpm:
          inputValue(test.heart_rate_bpm),
        weightKg:
          inputValue(test.weight_kg),
        testDate:
          toBrazilDate(
            test.test_date ??
              response.evaluation_date
          ),
        conditions:
          test.conditions ?? '',
        observations:
          test.observations ?? '',
      });
    },
    []
  );

  const load = useCallback(async () => {
    if (!uuid) {
      setError('Avaliação inválida.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response =
        await getAssessmentVo2Max(uuid);

      setData(response);
      hydrate(response);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar o VO₂Max.'
      );
    } finally {
      setLoading(false);
    }
  }, [uuid, hydrate]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  function setNumber(
    key:
      | 'distanceM'
      | 'timeMinutes'
      | 'timeSeconds'
      | 'heartRateBpm'
      | 'weightKg',
    value: string
  ) {
    setSuccess('');
    setForm(current => ({
      ...current,
      [key]: value.replace(/[^0-9,.]/g, ''),
    }));
  }

  function setText(
    key:
      | 'testDate'
      | 'conditions'
      | 'observations',
    value: string
  ) {
    setSuccess('');
    setForm(current => ({
      ...current,
      [key]: value,
    }));
  }

  async function save() {
    if (!uuid || saving || readOnly) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const testDate =
        parseBrazilDate(form.testDate);

      if (form.testDate.trim() && !testDate) {
        throw new Error(
          'Data do teste: use DD/MM/AAAA.'
        );
      }

      const response =
        await updateAssessmentVo2Max(
          uuid,
          {
            activity_level:
              form.activityLevel,
            protocol:
              form.protocol,
            test: {
              distance_m:
                positiveNumber(
                  form.distanceM,
                  'Distância'
                ),
              time_seconds:
                timeInSeconds(
                  form.timeMinutes,
                  form.timeSeconds
                ),
              heart_rate_bpm:
                positiveInteger(
                  form.heartRateBpm,
                  'Frequência cardíaca'
                ),
              weight_kg:
                positiveNumber(
                  form.weightKg,
                  'Peso'
                ),
              test_date: testDate,
              conditions:
                nullableText(
                  form.conditions
                ),
              observations:
                nullableText(
                  form.observations
                ),
            },
          }
        );

      setData(response);
      hydrate(response);
      setSuccess(
        'VO₂Max salvo com sucesso.'
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível salvar.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#123C47"
        />
        <Text style={styles.muted}>
          Carregando VO₂Max...
        </Text>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={42}
          color="#B44747"
        />
        <Text style={styles.errorTitle}>
          Não foi possível abrir VO₂Max
        </Text>
        <Text style={styles.errorText}>
          {error}
        </Text>
        <Pressable
          style={styles.darkButton}
          onPress={() => router.back()}
        >
          <Text style={styles.darkButtonText}>
            Voltar
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Pressable
                style={styles.back}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color="#123C47"
                />
              </Pressable>

              <View>
                <Text style={styles.eyebrow}>
                  AVALIAÇÃO FÍSICA
                </Text>
                <Text style={styles.title}>
                  VO₂Max
                </Text>
              </View>
            </View>

            {error ? (
              <Notice
                text={error}
                error
              />
            ) : null}

            {success ? (
              <Notice text={success} />
            ) : null}

            <View style={styles.statusCard}>
              <View style={styles.statusIcon}>
                <Ionicons
                  name="heart-outline"
                  size={25}
                  color="#40856C"
                />
              </View>

              <View style={styles.flex}>
                <Text style={styles.smallLabel}>
                  SITUAÇÃO DA SEÇÃO
                </Text>
                <Text style={styles.statusTitle}>
                  {data.section.status_label ??
                    'Não iniciada'}
                </Text>
                <Text style={styles.mutedSmall}>
                  Salve esta etapa para continuar
                  posteriormente.
                </Text>
              </View>
            </View>

            <Heading
              number="01"
              title="Informações iniciais"
            />

            <View style={styles.card}>
              <InfoRow
                label="Idade na avaliação"
                value={
                  data.student
                    .age_at_evaluation === null
                    ? 'Não informada'
                    : `${data.student.age_at_evaluation} anos`
                }
              />
              <InfoRow
                label="Sexo cadastrado"
                value={sexLabel(data.student.sex)}
                last
              />
            </View>

            <Text style={styles.fieldLabel}>
              Nível de atividade
            </Text>

            <View style={styles.twoColumns}>
              <Choice
                label="Ativo"
                active={
                  form.activityLevel === 'active'
                }
                disabled={readOnly}
                onPress={() =>
                  setForm(current => ({
                    ...current,
                    activityLevel: 'active',
                  }))
                }
              />
              <Choice
                label="Sedentário"
                active={
                  form.activityLevel ===
                  'sedentary'
                }
                disabled={readOnly}
                onPress={() =>
                  setForm(current => ({
                    ...current,
                    activityLevel: 'sedentary',
                  }))
                }
              />
            </View>

            <View style={styles.pendingCard}>
              <Ionicons
                name="pulse-outline"
                size={22}
                color="#A56F28"
              />
              <View style={styles.flex}>
                <Text style={styles.pendingLabel}>
                  FC MÁXIMA ESTIMADA
                </Text>
                <Text style={styles.pendingValue}>
                  Não calculada
                </Text>
                <Text style={styles.pendingText}>
                  Fórmula aguardando validação
                  profissional.
                </Text>
              </View>
            </View>

            <Heading
              number="02"
              title="Protocolo de campo"
            />

            <View style={styles.protocols}>
              {data.protocols.map(item => (
                <Choice
                  key={item.key}
                  label={item.label}
                  active={
                    form.protocol === item.key
                  }
                  disabled={readOnly}
                  onPress={() =>
                    setForm(current => ({
                      ...current,
                      protocol: item.key,
                    }))
                  }
                />
              ))}
            </View>

            <Heading
              number="03"
              title="Dados do teste"
            />

            <View style={styles.formCard}>
              <Field
                label="Distância"
                value={form.distanceM}
                unit="m"
                readOnly={readOnly}
                onChange={value =>
                  setNumber('distanceM', value)
                }
              />

              <Text style={styles.fieldLabel}>
                Tempo
              </Text>
              <View style={styles.twoColumns}>
                <Field
                  value={form.timeMinutes}
                  unit="min"
                  readOnly={readOnly}
                  onChange={value =>
                    setNumber(
                      'timeMinutes',
                      value
                    )
                  }
                />
                <Field
                  value={form.timeSeconds}
                  unit="s"
                  readOnly={readOnly}
                  onChange={value =>
                    setNumber(
                      'timeSeconds',
                      value
                    )
                  }
                />
              </View>

              <Field
                label="Frequência cardíaca"
                value={form.heartRateBpm}
                unit="bpm"
                readOnly={readOnly}
                onChange={value =>
                  setNumber(
                    'heartRateBpm',
                    value
                  )
                }
              />

              <Field
                label="Peso"
                value={form.weightKg}
                unit="kg"
                readOnly={readOnly}
                onChange={value =>
                  setNumber('weightKg', value)
                }
              />

              <TextField
                label="Data do teste"
                value={form.testDate}
                placeholder="DD/MM/AAAA"
                readOnly={readOnly}
                onChange={value =>
                  setText('testDate', value)
                }
              />

              <TextArea
                label="Condições do teste"
                value={form.conditions}
                placeholder="Condições relevantes do teste"
                readOnly={readOnly}
                onChange={value =>
                  setText('conditions', value)
                }
              />

              <TextArea
                label="Observações"
                value={form.observations}
                placeholder="Observações do avaliador"
                readOnly={readOnly}
                onChange={value =>
                  setText('observations', value)
                }
              />
            </View>

            <Heading
              number="04"
              title="Resultado"
            />

            <View style={styles.resultCard}>
              <Text style={styles.smallLabel}>
                VO₂MAX
              </Text>
              <Text style={styles.resultValue}>
                Não calculado
              </Text>
              <Text style={styles.resultUnit}>
                ml/kg/min
              </Text>

              <View style={styles.divider} />

              <InfoRow
                label="Classificação"
                value="Aguardando validação"
              />
              <InfoRow
                label="Faixa de referência"
                value="Aguardando validação"
                last
              />
            </View>

            {data.previous ? (
              <View style={styles.previous}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#40856C"
                />
                <View style={styles.flex}>
                  <Text style={styles.previousTitle}>
                    Avaliação anterior
                  </Text>
                  <Text style={styles.mutedSmall}>
                    {toBrazilDate(
                      data.previous.evaluation_date
                    )}
                    {' · '}
                    {protocolLabel(
                      data.previous.protocol
                    )}
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {!readOnly ? (
            <View style={styles.footer}>
              <Pressable
                style={[
                  styles.save,
                  saving && styles.disabled,
                ]}
                disabled={saving}
                onPress={save}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                )}
                <Text style={styles.saveText}>
                  {saving
                    ? 'Salvando...'
                    : 'Salvar VO₂Max'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Heading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <View style={styles.heading}>
      <View style={styles.number}>
        <Text style={styles.numberText}>
          {number}
        </Text>
      </View>
      <Text style={styles.headingTitle}>
        {title}
      </Text>
    </View>
  );
}

function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <View
      style={[
        styles.notice,
        error && styles.noticeError,
      ]}
    >
      <Text
        style={[
          styles.noticeText,
          error && styles.noticeTextError,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        last && styles.noBorder,
      ]}
    >
      <Text style={styles.infoLabel}>
        {label}
      </Text>
      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function Choice({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.choice,
        active && styles.choiceActive,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <View
        style={[
          styles.radio,
          active && styles.radioActive,
        ]}
      >
        {active ? (
          <View style={styles.radioDot} />
        ) : null}
      </View>
      <Text
        style={[
          styles.choiceText,
          active && styles.choiceTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  unit,
  readOnly,
  onChange,
}: {
  label?: string;
  value: string;
  unit: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.flex}>
      {label ? (
        <Text style={styles.fieldLabel}>
          {label}
        </Text>
      ) : null}

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          editable={!readOnly}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#9DAAAC"
          onChangeText={onChange}
        />
        <Text style={styles.unit}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

function TextField({
  label,
  value,
  placeholder,
  readOnly,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>
      <TextInput
        style={styles.textInput}
        value={value}
        editable={!readOnly}
        placeholder={placeholder}
        placeholderTextColor="#9DAAAC"
        onChangeText={onChange}
      />
    </View>
  );
}

function TextArea({
  label,
  value,
  placeholder,
  readOnly,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>
      <TextInput
        style={styles.area}
        value={value}
        editable={!readOnly}
        multiline
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor="#9DAAAC"
        onChangeText={onChange}
      />
    </View>
  );
}

function one(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function inputValue(
  value: number | null | undefined
): string {
  return value === null ||
    value === undefined
    ? ''
    : String(value).replace('.', ',');
}

function positiveNumber(
  value: string,
  label: string
): number | null {
  if (!value.trim()) {
    return null;
  }

  const number = Number(
    value.trim().replace(',', '.')
  );

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    throw new Error(
      `${label}: informe valor maior que zero.`
    );
  }

  return number;
}

function positiveInteger(
  value: string,
  label: string
): number | null {
  const number =
    positiveNumber(value, label);

  if (
    number !== null &&
    !Number.isInteger(number)
  ) {
    throw new Error(
      `${label}: informe número inteiro.`
    );
  }

  return number;
}

function timeInSeconds(
  minValue: string,
  secValue: string
): number | null {
  if (
    !minValue.trim() &&
    !secValue.trim()
  ) {
    return null;
  }

  const min =
    minValue.trim()
      ? Number(minValue)
      : 0;
  const sec =
    secValue.trim()
      ? Number(secValue)
      : 0;

  if (
    !Number.isInteger(min) ||
    !Number.isInteger(sec) ||
    min < 0 ||
    sec < 0 ||
    sec > 59
  ) {
    throw new Error(
      'Tempo: informe minutos e segundos corretamente.'
    );
  }

  const total = min * 60 + sec;

  if (total <= 0) {
    throw new Error(
      'Tempo deve ser maior que zero.'
    );
  }

  return total;
}

function nullableText(
  value: string
): string | null {
  const clean = value.trim();
  return clean || null;
}

function parseBrazilDate(
  value: string
): string | null {
  if (!value.trim()) {
    return null;
  }

  const match = value
    .trim()
    .match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (!match) {
    return null;
  }

  const d = Number(match[1]);
  const m = Number(match[2]);
  const y = Number(match[3]);
  const date = new Date(y, m - 1, d);

  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }

  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function toBrazilDate(
  value: string | null | undefined
): string {
  if (!value) {
    return '';
  }

  const parts =
    value.slice(0, 10).split('-');

  return parts.length === 3
    ? `${parts[2]}/${parts[1]}/${parts[0]}`
    : value;
}

function sexLabel(
  value: string | null
): string {
  switch (value) {
    case 'male':
      return 'Masculino';
    case 'female':
      return 'Feminino';
    case 'other':
      return 'Outro';
    default:
      return 'Não informado';
  }
}

function protocolLabel(
  value: Vo2ProtocolKey | null
): string {
  switch (value) {
    case 'cooper_12_min':
      return 'Cooper 12 min';
    case 'run_2400m':
      return 'Corrida 2.400 m';
    case 'walk_1_mile':
      return 'Caminhada 1 milha';
    default:
      return 'Sem protocolo';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#F4F7F6',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  back: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DEE7E4',
    backgroundColor: '#FFFFFF',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#40856C',
  },
  title: {
    marginTop: 2,
    fontSize: 27,
    fontWeight: '800',
    color: '#123C47',
  },
  muted: {
    color: '#66777C',
    fontSize: 14,
  },
  mutedSmall: {
    marginTop: 4,
    color: '#697A7F',
    fontSize: 11,
    lineHeight: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123C47',
    textAlign: 'center',
  },
  errorText: {
    color: '#8B5555',
    textAlign: 'center',
  },
  darkButton: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#123C47',
  },
  darkButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  notice: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#EDF7F2',
  },
  noticeError: {
    backgroundColor: '#FFF0F0',
  },
  noticeText: {
    color: '#40856C',
    fontSize: 12,
  },
  noticeTextError: {
    color: '#A04444',
  },
  statusCard: {
    flexDirection: 'row',
    gap: 13,
    padding: 16,
    marginBottom: 23,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE8E5',
    backgroundColor: '#FFFFFF',
  },
  statusIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#E8F2EE',
  },
  smallLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#678078',
  },
  statusTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: '800',
    color: '#123C47',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  number: {
    width: 33,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E8F2EE',
  },
  numberText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#40856C',
  },
  headingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#123C47',
  },
  card: {
    overflow: 'hidden',
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE8E5',
    backgroundColor: '#FFFFFF',
  },
  infoRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F0',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    flex: 1,
    fontSize: 11,
    color: '#607277',
  },
  infoValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
    color: '#123C47',
  },
  fieldLabel: {
    marginBottom: 7,
    fontSize: 12,
    fontWeight: '700',
    color: '#566B70',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  choice: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D4DFDC',
    backgroundColor: '#FFFFFF',
  },
  choiceActive: {
    borderColor: '#40856C',
    backgroundColor: '#EAF4F0',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#AEBBBB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#40856C',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#40856C',
  },
  choiceText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#566B70',
  },
  choiceTextActive: {
    color: '#2F6C57',
  },
  disabled: {
    opacity: 0.6,
  },
  pendingCard: {
    flexDirection: 'row',
    gap: 11,
    padding: 14,
    marginBottom: 23,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9D7BA',
    backgroundColor: '#FFF7EA',
  },
  pendingLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#80643A',
  },
  pendingValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '900',
    color: '#A56F28',
  },
  pendingText: {
    marginTop: 3,
    fontSize: 11,
    color: '#806D50',
  },
  protocols: {
    gap: 8,
    marginBottom: 23,
  },
  formCard: {
    gap: 14,
    padding: 15,
    marginBottom: 23,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#DFE8E5',
    backgroundColor: '#FFFFFF',
  },
  inputWrap: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D4DFDC',
    backgroundColor: '#FAFCFB',
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#123C47',
  },
  unit: {
    paddingRight: 10,
    fontSize: 10,
    fontWeight: '700',
    color: '#849195',
  },
  textInput: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D4DFDC',
    backgroundColor: '#FAFCFB',
    color: '#123C47',
  },
  area: {
    minHeight: 88,
    padding: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D4DFDC',
    backgroundColor: '#FAFCFB',
    color: '#123C47',
  },
  resultCard: {
    overflow: 'hidden',
    padding: 16,
    marginBottom: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CDE3D9',
    backgroundColor: '#EAF4F0',
  },
  resultValue: {
    marginTop: 6,
    fontSize: 25,
    fontWeight: '900',
    color: '#123C47',
  },
  resultUnit: {
    marginTop: 1,
    fontSize: 11,
    color: '#637A72',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: '#CFE0DA',
  },
  previous: {
    flexDirection: 'row',
    gap: 10,
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#EDF5F2',
  },
  previousTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#476D60',
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#DEE7E4',
    backgroundColor: '#FFFFFF',
  },
  save: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: '#123C47',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
