import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';
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
  getAssessmentNeuromotor,
  updateAssessmentNeuromotor,
} from '@/services/neuromotor-tests';

import {
  AssessmentNeuromotor,
  FlexibilityProtocol,
} from '@/types/neuromotor-tests';

type FormState = {
  flexibilityProtocol: FlexibilityProtocol | null;
  flexibilityResult: string;
  flexibilityUnit: string;
  flexibilityObservation: string;
  flexibilityDate: string;

  abdominalRepetitions: string;
  abdominalMinutes: string;
  abdominalSeconds: string;
  abdominalProtocol: string;
  abdominalResult: string;
  abdominalUnit: string;
  abdominalObservation: string;
  abdominalDate: string;

  pushUpsRepetitions: string;
  pushUpsMinutes: string;
  pushUpsSeconds: string;
  pushUpsProtocol: string;
  pushUpsResult: string;
  pushUpsUnit: string;
  pushUpsObservation: string;
  pushUpsDate: string;
};

const EMPTY_FORM: FormState = {
  flexibilityProtocol: null,
  flexibilityResult: '',
  flexibilityUnit: '',
  flexibilityObservation: '',
  flexibilityDate: '',

  abdominalRepetitions: '',
  abdominalMinutes: '',
  abdominalSeconds: '',
  abdominalProtocol: '',
  abdominalResult: '',
  abdominalUnit: '',
  abdominalObservation: '',
  abdominalDate: '',

  pushUpsRepetitions: '',
  pushUpsMinutes: '',
  pushUpsSeconds: '',
  pushUpsProtocol: '',
  pushUpsResult: '',
  pushUpsUnit: '',
  pushUpsObservation: '',
  pushUpsDate: '',
};

export default function NeuromotorTestsScreen() {
  const params = useLocalSearchParams<{
    uuid?: string | string[];
    readOnly?: string | string[];
  }>();

  const assessmentUuid = getParam(params.uuid);
  const readOnly = getParam(params.readOnly) === '1';

  const [data, setData] =
    useState<AssessmentNeuromotor | null>(null);

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const hydrate = useCallback(
    (response: AssessmentNeuromotor) => {
      const flexibility =
        response.neuromotor_tests.flexibility ?? {};

      const abdominal =
        response.neuromotor_tests.resistance
          ?.abdominal_flexion ?? {};

      const pushUps =
        response.neuromotor_tests.resistance
          ?.push_ups ?? {};

      const abdominalTime =
        splitTime(abdominal.time_seconds);

      const pushUpsTime =
        splitTime(pushUps.time_seconds);

      setForm({
        flexibilityProtocol:
          flexibility.protocol ?? null,
        flexibilityResult:
          toInput(flexibility.result),
        flexibilityUnit:
          flexibility.unit ?? '',
        flexibilityObservation:
          flexibility.observation ?? '',
        flexibilityDate:
          formatDateForInput(
            flexibility.test_date
          ),

        abdominalRepetitions:
          toInput(abdominal.repetitions),
        abdominalMinutes:
          abdominalTime.minutes,
        abdominalSeconds:
          abdominalTime.seconds,
        abdominalProtocol:
          abdominal.protocol ?? '',
        abdominalResult:
          toInput(abdominal.result),
        abdominalUnit:
          abdominal.unit ?? '',
        abdominalObservation:
          abdominal.observation ?? '',
        abdominalDate:
          formatDateForInput(
            abdominal.test_date
          ),

        pushUpsRepetitions:
          toInput(pushUps.repetitions),
        pushUpsMinutes:
          pushUpsTime.minutes,
        pushUpsSeconds:
          pushUpsTime.seconds,
        pushUpsProtocol:
          pushUps.protocol ?? '',
        pushUpsResult:
          toInput(pushUps.result),
        pushUpsUnit:
          pushUps.unit ?? '',
        pushUpsObservation:
          pushUps.observation ?? '',
        pushUpsDate:
          formatDateForInput(
            pushUps.test_date
          ),
      });
    },
    []
  );

  const loadData = useCallback(
    async () => {
      if (!assessmentUuid) {
        setError('Avaliação inválida.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response =
          await getAssessmentNeuromotor(
            assessmentUuid
          );

        setData(response);
        hydrate(response);
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : 'Não foi possível carregar os testes neuromotores.'
        );
      } finally {
        setLoading(false);
      }
    },
    [assessmentUuid, hydrate]
  );

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  function setText(
    key: keyof FormState,
    value: string
  ) {
    setSavedMessage('');

    setForm(current => ({
      ...current,
      [key]: value,
    }));
  }

  function setNumber(
    key: keyof FormState,
    value: string
  ) {
    setText(
      key,
      value.replace(/[^0-9,.]/g, '')
    );
  }

  function selectFlexibilityProtocol(
    protocol: FlexibilityProtocol
  ) {
    if (readOnly) {
      return;
    }

    setSavedMessage('');

    setForm(current => ({
      ...current,
      flexibilityProtocol:
        current.flexibilityProtocol === protocol
          ? null
          : protocol,
    }));
  }

  async function handleSave() {
    if (
      !assessmentUuid ||
      saving ||
      readOnly
    ) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSavedMessage('');

      const flexibilityDate =
        parseBrazilianDate(
          form.flexibilityDate,
          'Data da flexibilidade'
        );

      const abdominalDate =
        parseBrazilianDate(
          form.abdominalDate,
          'Data da flexão abdominal'
        );

      const pushUpsDate =
        parseBrazilianDate(
          form.pushUpsDate,
          'Data da flexão de braços'
        );

      const response =
        await updateAssessmentNeuromotor(
          assessmentUuid,
          {
            flexibility: {
              protocol:
                form.flexibilityProtocol,

              result:
                parseOptionalNumber(
                  form.flexibilityResult,
                  'Resultado da flexibilidade',
                  true
                ),

              unit:
                emptyToNull(
                  form.flexibilityUnit
                ),

              observation:
                emptyToNull(
                  form.flexibilityObservation
                ),

              test_date:
                flexibilityDate,
            },

            resistance: {
              abdominal_flexion: {
                repetitions:
                  parseOptionalInteger(
                    form.abdominalRepetitions,
                    'Repetições da flexão abdominal'
                  ),

                time_seconds:
                  parseTimeSeconds(
                    form.abdominalMinutes,
                    form.abdominalSeconds,
                    'Tempo da flexão abdominal'
                  ),

                protocol:
                  emptyToNull(
                    form.abdominalProtocol
                  ),

                result:
                  parseOptionalNumber(
                    form.abdominalResult,
                    'Resultado da flexão abdominal',
                    true
                  ),

                unit:
                  emptyToNull(
                    form.abdominalUnit
                  ),

                observation:
                  emptyToNull(
                    form.abdominalObservation
                  ),

                test_date:
                  abdominalDate,
              },

              push_ups: {
                repetitions:
                  parseOptionalInteger(
                    form.pushUpsRepetitions,
                    'Repetições da flexão de braços'
                  ),

                time_seconds:
                  parseTimeSeconds(
                    form.pushUpsMinutes,
                    form.pushUpsSeconds,
                    'Tempo da flexão de braços'
                  ),

                protocol:
                  emptyToNull(
                    form.pushUpsProtocol
                  ),

                result:
                  parseOptionalNumber(
                    form.pushUpsResult,
                    'Resultado da flexão de braços',
                    true
                  ),

                unit:
                  emptyToNull(
                    form.pushUpsUnit
                  ),

                observation:
                  emptyToNull(
                    form.pushUpsObservation
                  ),

                test_date:
                  pushUpsDate,
              },
            },
          }
        );

      setData(response);
      hydrate(response);

      setSavedMessage(
        'Testes neuromotores salvos com sucesso.'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar os testes neuromotores.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#123C47"
        />
        <Text style={styles.loadingText}>
          Carregando testes...
        </Text>
      </SafeAreaView>
    );
  }

  if (!data && error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorPage}>
          <Ionicons
            name="alert-circle-outline"
            size={44}
            color="#B44747"
          />

          <Text style={styles.errorPageTitle}>
            Não foi possível abrir os testes
          </Text>

          <Text style={styles.errorPageText}>
            {error}
          </Text>

          <Pressable
            style={styles.errorBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorBackButtonText}>
              Voltar
            </Text>
          </Pressable>
        </View>
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
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color="#123C47"
                />
              </Pressable>

              <View style={styles.headerText}>
                <Text style={styles.headerEyebrow}>
                  AVALIAÇÃO FÍSICA
                </Text>

                <Text style={styles.headerTitle}>
                  Testes neuromotores
                </Text>
              </View>
            </View>

            {error ? (
              <MessageBox
                kind="error"
                text={error}
              />
            ) : null}

            {savedMessage ? (
              <MessageBox
                kind="success"
                text={savedMessage}
              />
            ) : null}

            {readOnly ? (
              <MessageBox
                kind="neutral"
                text="Esta avaliação está concluída e disponível somente para consulta."
              />
            ) : null}

            <StatusCard
              label={
                data?.section.status_label ??
                'Não iniciada'
              }
            />

            <SectionHeading
              index="01"
              eyebrow="FLEXIBILIDADE"
              title="Teste de flexibilidade"
              description="Selecione o protocolo e registre o resultado obtido."
            />

            <View style={styles.protocolList}>
              {data?.configuration
                .flexibility_protocols
                .map(protocol => (
                  <ChoiceCard
                    key={protocol.key}
                    label={protocol.label}
                    selected={
                      form.flexibilityProtocol ===
                      protocol.key
                    }
                    disabled={readOnly}
                    onPress={() =>
                      selectFlexibilityProtocol(
                        protocol.key
                      )
                    }
                  />
                ))}
            </View>

            <View style={styles.formCard}>
              <NumberWithUnitField
                label="Resultado"
                value={form.flexibilityResult}
                unit={form.flexibilityUnit}
                readOnly={readOnly}
                unitPlaceholder="Unidade"
                onChangeValue={value =>
                  setNumber(
                    'flexibilityResult',
                    value
                  )
                }
                onChangeUnit={value =>
                  setText(
                    'flexibilityUnit',
                    value
                  )
                }
              />

              <TextField
                label="Data do teste"
                value={form.flexibilityDate}
                placeholder="DD/MM/AAAA"
                readOnly={readOnly}
                onChangeText={value =>
                  setText(
                    'flexibilityDate',
                    value
                  )
                }
              />

              <TextAreaField
                label="Observação"
                value={
                  form.flexibilityObservation
                }
                placeholder="Observações do avaliador"
                readOnly={readOnly}
                onChangeText={value =>
                  setText(
                    'flexibilityObservation',
                    value
                  )
                }
              />
            </View>

            <PendingResultCard
              title="Classificação da flexibilidade"
              subtitle="Aguardando critérios e tabela de referência validados."
            />

            <SectionHeading
              index="02"
              eyebrow="RESISTÊNCIA MUSCULAR"
              title="Flexão abdominal"
              description="Registre repetições, tempo e demais informações disponíveis."
            />

            <ResistanceCard
              repetitions={
                form.abdominalRepetitions
              }
              minutes={
                form.abdominalMinutes
              }
              seconds={
                form.abdominalSeconds
              }
              protocol={
                form.abdominalProtocol
              }
              result={
                form.abdominalResult
              }
              unit={
                form.abdominalUnit
              }
              date={
                form.abdominalDate
              }
              observation={
                form.abdominalObservation
              }
              readOnly={readOnly}
              onChangeRepetitions={value =>
                setNumber(
                  'abdominalRepetitions',
                  value
                )
              }
              onChangeMinutes={value =>
                setNumber(
                  'abdominalMinutes',
                  value
                )
              }
              onChangeSeconds={value =>
                setNumber(
                  'abdominalSeconds',
                  value
                )
              }
              onChangeProtocol={value =>
                setText(
                  'abdominalProtocol',
                  value
                )
              }
              onChangeResult={value =>
                setNumber(
                  'abdominalResult',
                  value
                )
              }
              onChangeUnit={value =>
                setText(
                  'abdominalUnit',
                  value
                )
              }
              onChangeDate={value =>
                setText(
                  'abdominalDate',
                  value
                )
              }
              onChangeObservation={value =>
                setText(
                  'abdominalObservation',
                  value
                )
              }
            />

            <PendingResultCard
              title="Classificação da flexão abdominal"
              subtitle="Aguardando faixa de referência por sexo e idade."
            />

            <SectionHeading
              index="03"
              eyebrow="RESISTÊNCIA MUSCULAR"
              title="Flexão de braços"
              description="Registre repetições, tempo e demais informações disponíveis."
            />

            <ResistanceCard
              repetitions={
                form.pushUpsRepetitions
              }
              minutes={
                form.pushUpsMinutes
              }
              seconds={
                form.pushUpsSeconds
              }
              protocol={
                form.pushUpsProtocol
              }
              result={
                form.pushUpsResult
              }
              unit={
                form.pushUpsUnit
              }
              date={
                form.pushUpsDate
              }
              observation={
                form.pushUpsObservation
              }
              readOnly={readOnly}
              onChangeRepetitions={value =>
                setNumber(
                  'pushUpsRepetitions',
                  value
                )
              }
              onChangeMinutes={value =>
                setNumber(
                  'pushUpsMinutes',
                  value
                )
              }
              onChangeSeconds={value =>
                setNumber(
                  'pushUpsSeconds',
                  value
                )
              }
              onChangeProtocol={value =>
                setText(
                  'pushUpsProtocol',
                  value
                )
              }
              onChangeResult={value =>
                setNumber(
                  'pushUpsResult',
                  value
                )
              }
              onChangeUnit={value =>
                setText(
                  'pushUpsUnit',
                  value
                )
              }
              onChangeDate={value =>
                setText(
                  'pushUpsDate',
                  value
                )
              }
              onChangeObservation={value =>
                setText(
                  'pushUpsObservation',
                  value
                )
              }
            />

            <PendingResultCard
              title="Classificação da flexão de braços"
              subtitle="Aguardando faixa de referência por sexo e idade."
            />

            {data?.previous ? (
              <View style={styles.previousCard}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#40856C"
                />

                <View style={styles.previousContent}>
                  <Text style={styles.previousTitle}>
                    Avaliação anterior disponível
                  </Text>

                  <Text style={styles.previousText}>
                    {formatDateForInput(
                      data.previous.evaluation_date
                    )}
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {!readOnly ? (
            <View style={styles.footerBar}>
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  saving &&
                    styles.saveButtonDisabled,
                  pressed &&
                    !saving &&
                    styles.saveButtonPressed,
                ]}
                disabled={saving}
                onPress={handleSave}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                )}

                <Text style={styles.saveButtonText}>
                  {saving
                    ? 'Salvando...'
                    : 'Salvar testes'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatusCard({
  label,
}: {
  label: string;
}) {
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusIcon}>
        <Ionicons
          name="fitness-outline"
          size={25}
          color="#40856C"
        />
      </View>

      <View style={styles.statusContent}>
        <Text style={styles.statusEyebrow}>
          SITUAÇÃO DA SEÇÃO
        </Text>

        <Text style={styles.statusTitle}>
          {label}
        </Text>

        <Text style={styles.statusDescription}>
          Os testes podem ser salvos e retomados posteriormente.
        </Text>
      </View>
    </View>
  );
}

function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>
          {index}
        </Text>
      </View>

      <View style={styles.sectionText}>
        <Text style={styles.sectionEyebrow}>
          {eyebrow}
        </Text>

        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.sectionDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function MessageBox({
  kind,
  text,
}: {
  kind: 'error' | 'success' | 'neutral';
  text: string;
}) {
  const icon =
    kind === 'error'
      ? 'alert-circle-outline'
      : kind === 'success'
        ? 'checkmark-circle-outline'
        : 'lock-closed-outline';

  return (
    <View
      style={[
        styles.messageBox,
        kind === 'error' &&
          styles.messageError,
        kind === 'success' &&
          styles.messageSuccess,
        kind === 'neutral' &&
          styles.messageNeutral,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={
          kind === 'error'
            ? '#B44747'
            : kind === 'success'
              ? '#40856C'
              : '#66777C'
        }
      />

      <Text style={styles.messageText}>
        {text}
      </Text>
    </View>
  );
}

function ChoiceCard({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.choiceCard,
        selected &&
          styles.choiceCardSelected,
        disabled &&
          styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <View
        style={[
          styles.radio,
          selected &&
            styles.radioSelected,
        ]}
      >
        {selected ? (
          <View style={styles.radioInner} />
        ) : null}
      </View>

      <Text
        style={[
          styles.choiceText,
          selected &&
            styles.choiceTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ResistanceCard(props: {
  repetitions: string;
  minutes: string;
  seconds: string;
  protocol: string;
  result: string;
  unit: string;
  date: string;
  observation: string;
  readOnly: boolean;
  onChangeRepetitions: (value: string) => void;
  onChangeMinutes: (value: string) => void;
  onChangeSeconds: (value: string) => void;
  onChangeProtocol: (value: string) => void;
  onChangeResult: (value: string) => void;
  onChangeUnit: (value: string) => void;
  onChangeDate: (value: string) => void;
  onChangeObservation: (value: string) => void;
}) {
  return (
    <View style={styles.formCard}>
      <NumberField
        label="Número de repetições"
        value={props.repetitions}
        readOnly={props.readOnly}
        onChangeText={props.onChangeRepetitions}
      />

      <Text style={styles.fieldLabel}>
        Tempo de execução
      </Text>

      <View style={styles.timeRow}>
        <UnitInput
          value={props.minutes}
          unit="min"
          readOnly={props.readOnly}
          onChangeText={props.onChangeMinutes}
        />

        <UnitInput
          value={props.seconds}
          unit="s"
          readOnly={props.readOnly}
          onChangeText={props.onChangeSeconds}
        />
      </View>

      <TextField
        label="Protocolo"
        value={props.protocol}
        placeholder="A definir/registrar"
        readOnly={props.readOnly}
        onChangeText={props.onChangeProtocol}
      />

      <NumberWithUnitField
        label="Resultado"
        value={props.result}
        unit={props.unit}
        readOnly={props.readOnly}
        unitPlaceholder="Unidade"
        onChangeValue={props.onChangeResult}
        onChangeUnit={props.onChangeUnit}
      />

      <TextField
        label="Data do teste"
        value={props.date}
        placeholder="DD/MM/AAAA"
        readOnly={props.readOnly}
        onChangeText={props.onChangeDate}
      />

      <TextAreaField
        label="Observação"
        value={props.observation}
        placeholder="Observações do avaliador"
        readOnly={props.readOnly}
        onChangeText={props.onChangeObservation}
      />
    </View>
  );
}

function NumberField({
  label,
  value,
  readOnly,
  onChangeText,
}: {
  label: string;
  value: string;
  readOnly: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        style={[
          styles.textInput,
          readOnly &&
            styles.inputReadOnly,
        ]}
        value={value}
        editable={!readOnly}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor="#A5B0B3"
        onChangeText={onChangeText}
      />
    </View>
  );
}

function NumberWithUnitField({
  label,
  value,
  unit,
  readOnly,
  unitPlaceholder,
  onChangeValue,
  onChangeUnit,
}: {
  label: string;
  value: string;
  unit: string;
  readOnly: boolean;
  unitPlaceholder: string;
  onChangeValue: (value: string) => void;
  onChangeUnit: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <View style={styles.valueUnitRow}>
        <TextInput
          style={[
            styles.numberInput,
            readOnly &&
              styles.inputReadOnly,
          ]}
          value={value}
          editable={!readOnly}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#A5B0B3"
          onChangeText={onChangeValue}
        />

        <TextInput
          style={[
            styles.unitTextInput,
            readOnly &&
              styles.inputReadOnly,
          ]}
          value={unit}
          editable={!readOnly}
          placeholder={unitPlaceholder}
          placeholderTextColor="#A5B0B3"
          onChangeText={onChangeUnit}
        />
      </View>
    </View>
  );
}

function UnitInput({
  value,
  unit,
  readOnly,
  onChangeText,
}: {
  value: string;
  unit: string;
  readOnly: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View
      style={[
        styles.unitInputBox,
        readOnly &&
          styles.inputReadOnly,
      ]}
    >
      <TextInput
        style={styles.unitNumberInput}
        value={value}
        editable={!readOnly}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor="#A5B0B3"
        onChangeText={onChangeText}
      />

      <Text style={styles.unitSuffix}>
        {unit}
      </Text>
    </View>
  );
}

function TextField({
  label,
  value,
  placeholder,
  readOnly,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  readOnly: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        style={[
          styles.textInput,
          readOnly &&
            styles.inputReadOnly,
        ]}
        value={value}
        editable={!readOnly}
        placeholder={placeholder}
        placeholderTextColor="#A5B0B3"
        onChangeText={onChangeText}
      />
    </View>
  );
}

function TextAreaField({
  label,
  value,
  placeholder,
  readOnly,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  readOnly: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        style={[
          styles.textArea,
          readOnly &&
            styles.inputReadOnly,
        ]}
        value={value}
        editable={!readOnly}
        multiline
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor="#A5B0B3"
        onChangeText={onChangeText}
      />
    </View>
  );
}

function PendingResultCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.pendingCard}>
      <Ionicons
        name="information-circle-outline"
        size={21}
        color="#A56F28"
      />

      <View style={styles.pendingText}>
        <Text style={styles.pendingTitle}>
          {title}
        </Text>

        <Text style={styles.pendingValue}>
          Não calculada
        </Text>

        <Text style={styles.pendingDescription}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function getParam(
  value:
    | string
    | string[]
    | undefined
): string | undefined {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function toInput(
  value:
    | number
    | null
    | undefined
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value).replace('.', ',');
}

function splitTime(
  value:
    | number
    | null
    | undefined
): {
  minutes: string;
  seconds: string;
} {
  if (
    value === null ||
    value === undefined
  ) {
    return {
      minutes: '',
      seconds: '',
    };
  }

  return {
    minutes: String(
      Math.floor(value / 60)
    ),
    seconds: String(value % 60),
  };
}

function parseOptionalNumber(
  value: string,
  label: string,
  allowZero = false
): number | null {
  const normalized =
    value
      .trim()
      .replace(',', '.');

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (
    !Number.isFinite(parsed) ||
    (allowZero
      ? parsed < 0
      : parsed <= 0)
  ) {
    throw new Error(
      `${label}: informe um valor válido.`
    );
  }

  return parsed;
}

function parseOptionalInteger(
  value: string,
  label: string
): number | null {
  const parsed =
    parseOptionalNumber(
      value,
      label,
      true
    );

  if (parsed === null) {
    return null;
  }

  if (!Number.isInteger(parsed)) {
    throw new Error(
      `${label}: informe um número inteiro.`
    );
  }

  return parsed;
}

function parseTimeSeconds(
  minutesValue: string,
  secondsValue: string,
  label: string
): number | null {
  const hasMinutes =
    minutesValue.trim() !== '';

  const hasSeconds =
    secondsValue.trim() !== '';

  if (!hasMinutes && !hasSeconds) {
    return null;
  }

  const minutes =
    hasMinutes
      ? Number(minutesValue)
      : 0;

  const seconds =
    hasSeconds
      ? Number(secondsValue)
      : 0;

  if (
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    minutes < 0 ||
    seconds < 0 ||
    seconds > 59
  ) {
    throw new Error(
      `${label}: informe minutos e segundos corretamente.`
    );
  }

  const total =
    minutes * 60 +
    seconds;

  if (total <= 0) {
    throw new Error(
      `${label}: o tempo deve ser maior que zero.`
    );
  }

  return total;
}

function emptyToNull(
  value: string
): string | null {
  const trimmed = value.trim();

  return trimmed
    ? trimmed
    : null;
}

function parseBrazilianDate(
  value: string,
  label: string
): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const match =
    trimmed.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (!match) {
    throw new Error(
      `${label}: use DD/MM/AAAA.`
    );
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(
      `${label}: data inválida.`
    );
  }

  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function formatDateForInput(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return '';
  }

  const parts =
    value
      .slice(0, 10)
      .split('-');

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#F4F7F6',
  },

  loadingText: {
    color: '#66777C',
    fontSize: 15,
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

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DEE7E4',
    backgroundColor: '#FFFFFF',
  },

  headerText: {
    flex: 1,
  },

  headerEyebrow: {
    color: '#40856C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  headerTitle: {
    marginTop: 2,
    color: '#123C47',
    fontSize: 25,
    fontWeight: '800',
  },

  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  messageError: {
    backgroundColor: '#FFF0F0',
    borderColor: '#EFC9C9',
  },

  messageSuccess: {
    backgroundColor: '#EDF7F2',
    borderColor: '#CAE4D8',
  },

  messageNeutral: {
    backgroundColor: '#EEF2F3',
    borderColor: '#DDE5E7',
  },

  messageText: {
    flex: 1,
    color: '#66777C',
    fontSize: 13,
    lineHeight: 19,
  },

  statusCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 17,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE8E5',
    backgroundColor: '#FFFFFF',
  },

  statusIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#E8F2EE',
  },

  statusContent: {
    flex: 1,
  },

  statusEyebrow: {
    color: '#77888C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  statusTitle: {
    marginTop: 3,
    color: '#123C47',
    fontSize: 18,
    fontWeight: '800',
  },

  statusDescription: {
    marginTop: 5,
    color: '#697A7F',
    fontSize: 12,
    lineHeight: 17,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 3,
    marginBottom: 11,
  },

  sectionNumber: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#E8F2EE',
  },

  sectionNumberText: {
    color: '#40856C',
    fontSize: 11,
    fontWeight: '900',
  },

  sectionText: {
    flex: 1,
  },

  sectionEyebrow: {
    color: '#40856C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  sectionTitle: {
    marginTop: 2,
    color: '#123C47',
    fontSize: 19,
    fontWeight: '800',
  },

  sectionDescription: {
    marginTop: 3,
    color: '#697A7F',
    fontSize: 12,
    lineHeight: 18,
  },

  protocolList: {
    gap: 9,
    marginBottom: 16,
  },

  choiceCard: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DFE8E5',
    backgroundColor: '#FFFFFF',
  },

  choiceCardSelected: {
    borderColor: '#40856C',
    backgroundColor: '#EDF6F2',
  },

  disabled: {
    opacity: 0.65,
  },

  radio: {
    width: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#AEBBBB',
  },

  radioSelected: {
    borderColor: '#40856C',
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#40856C',
  },

  choiceText: {
    flex: 1,
    color: '#53676C',
    fontSize: 13,
    fontWeight: '700',
  },

  choiceTextSelected: {
    color: '#245A48',
    fontWeight: '800',
  },

  formCard: {
    gap: 15,
    padding: 16,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE8E5',
    backgroundColor: '#FFFFFF',
  },

  fieldLabel: {
    marginBottom: 7,
    color: '#566B70',
    fontSize: 12,
    fontWeight: '700',
  },

  textInput: {
    minHeight: 45,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DFDC',
    backgroundColor: '#FAFCFB',
    color: '#123C47',
    fontSize: 14,
    fontWeight: '600',
  },

  textArea: {
    minHeight: 92,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DFDC',
    backgroundColor: '#FAFCFB',
    color: '#123C47',
    fontSize: 14,
    lineHeight: 20,
  },

  inputReadOnly: {
    backgroundColor: '#EFF3F2',
  },

  valueUnitRow: {
    flexDirection: 'row',
    gap: 10,
  },

  numberInput: {
    flex: 1,
    minHeight: 45,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DFDC',
    backgroundColor: '#FAFCFB',
    color: '#123C47',
    fontSize: 14,
    fontWeight: '700',
  },

  unitTextInput: {
    width: 110,
    minHeight: 45,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DFDC',
    backgroundColor: '#FAFCFB',
    color: '#123C47',
    fontSize: 13,
  },

  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },

  unitInputBox: {
    flex: 1,
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DFDC',
    backgroundColor: '#FAFCFB',
  },

  unitNumberInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 11,
    color: '#123C47',
    fontSize: 14,
    fontWeight: '700',
  },

  unitSuffix: {
    paddingRight: 11,
    color: '#849195',
    fontSize: 10,
    fontWeight: '700',
  },

  pendingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 15,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D7BA',
    backgroundColor: '#FFF7EA',
  },

  pendingText: {
    flex: 1,
  },

  pendingTitle: {
    color: '#7B5C2D',
    fontSize: 12,
    fontWeight: '800',
  },

  pendingValue: {
    marginTop: 2,
    color: '#A56F28',
    fontSize: 16,
    fontWeight: '900',
  },

  pendingDescription: {
    marginTop: 4,
    color: '#806D50',
    fontSize: 11,
    lineHeight: 16,
  },

  previousCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: '#EDF5F2',
  },

  previousContent: {
    flex: 1,
  },

  previousTitle: {
    color: '#476D60',
    fontSize: 11,
    fontWeight: '800',
  },

  previousText: {
    marginTop: 2,
    color: '#667B74',
    fontSize: 11,
  },

  footerBar: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#DEE7E4',
    backgroundColor: '#FFFFFF',
  },

  saveButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 16,
    backgroundColor: '#123C47',
  },

  saveButtonPressed: {
    opacity: 0.88,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  errorPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  errorPageTitle: {
    marginTop: 14,
    textAlign: 'center',
    color: '#123C47',
    fontSize: 21,
    fontWeight: '800',
  },

  errorPageText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B777B',
    fontSize: 14,
    lineHeight: 21,
  },

  errorBackButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#123C47',
  },

  errorBackButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
