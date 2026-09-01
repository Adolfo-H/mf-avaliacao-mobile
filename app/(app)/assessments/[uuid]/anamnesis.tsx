import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import {
  useCallback,
  useMemo,
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

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  getAssessmentAnamnesis,
  updateAssessmentAnamnesis,
} from '@/services/anamnesis';

import {
  AnamnesisObjective,
  AssessmentAnamnesis,
  ParqQuestion,
  SpinePainRegion,
} from '@/types/anamnesis';

const OBJECTIVES: {
  key: AnamnesisObjective;
  label: string;
}[] = [
  {
    key: 'muscle_mass',
    label: 'Aumento da massa muscular',
  },
  {
    key: 'aerobic_capacity',
    label: 'Melhora da capacidade aeróbia',
  },
  {
    key: 'health_quality_of_life',
    label: 'Saúde e qualidade de vida',
  },
  {
    key: 'muscle_strengthening',
    label: 'Fortalecimento muscular',
  },
  {
    key: 'general_conditioning',
    label: 'Condicionamento físico geral',
  },
  {
    key: 'weight_loss',
    label: 'Perda de peso',
  },
  {
    key: 'other',
    label: 'Outro',
  },
];

const SPINE_REGIONS: {
  key: SpinePainRegion;
  label: string;
}[] = [
  {
    key: 'cervical',
    label: 'Cervical',
  },
  {
    key: 'thoracic',
    label: 'Torácica',
  },
  {
    key: 'lumbar',
    label: 'Lombar',
  },
];

export default function AnamnesisScreen() {
  const params = useLocalSearchParams<{
    uuid?: string | string[];
    readOnly?: string | string[];
  }>();

  const assessmentUuid =
    getParam(params.uuid);

  const readOnlyParam =
    getParam(params.readOnly);

  const readOnly =
    readOnlyParam === '1';

  const [
    loadedData,
    setLoadedData,
  ] = useState<AssessmentAnamnesis | null>(
    null
  );

  const [
    objectives,
    setObjectives,
  ] = useState<AnamnesisObjective[]>([]);

  const [
    objectiveOther,
    setObjectiveOther,
  ] = useState('');

  const [
    exercisesRegularly,
    setExercisesRegularly,
  ] = useState<boolean | null>(null);

  const [
    exerciseActivity,
    setExerciseActivity,
  ] = useState('');

  const [
    exerciseFrequency,
    setExerciseFrequency,
  ] = useState('');

  const [
    exerciseDuration,
    setExerciseDuration,
  ] = useState('');

  const [
    spinePainRegions,
    setSpinePainRegions,
  ] = useState<SpinePainRegion[]>([]);

  const [
    jointLimitations,
    setJointLimitations,
  ] = useState('');

  const [
    recentSurgery,
    setRecentSurgery,
  ] = useState<boolean | null>(null);

  const [
    surgeryType,
    setSurgeryType,
  ] = useState('');

  const [
    surgeryDate,
    setSurgeryDate,
  ] = useState('');

  const [
    medications,
    setMedications,
  ] = useState('');

  const [
    healthProblems,
    setHealthProblems,
  ] = useState('');

  const [
    clinicalNotes,
    setClinicalNotes,
  ] = useState('');

  const [
    restingHeartRate,
    setRestingHeartRate,
  ] = useState('');

  const [
    systolicPressure,
    setSystolicPressure,
  ] = useState('');

  const [
    diastolicPressure,
    setDiastolicPressure,
  ] = useState('');

  const [
    parqAnswers,
    setParqAnswers,
  ] = useState<
    Record<number, boolean | null>
  >({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const hydrate =
    useCallback(
      (
        data: AssessmentAnamnesis
      ) => {
        const payload =
          data.anamnesis ?? {};

        setLoadedData(data);

        setObjectives(
          payload.objectives ?? []
        );

        setObjectiveOther(
          payload.objective_other ?? ''
        );

        setExercisesRegularly(
          payload.exercises_regularly ??
            null
        );

        setExerciseActivity(
          payload.exercise_activity ?? ''
        );

        setExerciseFrequency(
          numberToInput(
            payload.exercise_frequency_per_week
          )
        );

        setExerciseDuration(
          numberToInput(
            payload.exercise_duration_minutes
          )
        );

        setSpinePainRegions(
          payload.spine_pain_regions ?? []
        );

        setJointLimitations(
          payload.joint_limitations ?? ''
        );

        setRecentSurgery(
          payload.recent_surgery ?? null
        );

        setSurgeryType(
          payload.surgery_type ?? ''
        );

        setSurgeryDate(
          isoToBrazilianDate(
            payload.surgery_date ?? null
          )
        );

        setMedications(
          payload.medications ?? ''
        );

        setHealthProblems(
          payload.health_problems ?? ''
        );

        setClinicalNotes(
          payload.clinical_notes ?? ''
        );

        setRestingHeartRate(
          numberToInput(
            payload.resting_heart_rate
          )
        );

        setSystolicPressure(
          numberToInput(
            payload.systolic_blood_pressure
          )
        );

        setDiastolicPressure(
          numberToInput(
            payload.diastolic_blood_pressure
          )
        );

        const answers: Record<
          number,
          boolean | null
        > = {};

        for (
          const question
          of data.parq.questions
        ) {
          answers[question.id] =
            question.answer;
        }

        setParqAnswers(
          answers
        );
      },
      []
    );

  const loadData =
    useCallback(
      async () => {
        if (!assessmentUuid) {
          setError(
            'Avaliação inválida.'
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError('');

          const data =
            await getAssessmentAnamnesis(
              assessmentUuid
            );

          hydrate(data);
        } catch (exception) {
          setError(
            exception instanceof Error
              ? exception.message
              : 'Não foi possível carregar a anamnese.'
          );
        } finally {
          setLoading(false);
        }
      },
      [
        assessmentUuid,
        hydrate,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const answeredParqCount =
    useMemo(() => {
      if (!loadedData) {
        return 0;
      }

      return loadedData.parq.questions
        .filter(
          (question) =>
            parqAnswers[
              question.id
            ] !== null &&
            parqAnswers[
              question.id
            ] !== undefined
        )
        .length;
    }, [
      loadedData,
      parqAnswers,
    ]);

  const hasPositiveParq =
    useMemo(() => {
      return Object.values(
        parqAnswers
      ).some(
        (answer) =>
          answer === true
      );
    }, [parqAnswers]);

  function toggleObjective(
    objective: AnamnesisObjective
  ) {
    if (readOnly) {
      return;
    }

    setObjectives(
      (current) =>
        current.includes(
          objective
        )
          ? current.filter(
              (item) =>
                item !== objective
            )
          : [
              ...current,
              objective,
            ]
    );

    setSuccessMessage('');
  }

  function toggleSpineRegion(
    region: SpinePainRegion
  ) {
    if (readOnly) {
      return;
    }

    setSpinePainRegions(
      (current) =>
        current.includes(region)
          ? current.filter(
              (item) =>
                item !== region
            )
          : [
              ...current,
              region,
            ]
    );

    setSuccessMessage('');
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
      const frequency =
        parseOptionalInteger(
          exerciseFrequency,
          'Frequência semanal',
          0,
          50
        );

      const duration =
        parseOptionalInteger(
          exerciseDuration,
          'Duração da atividade',
          0,
          1440
        );

      const heartRate =
        parseOptionalInteger(
          restingHeartRate,
          'Frequência cardíaca',
          1,
          999
        );

      const systolic =
        parseOptionalInteger(
          systolicPressure,
          'Pressão sistólica',
          1,
          999
        );

      const diastolic =
        parseOptionalInteger(
          diastolicPressure,
          'Pressão diastólica',
          1,
          999
        );

      let surgeryIso:
        | string
        | null = null;

      if (surgeryDate.trim()) {
        surgeryIso =
          parseBrazilianDate(
            surgeryDate
          );

        if (!surgeryIso) {
          throw new Error(
            'Informe a data da cirurgia no formato DD/MM/AAAA.'
          );
        }
      }

      setSaving(true);
      setError('');
      setSuccessMessage('');

      const parqPayload =
        loadedData?.parq
          .configured
          ? loadedData.parq.questions
              .filter(
                (question) =>
                  parqAnswers[
                    question.id
                  ] !== null &&
                  parqAnswers[
                    question.id
                  ] !==
                    undefined
              )
              .map(
                (question) => ({
                  question_version_id:
                    question.id,

                  answer:
                    parqAnswers[
                      question.id
                    ] as boolean,
                })
              )
          : undefined;

      const updated =
        await updateAssessmentAnamnesis(
          assessmentUuid,
          {
            objectives,

            objective_other:
              objectives.includes(
                'other'
              )
                ? emptyToNull(
                    objectiveOther
                  )
                : null,

            exercises_regularly:
              exercisesRegularly,

            exercise_activity:
              exercisesRegularly ===
              true
                ? emptyToNull(
                    exerciseActivity
                  )
                : null,

            exercise_frequency_per_week:
              exercisesRegularly ===
              true
                ? frequency
                : null,

            exercise_duration_minutes:
              exercisesRegularly ===
              true
                ? duration
                : null,

            spine_pain_regions:
              spinePainRegions,

            joint_limitations:
              emptyToNull(
                jointLimitations
              ),

            recent_surgery:
              recentSurgery,

            surgery_type:
              recentSurgery === true
                ? emptyToNull(
                    surgeryType
                  )
                : null,

            surgery_date:
              recentSurgery === true
                ? surgeryIso
                : null,

            medications:
              emptyToNull(
                medications
              ),

            health_problems:
              emptyToNull(
                healthProblems
              ),

            clinical_notes:
              emptyToNull(
                clinicalNotes
              ),

            resting_heart_rate:
              heartRate,

            systolic_blood_pressure:
              systolic,

            diastolic_blood_pressure:
              diastolic,

            parq_answers:
              parqPayload,
          }
        );

      hydrate(updated);

      setSuccessMessage(
        'Anamnese salva com sucesso.'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar a anamnese.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#123C47"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Carregando anamnese...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.header}
          >
            <Pressable
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#123C47"
              />
            </Pressable>

            <View
              style={
                styles.headerContent
              }
            >
              <Text
                style={
                  styles.headerLabel
                }
              >
                AVALIAÇÃO FÍSICA
              </Text>

              <Text
                style={
                  styles.headerTitle
                }
              >
                Anamnese
              </Text>
            </View>
          </View>

          {readOnly ? (
            <View
              style={
                styles.readOnlyBox
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#536569"
              />

              <Text
                style={
                  styles.readOnlyText
                }
              >
                Esta avaliação está
                concluída. Os dados
                estão disponíveis
                somente para consulta.
              </Text>
            </View>
          ) : null}

          {error ? (
            <View
              style={
                styles.errorBox
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#B44747"
              />

              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>
            </View>
          ) : null}

          {successMessage ? (
            <View
              style={
                styles.successBox
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#40856C"
              />

              <Text
                style={
                  styles.successText
                }
              >
                {successMessage}
              </Text>
            </View>
          ) : null}

          <View
            style={
              styles.statusCard
            }
          >
            <Text
              style={
                styles.statusLabel
              }
            >
              SITUAÇÃO DA SEÇÃO
            </Text>

            <Text
              style={
                styles.statusValue
              }
            >
              {loadedData
                ?.section
                .status_label ??
                'Não iniciada'}
            </Text>
          </View>

          <SectionTitle
            number="1"
            title="Objetivos"
            description="Selecione um ou mais objetivos relacionados ao exercício."
          />

          <View
            style={styles.card}
          >
            <View
              style={
                styles.chips
              }
            >
              {OBJECTIVES.map(
                (objective) => (
                  <ChoiceChip
                    key={
                      objective.key
                    }
                    label={
                      objective.label
                    }
                    selected={objectives.includes(
                      objective.key
                    )}
                    disabled={
                      readOnly
                    }
                    onPress={() =>
                      toggleObjective(
                        objective.key
                      )
                    }
                  />
                )
              )}
            </View>

            {objectives.includes(
              'other'
            ) ? (
              <Field
                label="Outro objetivo"
                value={
                  objectiveOther
                }
                placeholder="Descreva o objetivo"
                editable={
                  !readOnly
                }
                onChangeText={
                  setObjectiveOther
                }
              />
            ) : null}
          </View>

          <SectionTitle
            number="2"
            title="Prática de exercícios"
            description="Registre a rotina atual de atividade física."
          />

          <View
            style={styles.card}
          >
            <Text
              style={
                styles.fieldLabel
              }
            >
              Pratica exercício
              regularmente?
            </Text>

            <BooleanSelector
              value={
                exercisesRegularly
              }
              disabled={readOnly}
              onChange={
                setExercisesRegularly
              }
            />

            {exercisesRegularly ===
            true ? (
              <>
                <Field
                  label="Atividade praticada"
                  value={
                    exerciseActivity
                  }
                  placeholder="Ex.: caminhada, musculação..."
                  editable={
                    !readOnly
                  }
                  onChangeText={
                    setExerciseActivity
                  }
                />

                <View
                  style={styles.row}
                >
                  <View
                    style={
                      styles.flex
                    }
                  >
                    <Field
                      label="Vezes por semana"
                      value={
                        exerciseFrequency
                      }
                      placeholder="3"
                      keyboardType="numeric"
                      editable={
                        !readOnly
                      }
                      onChangeText={
                        setExerciseFrequency
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.flex
                    }
                  >
                    <Field
                      label="Duração média"
                      value={
                        exerciseDuration
                      }
                      placeholder="45"
                      suffix="min"
                      keyboardType="numeric"
                      editable={
                        !readOnly
                      }
                      onChangeText={
                        setExerciseDuration
                      }
                    />
                  </View>
                </View>
              </>
            ) : null}
          </View>

          <SectionTitle
            number="3"
            title="Dores e limitações"
            description="Registre dores na coluna e outras limitações articulares."
          />

          <View
            style={styles.card}
          >
            <Text
              style={
                styles.fieldLabel
              }
            >
              Regiões da coluna com
              dor
            </Text>

            <View
              style={
                styles.chips
              }
            >
              {SPINE_REGIONS.map(
                (region) => (
                  <ChoiceChip
                    key={
                      region.key
                    }
                    label={
                      region.label
                    }
                    selected={spinePainRegions.includes(
                      region.key
                    )}
                    disabled={
                      readOnly
                    }
                    onPress={() =>
                      toggleSpineRegion(
                        region.key
                      )
                    }
                  />
                )
              )}
            </View>

            <MultilineField
              label="Limitações ou dores articulares"
              value={
                jointLimitations
              }
              placeholder="Descreva limitações, dores ou desconfortos..."
              editable={
                !readOnly
              }
              onChangeText={
                setJointLimitations
              }
            />
          </View>

          <SectionTitle
            number="4"
            title="Histórico clínico"
            description="Registre cirurgias, medicamentos e informações de saúde."
          />

          <View
            style={styles.card}
          >
            <Text
              style={
                styles.fieldLabel
              }
            >
              Cirurgia recente?
            </Text>

            <BooleanSelector
              value={
                recentSurgery
              }
              disabled={readOnly}
              onChange={
                setRecentSurgery
              }
            />

            {recentSurgery ===
            true ? (
              <>
                <Field
                  label="Tipo de cirurgia"
                  value={
                    surgeryType
                  }
                  placeholder="Descreva a cirurgia"
                  editable={
                    !readOnly
                  }
                  onChangeText={
                    setSurgeryType
                  }
                />

                <Field
                  label="Data da cirurgia"
                  value={
                    surgeryDate
                  }
                  placeholder="DD/MM/AAAA"
                  keyboardType="numeric"
                  maxLength={10}
                  editable={
                    !readOnly
                  }
                  onChangeText={(
                    value
                  ) =>
                    setSurgeryDate(
                      formatDateInput(
                        value
                      )
                    )
                  }
                />
              </>
            ) : null}

            <MultilineField
              label="Medicamentos utilizados"
              value={medications}
              placeholder="Informe medicamentos em uso..."
              editable={
                !readOnly
              }
              onChangeText={
                setMedications
              }
            />

            <MultilineField
              label="Problemas de saúde"
              value={
                healthProblems
              }
              placeholder="Informe condições ou problemas de saúde..."
              editable={
                !readOnly
              }
              onChangeText={
                setHealthProblems
              }
            />

            <MultilineField
              label="Observações clínicas"
              value={
                clinicalNotes
              }
              placeholder="Outras observações relevantes..."
              editable={
                !readOnly
              }
              onChangeText={
                setClinicalNotes
              }
            />
          </View>

          <SectionTitle
            number="5"
            title="Sinais vitais em repouso"
            description="Informe frequência cardíaca e pressão arterial."
          />

          <View
            style={styles.card}
          >
            <Field
              label="Frequência cardíaca"
              value={
                restingHeartRate
              }
              placeholder="70"
              suffix="bpm"
              keyboardType="numeric"
              editable={
                !readOnly
              }
              onChangeText={
                setRestingHeartRate
              }
            />

            <View
              style={styles.row}
            >
              <View
                style={
                  styles.flex
                }
              >
                <Field
                  label="Pressão sistólica"
                  value={
                    systolicPressure
                  }
                  placeholder="120"
                  suffix="mmHg"
                  keyboardType="numeric"
                  editable={
                    !readOnly
                  }
                  onChangeText={
                    setSystolicPressure
                  }
                />
              </View>

              <View
                style={
                  styles.flex
                }
              >
                <Field
                  label="Pressão diastólica"
                  value={
                    diastolicPressure
                  }
                  placeholder="80"
                  suffix="mmHg"
                  keyboardType="numeric"
                  editable={
                    !readOnly
                  }
                  onChangeText={
                    setDiastolicPressure
                  }
                />
              </View>
            </View>
          </View>

          <SectionTitle
            number="6"
            title="PAR-Q"
            description="Questionário de prontidão para atividade física."
          />

          {!loadedData?.parq
            .configured ? (
            <View
              style={
                styles.parqUnavailable
              }
            >
              <View
                style={
                  styles.parqIcon
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={25}
                  color="#A66A19"
                />
              </View>

              <View
                style={styles.flex}
              >
                <Text
                  style={
                    styles.parqUnavailableTitle
                  }
                >
                  Questionário aguardando
                  validação
                </Text>

                <Text
                  style={
                    styles.parqUnavailableText
                  }
                >
                  A redação oficial do
                  PAR-Q ainda não foi
                  aprovada pela
                  profissional responsável.
                  Nenhuma pergunta provisória
                  será utilizada.
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={styles.card}
            >
              <View
                style={
                  styles.parqSummary
                }
              >
                <Text
                  style={
                    styles.parqSummaryText
                  }
                >
                  {answeredParqCount} de{' '}
                  {
                    loadedData.parq
                      .total_questions
                  }{' '}
                  respondidas
                </Text>
              </View>

              {hasPositiveParq ? (
                <View
                  style={
                    styles.medicalAlert
                  }
                >
                  <Ionicons
                    name="warning-outline"
                    size={22}
                    color="#A66A19"
                  />

                  <Text
                    style={
                      styles.medicalAlertText
                    }
                  >
                    Existe pelo menos uma
                    resposta “Sim”. Antes
                    da conclusão da
                    anamnese deverá ser
                    seguida a conduta
                    definida pela MF.
                  </Text>
                </View>
              ) : null}

              {loadedData.parq.questions.map(
                (
                  question,
                  index
                ) => (
                  <ParqQuestionCard
                    key={
                      question.id
                    }
                    question={
                      question
                    }
                    number={
                      index + 1
                    }
                    value={
                      parqAnswers[
                        question.id
                      ] ?? null
                    }
                    disabled={
                      readOnly
                    }
                    onChange={(
                      answer
                    ) =>
                      setParqAnswers(
                        (
                          current
                        ) => ({
                          ...current,

                          [question.id]:
                            answer,
                        })
                      )
                    }
                  />
                )
              )}
            </View>
          )}

          {!readOnly ? (
            <>
              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.saveButton,

                  pressed &&
                    !saving &&
                    styles.saveButtonPressed,

                  saving &&
                    styles.buttonDisabled,
                ]}
                disabled={saving}
                onPress={
                  handleSave
                }
              >
                {saving ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Salvando...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Salvar anamnese
                    </Text>
                  </>
                )}
              </Pressable>

              <Text
                style={
                  styles.saveHint
                }
              >
                O preenchimento pode ser
                salvo parcialmente e
                retomado depois.
              </Text>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type SectionTitleProps = {
  number: string;
  title: string;
  description: string;
};

function SectionTitle({
  number,
  title,
  description,
}: SectionTitleProps) {
  return (
    <View
      style={
        styles.sectionTitleContainer
      }
    >
      <View
        style={
          styles.sectionNumber
        }
      >
        <Text
          style={
            styles.sectionNumberText
          }
        >
          {number}
        </Text>
      </View>

      <View style={styles.flex}>
        <Text
          style={
            styles.sectionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function ChoiceChip({
  label,
  selected,
  disabled = false,
  onPress,
}: ChoiceChipProps) {
  return (
    <Pressable
      style={[
        styles.chip,

        selected &&
          styles.chipSelected,

        disabled &&
          styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      {selected ? (
        <Ionicons
          name="checkmark"
          size={15}
          color="#40856C"
        />
      ) : null}

      <Text
        style={[
          styles.chipText,

          selected &&
            styles.chipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type BooleanSelectorProps = {
  value: boolean | null;
  disabled?: boolean;
  onChange: (
    value: boolean
  ) => void;
};

function BooleanSelector({
  value,
  disabled = false,
  onChange,
}: BooleanSelectorProps) {
  return (
    <View
      style={
        styles.booleanRow
      }
    >
      <BooleanButton
        label="Sim"
        selected={value === true}
        disabled={disabled}
        onPress={() =>
          onChange(true)
        }
      />

      <BooleanButton
        label="Não"
        selected={value === false}
        disabled={disabled}
        onPress={() =>
          onChange(false)
        }
      />
    </View>
  );
}

type BooleanButtonProps = {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

function BooleanButton({
  label,
  selected,
  disabled,
  onPress,
}: BooleanButtonProps) {
  return (
    <Pressable
      style={[
        styles.booleanButton,

        selected &&
          styles.booleanButtonSelected,

        disabled &&
          styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        style={[
          styles.booleanButtonText,

          selected &&
            styles.booleanButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;

  suffix?: string;

  keyboardType?:
    | 'default'
    | 'numeric';

  editable?: boolean;

  maxLength?: number;

  onChangeText: (
    value: string
  ) => void;
};

function Field({
  label,
  value,
  placeholder,
  suffix,
  keyboardType = 'default',
  editable = true,
  maxLength,
  onChangeText,
}: FieldProps) {
  return (
    <View
      style={styles.field}
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.inputContainer
        }
      >
        <TextInput
          value={value}
          placeholder={
            placeholder
          }
          placeholderTextColor="#A1ACAF"
          keyboardType={
            keyboardType
          }
          editable={editable}
          maxLength={maxLength}
          style={styles.input}
          onChangeText={
            onChangeText
          }
        />

        {suffix ? (
          <Text
            style={
              styles.inputSuffix
            }
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

type MultilineFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  editable?: boolean;

  onChangeText: (
    value: string
  ) => void;
};

function MultilineField({
  label,
  value,
  placeholder,
  editable = true,
  onChangeText,
}: MultilineFieldProps) {
  return (
    <View
      style={styles.field}
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={value}
        placeholder={
          placeholder
        }
        placeholderTextColor="#A1ACAF"
        multiline
        editable={editable}
        textAlignVertical="top"
        style={
          styles.multilineInput
        }
        onChangeText={
          onChangeText
        }
      />
    </View>
  );
}

type ParqQuestionCardProps = {
  question: ParqQuestion;

  number: number;

  value: boolean | null;

  disabled: boolean;

  onChange: (
    value: boolean
  ) => void;
};

function ParqQuestionCard({
  question,
  number,
  value,
  disabled,
  onChange,
}: ParqQuestionCardProps) {
  return (
    <View
      style={
        styles.parqQuestion
      }
    >
      <Text
        style={
          styles.parqQuestionNumber
        }
      >
        Pergunta {number}
      </Text>

      <Text
        style={
          styles.parqQuestionText
        }
      >
        {question.text}
      </Text>

      <BooleanSelector
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    </View>
  );
}

function getParam(
  value?: string | string[]
): string | null {
  const normalized =
    Array.isArray(value)
      ? value[0]
      : value;

  return normalized?.trim()
    ? normalized.trim()
    : null;
}

function emptyToNull(
  value: string
): string | null {
  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

function numberToInput(
  value?: number | null
): string {
  return value === null ||
    value === undefined
    ? ''
    : String(value);
}

function parseOptionalInteger(
  value: string,
  label: string,
  min: number,
  max: number
): number | null {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    !/^\d+$/.test(
      normalized
    )
  ) {
    throw new Error(
      `${label} deve ser um número inteiro.`
    );
  }

  const number =
    Number(normalized);

  if (
    number < min ||
    number > max
  ) {
    throw new Error(
      `${label} possui um valor inválido.`
    );
  }

  return number;
}

function formatDateInput(
  value: string
): string {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(
      0,
      2
    )}/${digits.slice(2)}`;
  }

  return `${digits.slice(
    0,
    2
  )}/${digits.slice(
    2,
    4
  )}/${digits.slice(4)}`;
}

function parseBrazilianDate(
  value: string
): string | null {
  const match =
    value.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (!match) {
    return null;
  }

  const day =
    Number(match[1]);

  const month =
    Number(match[2]);

  const year =
    Number(match[3]);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${String(
    year
  ).padStart(
    4,
    '0'
  )}-${String(
    month
  ).padStart(
    2,
    '0'
  )}-${String(
    day
  ).padStart(
    2,
    '0'
  )}`;
}

function isoToBrazilianDate(
  value: string | null
): string {
  if (!value) {
    return '';
  }

  const parts =
    value.split('-');

  if (
    parts.length !== 3
  ) {
    return '';
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    container: {
      flex: 1,
      backgroundColor:
        '#F7F8F6',
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 50,
    },

    loadingContainer: {
      flex: 1,
      backgroundColor:
        '#F7F8F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 14,
      color: '#66757A',
      fontSize: 14,
      fontWeight: '600',
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },

    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 13,
    },

    headerContent: {
      flex: 1,
    },

    headerLabel: {
      color: '#40856C',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginBottom: 3,
    },

    headerTitle: {
      color: '#172D34',
      fontSize: 27,
      fontWeight: '800',
    },

    errorBox: {
      backgroundColor:
        '#FFF1F1',
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },

    errorText: {
      flex: 1,
      color: '#B44747',
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },

    successBox: {
      backgroundColor:
        '#EAF6EF',
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },

    successText: {
      flex: 1,
      color: '#40856C',
      fontSize: 13,
      fontWeight: '700',
    },

    readOnlyBox: {
      backgroundColor:
        '#EFF2F1',
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },

    readOnlyText: {
      flex: 1,
      color: '#536569',
      fontSize: 12,
      lineHeight: 18,
    },

    statusCard: {
      backgroundColor:
        '#123C47',
      borderRadius: 18,
      padding: 16,
      marginBottom: 28,
    },

    statusLabel: {
      color: '#91BCAA',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 4,
    },

    statusValue: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },

    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },

    sectionNumber: {
      width: 32,
      height: 32,
      borderRadius: 11,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    sectionNumberText: {
      color: '#40856C',
      fontSize: 12,
      fontWeight: '800',
    },

    sectionTitle: {
      color: '#172D34',
      fontSize: 17,
      fontWeight: '800',
    },

    sectionDescription: {
      color: '#839095',
      fontSize: 11,
      marginTop: 3,
      lineHeight: 15,
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      borderRadius: 22,
      padding: 17,
      marginBottom: 28,
    },

    field: {
      marginTop: 17,
    },

    fieldLabel: {
      color: '#344A51',
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 8,
    },

    inputContainer: {
      minHeight: 52,
      borderWidth: 1,
      borderColor:
        '#DEE4E2',
      backgroundColor:
        '#F9FAF9',
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    input: {
      flex: 1,
      minHeight: 52,
      paddingHorizontal: 14,
      color: '#172D34',
      fontSize: 14,
    },

    inputSuffix: {
      color: '#839095',
      fontSize: 11,
      fontWeight: '700',
      paddingRight: 13,
    },

    multilineInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor:
        '#DEE4E2',
      backgroundColor:
        '#F9FAF9',
      borderRadius: 15,
      padding: 14,
      color: '#172D34',
      fontSize: 14,
    },

    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    chip: {
      minHeight: 40,
      paddingHorizontal: 12,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        '#DEE4E2',
      backgroundColor:
        '#F9FAF9',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    chipSelected: {
      backgroundColor:
        '#EAF3EF',
      borderColor:
        '#BEDACA',
    },

    chipText: {
      color: '#718084',
      fontSize: 11,
      fontWeight: '700',
    },

    chipTextSelected: {
      color: '#40856C',
    },

    booleanRow: {
      flexDirection: 'row',
      gap: 9,
      marginBottom: 3,
    },

    booleanButton: {
      flex: 1,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        '#DEE4E2',
      backgroundColor:
        '#F9FAF9',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    booleanButtonSelected: {
      backgroundColor:
        '#EAF3EF',
      borderColor:
        '#40856C',
    },

    booleanButtonText: {
      color: '#718084',
      fontSize: 13,
      fontWeight: '700',
    },

    booleanButtonTextSelected: {
      color: '#40856C',
    },

    row: {
      flexDirection: 'row',
      gap: 10,
    },

    disabled: {
      opacity: 0.65,
    },

    parqUnavailable: {
      backgroundColor:
        '#FFF6E8',
      borderWidth: 1,
      borderColor:
        '#F1DFC2',
      borderRadius: 20,
      padding: 17,
      flexDirection: 'row',
      gap: 13,
      marginBottom: 28,
    },

    parqIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor:
        '#FFF0D3',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    parqUnavailableTitle: {
      color: '#80551A',
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 5,
    },

    parqUnavailableText: {
      color: '#8B6D43',
      fontSize: 11,
      lineHeight: 17,
    },

    parqSummary: {
      backgroundColor:
        '#F1F5F3',
      borderRadius: 13,
      padding: 11,
      marginBottom: 15,
    },

    parqSummaryText: {
      color: '#536569',
      fontSize: 12,
      fontWeight: '700',
    },

    parqQuestion: {
      borderTopWidth: 1,
      borderTopColor:
        '#EFF2F1',
      paddingVertical: 17,
    },

    parqQuestionNumber: {
      color: '#40856C',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 6,
    },

    parqQuestionText: {
      color: '#172D34',
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '600',
      marginBottom: 12,
    },

    medicalAlert: {
      backgroundColor:
        '#FFF6E8',
      borderRadius: 15,
      padding: 13,
      flexDirection: 'row',
      gap: 9,
      marginBottom: 14,
    },

    medicalAlertText: {
      flex: 1,
      color: '#80551A',
      fontSize: 11,
      lineHeight: 17,
    },

    saveButton: {
      height: 58,
      backgroundColor:
        '#123C47',
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 9,
      marginTop: 2,
    },

    saveButtonPressed: {
      opacity: 0.75,
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },

    saveHint: {
      color: '#839095',
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 16,
      marginTop: 10,
    },
  });