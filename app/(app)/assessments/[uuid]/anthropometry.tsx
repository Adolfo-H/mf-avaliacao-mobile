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
  getAssessmentAnthropometry,
  updateAssessmentAnthropometry,
} from '@/services/anthropometry';

import {
  AssessmentAnthropometry,
} from '@/types/anthropometry';

type FormState = {
  forearmRight: string;
  forearmLeft: string;
  relaxedArmRight: string;
  relaxedArmLeft: string;
  flexedArmRight: string;
  flexedArmLeft: string;
  proximalThighRight: string;
  proximalThighLeft: string;
  medialThighRight: string;
  medialThighLeft: string;
  distalThighRight: string;
  distalThighLeft: string;
  calfRight: string;
  calfLeft: string;

  abdomen: string;
  waist: string;
  shoulder: string;
  hip: string;
  chest: string;
  neck: string;

  wrist: string;
  humerus: string;
  femur: string;
};

type FormKey = keyof FormState;

type BilateralKey =
  | 'forearm'
  | 'relaxed_arm'
  | 'flexed_arm'
  | 'proximal_thigh'
  | 'medial_thigh'
  | 'distal_thigh'
  | 'calf';

type CentralKey =
  | 'abdomen'
  | 'waist'
  | 'shoulder'
  | 'hip'
  | 'chest'
  | 'neck';

type BoneKey =
  | 'wrist'
  | 'humerus'
  | 'femur';

type BilateralField = {
  label: string;
  apiKey: BilateralKey;
  rightKey: FormKey;
  leftKey: FormKey;
};

type CentralField = {
  label: string;
  apiKey: CentralKey;
  formKey: FormKey;
};

type BoneField = {
  label: string;
  apiKey: BoneKey;
  formKey: FormKey;
};

const EMPTY_FORM: FormState = {
  forearmRight: '',
  forearmLeft: '',
  relaxedArmRight: '',
  relaxedArmLeft: '',
  flexedArmRight: '',
  flexedArmLeft: '',
  proximalThighRight: '',
  proximalThighLeft: '',
  medialThighRight: '',
  medialThighLeft: '',
  distalThighRight: '',
  distalThighLeft: '',
  calfRight: '',
  calfLeft: '',

  abdomen: '',
  waist: '',
  shoulder: '',
  hip: '',
  chest: '',
  neck: '',

  wrist: '',
  humerus: '',
  femur: '',
};

const BILATERAL_FIELDS: BilateralField[] = [
  {
    label: 'Antebraço',
    apiKey: 'forearm',
    rightKey: 'forearmRight',
    leftKey: 'forearmLeft',
  },
  {
    label: 'Braço relaxado',
    apiKey: 'relaxed_arm',
    rightKey: 'relaxedArmRight',
    leftKey: 'relaxedArmLeft',
  },
  {
    label: 'Braço contraído',
    apiKey: 'flexed_arm',
    rightKey: 'flexedArmRight',
    leftKey: 'flexedArmLeft',
  },
  {
    label: 'Coxa proximal',
    apiKey: 'proximal_thigh',
    rightKey: 'proximalThighRight',
    leftKey: 'proximalThighLeft',
  },
  {
    label: 'Coxa medial',
    apiKey: 'medial_thigh',
    rightKey: 'medialThighRight',
    leftKey: 'medialThighLeft',
  },
  {
    label: 'Coxa distal',
    apiKey: 'distal_thigh',
    rightKey: 'distalThighRight',
    leftKey: 'distalThighLeft',
  },
  {
    label: 'Panturrilha',
    apiKey: 'calf',
    rightKey: 'calfRight',
    leftKey: 'calfLeft',
  },
];

const CENTRAL_FIELDS: CentralField[] = [
  {
    label: 'Abdômen',
    apiKey: 'abdomen',
    formKey: 'abdomen',
  },
  {
    label: 'Cintura',
    apiKey: 'waist',
    formKey: 'waist',
  },
  {
    label: 'Ombro',
    apiKey: 'shoulder',
    formKey: 'shoulder',
  },
  {
    label: 'Quadril',
    apiKey: 'hip',
    formKey: 'hip',
  },
  {
    label: 'Tórax',
    apiKey: 'chest',
    formKey: 'chest',
  },
  {
    label: 'Pescoço',
    apiKey: 'neck',
    formKey: 'neck',
  },
];

const BONE_FIELDS: BoneField[] = [
  {
    label: 'Punho',
    apiKey: 'wrist',
    formKey: 'wrist',
  },
  {
    label: 'Úmero',
    apiKey: 'humerus',
    formKey: 'humerus',
  },
  {
    label: 'Fêmur',
    apiKey: 'femur',
    formKey: 'femur',
  },
];

export default function AnthropometryScreen() {
  const params =
    useLocalSearchParams<{
      uuid?: string | string[];
      readOnly?: string | string[];
    }>();

  const assessmentUuid =
    getParam(params.uuid);

  const readOnly =
    getParam(params.readOnly) === '1';

  const [
    data,
    setData,
  ] = useState<AssessmentAnthropometry | null>(
    null
  );

  const [
    form,
    setForm,
  ] = useState<FormState>(
    EMPTY_FORM
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    savedMessage,
    setSavedMessage,
  ] = useState('');

  const hydrate =
    useCallback(
      (
        response:
          AssessmentAnthropometry
      ) => {
        const c =
          response
            .anthropometry
            .circumferences;

        const b =
          response
            .anthropometry
            .bone_diameters;

        setForm({
          forearmRight:
            toInput(
              c.forearm?.right
            ),

          forearmLeft:
            toInput(
              c.forearm?.left
            ),

          relaxedArmRight:
            toInput(
              c.relaxed_arm?.right
            ),

          relaxedArmLeft:
            toInput(
              c.relaxed_arm?.left
            ),

          flexedArmRight:
            toInput(
              c.flexed_arm?.right
            ),

          flexedArmLeft:
            toInput(
              c.flexed_arm?.left
            ),

          proximalThighRight:
            toInput(
              c.proximal_thigh?.right
            ),

          proximalThighLeft:
            toInput(
              c.proximal_thigh?.left
            ),

          medialThighRight:
            toInput(
              c.medial_thigh?.right
            ),

          medialThighLeft:
            toInput(
              c.medial_thigh?.left
            ),

          distalThighRight:
            toInput(
              c.distal_thigh?.right
            ),

          distalThighLeft:
            toInput(
              c.distal_thigh?.left
            ),

          calfRight:
            toInput(
              c.calf?.right
            ),

          calfLeft:
            toInput(
              c.calf?.left
            ),

          abdomen:
            toInput(c.abdomen),

          waist:
            toInput(c.waist),

          shoulder:
            toInput(c.shoulder),

          hip:
            toInput(c.hip),

          chest:
            toInput(c.chest),

          neck:
            toInput(c.neck),

          wrist:
            toInput(b.wrist),

          humerus:
            toInput(b.humerus),

          femur:
            toInput(b.femur),
        });
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

          const response =
            await getAssessmentAnthropometry(
              assessmentUuid
            );

          setData(response);
          hydrate(response);
        } catch (exception) {
          setError(
            exception instanceof Error
              ? exception.message
              : 'Não foi possível carregar os perímetros.'
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

  const rcq =
    useMemo(
      () => {
        const waist =
          parsePreviewNumber(
            form.waist
          );

        const hip =
          parsePreviewNumber(
            form.hip
          );

        if (
          waist === null ||
          hip === null ||
          waist <= 0 ||
          hip <= 0
        ) {
          return null;
        }

        return roundRcq(
          waist / hip
        );
      },
      [
        form.waist,
        form.hip,
      ]
    );

  function changeValue(
    key: FormKey,
    value: string
  ) {
    const sanitized =
      value.replace(
        /[^0-9,.]/g,
        ''
      );

    setSavedMessage('');

    setForm(
      current => ({
        ...current,

        [key]:
          sanitized,
      })
    );
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

      const response =
        await updateAssessmentAnthropometry(
          assessmentUuid,
          {
            circumferences: {
              forearm: {
                right:
                  parseMeasurement(
                    form.forearmRight,
                    'Antebraço direito'
                  ),

                left:
                  parseMeasurement(
                    form.forearmLeft,
                    'Antebraço esquerdo'
                  ),
              },

              relaxed_arm: {
                right:
                  parseMeasurement(
                    form.relaxedArmRight,
                    'Braço relaxado direito'
                  ),

                left:
                  parseMeasurement(
                    form.relaxedArmLeft,
                    'Braço relaxado esquerdo'
                  ),
              },

              flexed_arm: {
                right:
                  parseMeasurement(
                    form.flexedArmRight,
                    'Braço contraído direito'
                  ),

                left:
                  parseMeasurement(
                    form.flexedArmLeft,
                    'Braço contraído esquerdo'
                  ),
              },

              proximal_thigh: {
                right:
                  parseMeasurement(
                    form.proximalThighRight,
                    'Coxa proximal direita'
                  ),

                left:
                  parseMeasurement(
                    form.proximalThighLeft,
                    'Coxa proximal esquerda'
                  ),
              },

              medial_thigh: {
                right:
                  parseMeasurement(
                    form.medialThighRight,
                    'Coxa medial direita'
                  ),

                left:
                  parseMeasurement(
                    form.medialThighLeft,
                    'Coxa medial esquerda'
                  ),
              },

              distal_thigh: {
                right:
                  parseMeasurement(
                    form.distalThighRight,
                    'Coxa distal direita'
                  ),

                left:
                  parseMeasurement(
                    form.distalThighLeft,
                    'Coxa distal esquerda'
                  ),
              },

              calf: {
                right:
                  parseMeasurement(
                    form.calfRight,
                    'Panturrilha direita'
                  ),

                left:
                  parseMeasurement(
                    form.calfLeft,
                    'Panturrilha esquerda'
                  ),
              },

              abdomen:
                parseMeasurement(
                  form.abdomen,
                  'Abdômen'
                ),

              waist:
                parseMeasurement(
                  form.waist,
                  'Cintura'
                ),

              shoulder:
                parseMeasurement(
                  form.shoulder,
                  'Ombro'
                ),

              hip:
                parseMeasurement(
                  form.hip,
                  'Quadril'
                ),

              chest:
                parseMeasurement(
                  form.chest,
                  'Tórax'
                ),

              neck:
                parseMeasurement(
                  form.neck,
                  'Pescoço'
                ),
            },

            bone_diameters: {
              wrist:
                parseMeasurement(
                  form.wrist,
                  'Punho'
                ),

              humerus:
                parseMeasurement(
                  form.humerus,
                  'Úmero'
                ),

              femur:
                parseMeasurement(
                  form.femur,
                  'Fêmur'
                ),
            },
          }
        );

      setData(response);
      hydrate(response);

      setSavedMessage(
        'Perímetros salvos com sucesso.'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar os perímetros.'
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
          Carregando perímetros...
        </Text>
      </SafeAreaView>
    );
  }

  if (
    !data &&
    error
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.errorPage
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={44}
            color="#B44747"
          />

          <Text
            style={
              styles.errorPageTitle
            }
          >
            Não foi possível abrir
            Perímetros
          </Text>

          <Text
            style={
              styles.errorPageText
            }
          >
            {error}
          </Text>

          <Pressable
            style={
              styles.errorBackButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.errorBackButtonText
              }
            >
              Voltar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <KeyboardAvoidingView
        style={
          styles.flex
        }
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View
          style={
            styles.flex
          }
        >
          <ScrollView
            style={
              styles.flex
            }
            contentContainerStyle={
              styles.content
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={
                styles.header
              }
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
                  styles.headerText
                }
              >
                <Text
                  style={
                    styles.headerEyebrow
                  }
                >
                  AVALIAÇÃO FÍSICA
                </Text>

                <Text
                  style={
                    styles.headerTitle
                  }
                >
                  Perímetros
                </Text>
              </View>
            </View>

            {error ? (
              <MessageBox
                kind="error"
                icon="alert-circle-outline"
                text={error}
              />
            ) : null}

            {savedMessage ? (
              <MessageBox
                kind="success"
                icon="checkmark-circle-outline"
                text={
                  savedMessage
                }
              />
            ) : null}

            {readOnly ? (
              <MessageBox
                kind="neutral"
                icon="lock-closed-outline"
                text="Esta avaliação está concluída. Os dados estão disponíveis somente para consulta."
              />
            ) : null}

            <StatusCard
              label={
                data?.section
                  .status_label ??
                'Não iniciada'
              }
              status={
                data?.section
                  .status ??
                'not_started'
              }
            />

            <SectionHeading
              index="01"
              eyebrow="PERÍMETROS"
              title="Medidas bilaterais"
              description="Informe os lados direito e esquerdo."
            />

            <View
              style={
                styles.tableCard
              }
            >
              <View
                style={
                  styles.tableHeader
                }
              >
                <Text
                  style={
                    styles.tableHeaderName
                  }
                >
                  Medida
                </Text>

                <Text
                  style={
                    styles.tableHeaderSide
                  }
                >
                  Direito
                </Text>

                <Text
                  style={
                    styles.tableHeaderSide
                  }
                >
                  Esquerdo
                </Text>
              </View>

              {BILATERAL_FIELDS.map(
                (
                  field,
                  index
                ) => {
                  const previous =
                    data?.previous
                      ?.circumferences[
                        field.apiKey
                      ];

                  return (
                    <BilateralRow
                      key={
                        field.apiKey
                      }
                      label={
                        field.label
                      }
                      rightValue={
                        form[
                          field
                            .rightKey
                        ]
                      }
                      leftValue={
                        form[
                          field
                            .leftKey
                        ]
                      }
                      previousRight={
                        previous
                          ?.right ??
                        null
                      }
                      previousLeft={
                        previous
                          ?.left ??
                        null
                      }
                      readOnly={
                        readOnly
                      }
                      last={
                        index ===
                        BILATERAL_FIELDS.length -
                          1
                      }
                      onChangeRight={
                        value =>
                          changeValue(
                            field
                              .rightKey,
                            value
                          )
                      }
                      onChangeLeft={
                        value =>
                          changeValue(
                            field
                              .leftKey,
                            value
                          )
                      }
                    />
                  );
                }
              )}
            </View>

            <SectionHeading
              index="02"
              eyebrow="PERÍMETROS"
              title="Medidas centrais"
              description="Cintura e quadril alimentam automaticamente o cálculo do RCQ."
            />

            <View
              style={
                styles.listCard
              }
            >
              {CENTRAL_FIELDS.map(
                (
                  field,
                  index
                ) => (
                  <SingleMeasureRow
                    key={
                      field.apiKey
                    }
                    label={
                      field.label
                    }
                    value={
                      form[
                        field.formKey
                      ]
                    }
                    previous={
                      data
                        ?.previous
                        ?.circumferences[
                          field.apiKey
                        ] ??
                      null
                    }
                    readOnly={
                      readOnly
                    }
                    last={
                      index ===
                      CENTRAL_FIELDS.length -
                        1
                    }
                    onChangeText={
                      value =>
                        changeValue(
                          field.formKey,
                          value
                        )
                    }
                  />
                )
              )}
            </View>

            <RcqCard
              value={rcq}
              previousValue={
                data?.previous
                  ?.results
                  .waist_to_hip_ratio
                  ?.value ??
                null
              }
            />

            <SectionHeading
              index="03"
              eyebrow="ESTRUTURA ÓSSEA"
              title="Diâmetros ósseos"
              description="Registre as medidas em centímetros."
            />

            <View
              style={
                styles.listCard
              }
            >
              {BONE_FIELDS.map(
                (
                  field,
                  index
                ) => (
                  <SingleMeasureRow
                    key={
                      field.apiKey
                    }
                    label={
                      field.label
                    }
                    value={
                      form[
                        field.formKey
                      ]
                    }
                    previous={
                      data
                        ?.previous
                        ?.bone_diameters[
                          field.apiKey
                        ] ??
                      null
                    }
                    readOnly={
                      readOnly
                    }
                    last={
                      index ===
                      BONE_FIELDS.length -
                        1
                    }
                    onChangeText={
                      value =>
                        changeValue(
                          field.formKey,
                          value
                        )
                    }
                  />
                )
              )}
            </View>

            {data?.previous ? (
              <View
                style={
                  styles.previousInfo
                }
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#40856C"
                />

                <Text
                  style={
                    styles.previousInfoText
                  }
                >
                  “Anterior” corresponde
                  à avaliação de{' '}
                  {formatDate(
                    data.previous
                      .evaluation_date
                  )}.
                </Text>
              </View>
            ) : null}

            <View
              style={
                styles.scrollBottomSpace
              }
            />
          </ScrollView>

          {!readOnly ? (
            <View
              style={
                styles.footerBar
              }
            >
              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.saveButton,

                  saving &&
                    styles.saveButtonDisabled,

                  pressed &&
                    !saving &&
                    styles.saveButtonPressed,
                ]}
                disabled={
                  saving
                }
                onPress={
                  handleSave
                }
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="save-outline"
                    size={21}
                    color="#FFFFFF"
                  />
                )}

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {saving
                    ? 'Salvando...'
                    : 'Salvar perímetros'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type MessageBoxProps = {
  kind:
    | 'error'
    | 'success'
    | 'neutral';

  icon:
    keyof typeof Ionicons.glyphMap;

  text: string;
};

function MessageBox({
  kind,
  icon,
  text,
}: MessageBoxProps) {
  return (
    <View
      style={[
        styles.messageBox,

        kind === 'error' &&
          styles.messageBoxError,

        kind === 'success' &&
          styles.messageBoxSuccess,

        kind === 'neutral' &&
          styles.messageBoxNeutral,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={
          kind === 'error'
            ? '#B44747'
            : kind ===
                'success'
              ? '#40856C'
              : '#66777C'
        }
      />

      <Text
        style={[
          styles.messageText,

          kind === 'error' &&
            styles.messageTextError,

          kind === 'success' &&
            styles.messageTextSuccess,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

type StatusCardProps = {
  label: string;
  status:
    | string
    | null;
};

function StatusCard({
  label,
  status,
}: StatusCardProps) {
  const inProgress =
    status === 'in_progress';

  const completed =
    status === 'completed';

  return (
    <View
      style={
        styles.statusCard
      }
    >
      <View
        style={
          styles.statusIcon
        }
      >
        <Ionicons
          name="body-outline"
          size={26}
          color="#40856C"
        />
      </View>

      <View
        style={
          styles.statusContent
        }
      >
        <Text
          style={
            styles.statusEyebrow
          }
        >
          SITUAÇÃO DA SEÇÃO
        </Text>

        <View
          style={
            styles.statusTitleRow
          }
        >
          <Text
            style={
              styles.statusTitle
            }
          >
            {label}
          </Text>

          <View
            style={[
              styles.statusDot,

              inProgress &&
                styles.statusDotProgress,

              completed &&
                styles.statusDotCompleted,
            ]}
          />
        </View>

        <Text
          style={
            styles.statusDescription
          }
        >
          Os dados podem ser salvos e
          retomados posteriormente.
        </Text>
      </View>
    </View>
  );
}

type SectionHeadingProps = {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
};

function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <View
      style={
        styles.sectionHeading
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
          {index}
        </Text>
      </View>

      <View
        style={
          styles.sectionHeadingText
        }
      >
        <Text
          style={
            styles.sectionEyebrow
          }
        >
          {eyebrow}
        </Text>

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

type BilateralRowProps = {
  label: string;

  rightValue: string;

  leftValue: string;

  previousRight:
    | number
    | null;

  previousLeft:
    | number
    | null;

  readOnly: boolean;

  last: boolean;

  onChangeRight:
    (value: string) => void;

  onChangeLeft:
    (value: string) => void;
};

function BilateralRow({
  label,
  rightValue,
  leftValue,
  previousRight,
  previousLeft,
  readOnly,
  last,
  onChangeRight,
  onChangeLeft,
}: BilateralRowProps) {
  return (
    <View
      style={[
        styles.tableRow,

        last &&
          styles.tableRowLast,
      ]}
    >
      <Text
        style={
          styles.tableRowLabel
        }
      >
        {label}
      </Text>

      <CompactMeasureInput
        value={
          rightValue
        }
        previous={
          previousRight
        }
        readOnly={
          readOnly
        }
        onChangeText={
          onChangeRight
        }
      />

      <CompactMeasureInput
        value={
          leftValue
        }
        previous={
          previousLeft
        }
        readOnly={
          readOnly
        }
        onChangeText={
          onChangeLeft
        }
      />
    </View>
  );
}

type CompactMeasureInputProps = {
  value: string;

  previous:
    | number
    | null;

  readOnly: boolean;

  onChangeText:
    (value: string) => void;
};

function CompactMeasureInput({
  value,
  previous,
  readOnly,
  onChangeText,
}: CompactMeasureInputProps) {
  return (
    <View
      style={
        styles.compactCell
      }
    >
      <View
        style={[
          styles.compactInputBox,

          readOnly &&
            styles.inputBoxReadOnly,
        ]}
      >
        <TextInput
          style={[
            styles.compactInput,

            readOnly &&
              styles.inputReadOnly,
          ]}
          value={value}
          editable={
            !readOnly
          }
          keyboardType="decimal-pad"
          placeholder="0,0"
          placeholderTextColor="#A5B0B3"
          selectTextOnFocus
          onChangeText={
            onChangeText
          }
        />

        <Text
          style={
            styles.compactUnit
          }
        >
          cm
        </Text>
      </View>

      {previous !== null ? (
        <Text
          style={
            styles.compactPrevious
          }
          numberOfLines={1}
        >
          ant.{' '}
          {formatMeasurement(
            previous
          )}
        </Text>
      ) : (
        <View
          style={
            styles.compactPreviousSpacer
          }
        />
      )}
    </View>
  );
}

type SingleMeasureRowProps = {
  label: string;

  value: string;

  previous:
    | number
    | null;

  readOnly: boolean;

  last: boolean;

  onChangeText:
    (value: string) => void;
};

function SingleMeasureRow({
  label,
  value,
  previous,
  readOnly,
  last,
  onChangeText,
}: SingleMeasureRowProps) {
  return (
    <View
      style={[
        styles.singleRow,

        last &&
          styles.singleRowLast,
      ]}
    >
      <View
        style={
          styles.singleLabelBox
        }
      >
        <Text
          style={
            styles.singleLabel
          }
        >
          {label}
        </Text>

        {previous !== null ? (
          <Text
            style={
              styles.singlePrevious
            }
          >
            Anterior:{' '}
            {formatMeasurement(
              previous
            )}{' '}
            cm
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.singleInputBox,

          readOnly &&
            styles.inputBoxReadOnly,
        ]}
      >
        <TextInput
          style={[
            styles.singleInput,

            readOnly &&
              styles.inputReadOnly,
          ]}
          value={value}
          editable={
            !readOnly
          }
          keyboardType="decimal-pad"
          placeholder="0,0"
          placeholderTextColor="#A5B0B3"
          selectTextOnFocus
          onChangeText={
            onChangeText
          }
        />

        <Text
          style={
            styles.singleUnit
          }
        >
          cm
        </Text>
      </View>
    </View>
  );
}

type RcqCardProps = {
  value:
    | number
    | null;

  previousValue:
    | number
    | null;
};

function RcqCard({
  value,
  previousValue,
}: RcqCardProps) {
  return (
    <View
      style={
        styles.rcqCard
      }
    >
      <View
        style={
          styles.rcqTop
        }
      >
        <View
          style={
            styles.rcqIcon
          }
        >
          <Ionicons
            name="calculator-outline"
            size={22}
            color="#40856C"
          />
        </View>

        <View
          style={
            styles.rcqHeading
          }
        >
          <Text
            style={
              styles.rcqEyebrow
            }
          >
            RELAÇÃO
            CINTURA-QUADRIL
          </Text>

          <Text
            style={
              styles.rcqTitle
            }
          >
            RCQ atual
          </Text>
        </View>

        {previousValue !==
        null ? (
          <View
            style={
              styles.rcqPreviousBadge
            }
          >
            <Text
              style={
                styles.rcqPreviousLabel
              }
            >
              ANTERIOR
            </Text>

            <Text
              style={
                styles.rcqPreviousValue
              }
            >
              {previousValue.toFixed(
                4
              )}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={
          styles.rcqValue
        }
      >
        {value !== null
          ? value.toFixed(4)
          : '—'}
      </Text>

      <Text
        style={
          styles.rcqFormula
        }
      >
        cintura ÷ quadril
      </Text>

      <View
        style={
          styles.rcqNotice
        }
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color="#55786C"
        />

        <Text
          style={
            styles.rcqNoticeText
          }
        >
          A classificação permanece
          desabilitada até validação
          profissional da tabela de
          referência.
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

  return String(value).replace(
    '.',
    ','
  );
}

function parsePreviewNumber(
  value: string
): number | null {
  const normalized =
    value
      .trim()
      .replace(
        ',',
        '.'
      );

  if (!normalized) {
    return null;
  }

  const parsed =
    Number(normalized);

  if (
    !Number.isFinite(parsed)
  ) {
    return null;
  }

  return parsed;
}

function parseMeasurement(
  value: string,
  label: string
): number | null {
  const normalized =
    value
      .trim()
      .replace(
        ',',
        '.'
      );

  if (!normalized) {
    return null;
  }

  const parsed =
    Number(normalized);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      `${label}: informe um valor maior que zero.`
    );
  }

  if (parsed > 999.99) {
    throw new Error(
      `${label}: valor informado é inválido.`
    );
  }

  return parsed;
}

function roundRcq(
  value: number
): number {
  return (
    Math.round(
      value * 10000
    ) / 10000
  );
}

function formatMeasurement(
  value: number
): string {
  return String(value).replace(
    '.',
    ','
  );
}

function formatDate(
  value: string
): string {
  const parts =
    value.split('-');

  if (
    parts.length !== 3
  ) {
    return value;
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
      fontSize: 15,
      color: '#66777C',
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 20,
    },

    scrollBottomSpace: {
      height: 6,
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
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#DEE7E4',
    },

    headerText: {
      flex: 1,
    },

    headerEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: '#40856C',
    },

    headerTitle: {
      marginTop: 2,
      fontSize: 27,
      fontWeight: '800',
      color: '#123C47',
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

    messageBoxError: {
      backgroundColor: '#FFF0F0',
      borderColor: '#EFC9C9',
    },

    messageBoxSuccess: {
      backgroundColor: '#EDF7F2',
      borderColor: '#CAE4D8',
    },

    messageBoxNeutral: {
      backgroundColor: '#EEF2F3',
      borderColor: '#DDE5E7',
    },

    messageText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: '#66777C',
    },

    messageTextError: {
      color: '#9A4141',
    },

    messageTextSuccess: {
      color: '#476D60',
    },

    statusCard: {
      flexDirection: 'row',
      gap: 14,
      padding: 17,
      marginBottom: 24,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#DFE8E5',
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
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#77888C',
    },

    statusTitleRow: {
      marginTop: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    statusTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#123C47',
    },

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#B7C2C5',
    },

    statusDotProgress: {
      backgroundColor: '#DDA34C',
    },

    statusDotCompleted: {
      backgroundColor: '#40856C',
    },

    statusDescription: {
      marginTop: 5,
      fontSize: 12,
      lineHeight: 17,
      color: '#697A7F',
    },

    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
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
      fontSize: 11,
      fontWeight: '900',
      color: '#40856C',
    },

    sectionHeadingText: {
      flex: 1,
    },

    sectionEyebrow: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#40856C',
    },

    sectionTitle: {
      marginTop: 2,
      fontSize: 19,
      fontWeight: '800',
      color: '#123C47',
    },

    sectionDescription: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 18,
      color: '#697A7F',
    },

    tableCard: {
      overflow: 'hidden',
      marginBottom: 24,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#DFE8E5',
    },

    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 39,
      paddingHorizontal: 13,
      backgroundColor: '#EFF5F2',
      borderBottomWidth: 1,
      borderBottomColor: '#DFE8E5',
    },

    tableHeaderName: {
      flex: 1,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#64777B',
    },

    tableHeaderSide: {
      width: 84,
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
      color: '#64777B',
    },

    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 73,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#EDF1F0',
    },

    tableRowLast: {
      borderBottomWidth: 0,
    },

    tableRowLabel: {
      flex: 1,
      paddingRight: 8,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 17,
      color: '#334E55',
    },

    compactCell: {
      width: 84,
      alignItems: 'stretch',
      marginLeft: 5,
    },

    compactInputBox: {
      height: 39,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#D4DFDC',
      backgroundColor: '#FAFCFB',
    },

    compactInput: {
      flex: 1,
      minWidth: 0,
      paddingLeft: 7,
      paddingRight: 2,
      fontSize: 13,
      fontWeight: '700',
      color: '#123C47',
    },

    compactUnit: {
      paddingRight: 6,
      fontSize: 9,
      fontWeight: '700',
      color: '#849195',
    },

    compactPrevious: {
      height: 15,
      marginTop: 3,
      textAlign: 'center',
      fontSize: 9,
      color: '#729084',
    },

    compactPreviousSpacer: {
      height: 18,
    },

    inputBoxReadOnly: {
      backgroundColor: '#EFF3F2',
    },

    inputReadOnly: {
      color: '#6E7C80',
    },

    listCard: {
      overflow: 'hidden',
      marginBottom: 18,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#DFE8E5',
    },

    singleRow: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: '#EDF1F0',
    },

    singleRowLast: {
      borderBottomWidth: 0,
    },

    singleLabelBox: {
      flex: 1,
    },

    singleLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#334E55',
    },

    singlePrevious: {
      marginTop: 3,
      fontSize: 9,
      color: '#729084',
    },

    singleInputBox: {
      width: 122,
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      borderRadius: 11,
      borderWidth: 1,
      borderColor: '#D4DFDC',
      backgroundColor: '#FAFCFB',
    },

    singleInput: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 10,
      fontSize: 15,
      fontWeight: '700',
      color: '#123C47',
    },

    singleUnit: {
      paddingRight: 10,
      fontSize: 10,
      fontWeight: '700',
      color: '#849195',
    },

    rcqCard: {
      padding: 17,
      marginBottom: 24,
      borderRadius: 20,
      backgroundColor: '#EAF4F0',
      borderWidth: 1,
      borderColor: '#CDE3D9',
    },

    rcqTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    rcqIcon: {
      width: 43,
      height: 43,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
    },

    rcqHeading: {
      flex: 1,
      marginLeft: 10,
    },

    rcqEyebrow: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.7,
      color: '#40856C',
    },

    rcqTitle: {
      marginTop: 2,
      fontSize: 16,
      fontWeight: '800',
      color: '#123C47',
    },

    rcqPreviousBadge: {
      alignItems: 'flex-end',
      paddingLeft: 8,
    },

    rcqPreviousLabel: {
      fontSize: 7,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#72867E',
    },

    rcqPreviousValue: {
      marginTop: 1,
      fontSize: 14,
      fontWeight: '800',
      color: '#567267',
    },

    rcqValue: {
      marginTop: 14,
      fontSize: 36,
      fontWeight: '900',
      color: '#123C47',
    },

    rcqFormula: {
      marginTop: 1,
      fontSize: 11,
      color: '#637A72',
    },

    rcqNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 7,
      marginTop: 13,
    },

    rcqNoticeText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 17,
      color: '#557068',
    },

    previousInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      padding: 13,
      marginBottom: 8,
      borderRadius: 14,
      backgroundColor: '#EDF5F2',
    },

    previousInfoText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 17,
      color: '#587168',
    },

    footerBar: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#DEE7E4',
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
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
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
      fontSize: 21,
      fontWeight: '800',
      color: '#123C47',
    },

    errorPageText: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 21,
      color: '#6B777B',
    },

    errorBackButton: {
      marginTop: 20,
      paddingHorizontal: 22,
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: '#123C47',
    },

    errorBackButtonText: {
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
