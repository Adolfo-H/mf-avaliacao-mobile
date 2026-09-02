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

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  getAssessmentBodyComposition,
  updateAssessmentBodyComposition,
} from '@/services/body-composition';

import {
  AssessmentBodyComposition,
  BodyCompositionProtocolKey,
  BodyCompositionProtocolOption,
} from '@/types/body-composition';

type SkinfoldKey =
  | 'subscapular'
  | 'chest'
  | 'suprailiac'
  | 'thigh'
  | 'triceps'
  | 'midaxillary'
  | 'abdominal';

const SKINFOLDS: {
  key: SkinfoldKey;
  label: string;
}[] = [
  {
    key: 'subscapular',
    label: 'Subescapular',
  },
  {
    key: 'chest',
    label: 'Peitoral',
  },
  {
    key: 'suprailiac',
    label: 'Supra-ilíaca',
  },
  {
    key: 'thigh',
    label: 'Coxa',
  },
  {
    key: 'triceps',
    label: 'Tricipital',
  },
  {
    key: 'midaxillary',
    label: 'Axilar média',
  },
  {
    key: 'abdominal',
    label: 'Abdominal',
  },
];

export default function BodyCompositionScreen() {
  const params =
    useLocalSearchParams<{
      uuid?: string | string[];
      readOnly?: string | string[];
    }>();

  const assessmentUuid =
    getParam(params.uuid);

  const readOnly =
    getParam(
      params.readOnly
    ) === '1';

  const [
    loadedData,
    setLoadedData,
  ] =
    useState<AssessmentBodyComposition | null>(
      null
    );

  const [
    protocol,
    setProtocol,
  ] =
    useState<BodyCompositionProtocolKey | null>(
      null
    );

  const [
    weight,
    setWeight,
  ] = useState('');

  const [
    height,
    setHeight,
  ] = useState('');

  const [
    targetBodyFat,
    setTargetBodyFat,
  ] = useState('');

  const [
    skinfolds,
    setSkinfolds,
  ] = useState<
    Record<
      SkinfoldKey,
      string
    >
  >({
    subscapular: '',
    chest: '',
    suprailiac: '',
    thigh: '',
    triceps: '',
    midaxillary: '',
    abdominal: '',
  });

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
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const hydrate =
    useCallback(
      (
        data: AssessmentBodyComposition
      ) => {
        const payload =
          data.body_composition ??
          {};

        const currentSkinfolds =
          payload.skinfolds ??
          {};

        setLoadedData(data);

        setProtocol(
          payload.protocol ??
            null
        );

        setWeight(
          numberToBrazilianInput(
            payload.weight_kg
          )
        );

        setHeight(
          numberToBrazilianInput(
            payload.height_m
          )
        );

        setTargetBodyFat(
          numberToBrazilianInput(
            payload.target_body_fat_percentage
          )
        );

        setSkinfolds({
          subscapular:
            numberToBrazilianInput(
              currentSkinfolds.subscapular
            ),

          chest:
            numberToBrazilianInput(
              currentSkinfolds.chest
            ),

          suprailiac:
            numberToBrazilianInput(
              currentSkinfolds.suprailiac
            ),

          thigh:
            numberToBrazilianInput(
              currentSkinfolds.thigh
            ),

          triceps:
            numberToBrazilianInput(
              currentSkinfolds.triceps
            ),

          midaxillary:
            numberToBrazilianInput(
              currentSkinfolds.midaxillary
            ),

          abdominal:
            numberToBrazilianInput(
              currentSkinfolds.abdominal
            ),
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

          const data =
            await getAssessmentBodyComposition(
              assessmentUuid
            );

          hydrate(data);
        } catch (exception) {
          setError(
            exception instanceof Error
              ? exception.message
              : 'Não foi possível carregar a composição corporal.'
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

  function handleProtocol(
    option: BodyCompositionProtocolOption
  ) {
    if (readOnly) {
      return;
    }

    if (
      !option.fields_configured
    ) {
      setError(
        `${option.label} ainda aguarda definição dos campos e fórmulas.`
      );

      return;
    }

    setProtocol(
      option.key
    );

    setError('');
    setSuccessMessage('');
  }

  function handleSkinfold(
    key: SkinfoldKey,
    value: string
  ) {
    setSkinfolds(
      (current) => ({
        ...current,

        [key]:
          sanitizeDecimalInput(
            value
          ),
      })
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
      const weightValue =
        parseOptionalDecimal(
          weight,
          'Peso',
          0,
          999.99,
          false
        );

      const heightValue =
        parseOptionalDecimal(
          height,
          'Altura',
          0,
          5,
          false
        );

      const targetValue =
        parseOptionalDecimal(
          targetBodyFat,
          'Meta de gordura',
          0,
          100,
          true
        );

      const parsedSkinfolds = {
        subscapular:
          parseOptionalDecimal(
            skinfolds.subscapular,
            'Dobra subescapular',
            0,
            999,
            true
          ),

        chest:
          parseOptionalDecimal(
            skinfolds.chest,
            'Dobra peitoral',
            0,
            999,
            true
          ),

        suprailiac:
          parseOptionalDecimal(
            skinfolds.suprailiac,
            'Dobra supra-ilíaca',
            0,
            999,
            true
          ),

        thigh:
          parseOptionalDecimal(
            skinfolds.thigh,
            'Dobra da coxa',
            0,
            999,
            true
          ),

        triceps:
          parseOptionalDecimal(
            skinfolds.triceps,
            'Dobra tricipital',
            0,
            999,
            true
          ),

        midaxillary:
          parseOptionalDecimal(
            skinfolds.midaxillary,
            'Dobra axilar média',
            0,
            999,
            true
          ),

        abdominal:
          parseOptionalDecimal(
            skinfolds.abdominal,
            'Dobra abdominal',
            0,
            999,
            true
          ),
      };

      setSaving(true);
      setError('');
      setSuccessMessage('');

      const updated =
        await updateAssessmentBodyComposition(
          assessmentUuid,
          {
            protocol,

            weight_kg:
              weightValue,

            height_m:
              heightValue,

            target_body_fat_percentage:
              targetValue,

            skinfolds:
              parsedSkinfolds,
          }
        );

      hydrate(updated);

      setSuccessMessage(
        'Composição corporal salva com sucesso.'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar a composição corporal.'
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
          Carregando composição
          corporal...
        </Text>
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
        style={styles.flex}
        behavior={
          Platform.OS ===
          'ios'
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
                Composição corporal
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
            title="Protocolo"
            description="Selecione o protocolo utilizado nesta avaliação."
          />

          <View
            style={
              styles.protocolsList
            }
          >
            {loadedData
              ?.protocols
              .map(
                (option) => (
                  <ProtocolCard
                    key={
                      option.key
                    }
                    option={
                      option
                    }
                    selected={
                      protocol ===
                      option.key
                    }
                    disabled={
                      readOnly
                    }
                    onPress={() =>
                      handleProtocol(
                        option
                      )
                    }
                  />
                )
              )}
          </View>

          <SectionTitle
            number="2"
            title="Medidas básicas"
            description="Informe peso, altura e meta de percentual de gordura."
          />

          <View
            style={styles.card}
          >
            <MetricField
              label="Peso"
              value={weight}
              suffix="kg"
              placeholder="80,00"
              previousValue={
                loadedData
                  ?.previous
                  ?.weight_kg
              }
              editable={
                !readOnly
              }
              onChangeText={(
                value
              ) =>
                setWeight(
                  sanitizeDecimalInput(
                    value
                  )
                )
              }
            />

            <MetricField
              label="Altura"
              value={height}
              suffix="m"
              placeholder="1,80"
              previousValue={
                loadedData
                  ?.previous
                  ?.height_m
              }
              editable={
                !readOnly
              }
              onChangeText={(
                value
              ) =>
                setHeight(
                  sanitizeDecimalInput(
                    value
                  )
                )
              }
            />

            <MetricField
              label="Meta de gordura"
              value={
                targetBodyFat
              }
              suffix="%"
              placeholder="15,00"
              previousValue={
                loadedData
                  ?.previous
                  ?.target_body_fat_percentage
              }
              editable={
                !readOnly
              }
              onChangeText={(
                value
              ) =>
                setTargetBodyFat(
                  sanitizeDecimalInput(
                    value
                  )
                )
              }
            />
          </View>

          <SectionTitle
            number="3"
            title="Resultados"
            description="Resultados disponíveis com as fórmulas atualmente validadas."
          />

          <View
            style={
              styles.resultsCard
            }
          >
            <ResultItem
              label="IMC"
              value={
                loadedData
                  ?.results
                  .bmi
                  ?.value !==
                undefined &&
                loadedData
                  ?.results
                  .bmi
                  ?.value !==
                null
                  ? formatBrazilianNumber(
                      loadedData
                        .results
                        .bmi
                        .value,
                      2
                    )
                  : 'Não calculado'
              }
              available={
                loadedData
                  ?.results
                  .bmi !== null
              }
            />

            <View
              style={
                styles.resultDivider
              }
            />

            <ResultItem
              label="Classificação do IMC"
              value="Aguardando validação da tabela"
              available={false}
            />

            <View
              style={
                styles.resultDivider
              }
            />

            <ResultItem
              label="Percentual de gordura"
              value="Aguardando validação da fórmula"
              available={false}
            />
          </View>

          <View
            style={
              styles.infoBox
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={21}
              color="#40856C"
            />

            <Text
              style={
                styles.infoText
              }
            >
              O IMC já pode ser
              calculado porque sua
              fórmula está definida.
              Percentual de gordura,
              classificação e demais
              resultados serão
              habilitados após a
              validação profissional
              dos protocolos.
            </Text>
          </View>

          {protocol ===
          'pollock_7' ? (
            <>
              <SectionTitle
                number="4"
                title="Dobras cutâneas"
                description="Pollock de 7 dobras — valores em milímetros."
              />

              <View
                style={
                  styles.card
                }
              >
                {SKINFOLDS.map(
                  (
                    skinfold
                  ) => (
                    <MetricField
                      key={
                        skinfold.key
                      }
                      label={
                        skinfold.label
                      }
                      value={
                        skinfolds[
                          skinfold
                            .key
                        ]
                      }
                      suffix="mm"
                      placeholder="0,00"
                      previousValue={
                        loadedData
                          ?.previous
                          ?.skinfolds?.[
                          skinfold
                            .key
                        ]
                      }
                      editable={
                        !readOnly
                      }
                      onChangeText={(
                        value
                      ) =>
                        handleSkinfold(
                          skinfold.key,
                          value
                        )
                      }
                    />
                  )
                )}
              </View>

              <View
                style={
                  styles.warningBox
                }
              >
                <Ionicons
                  name="calculator-outline"
                  size={21}
                  color="#A66A19"
                />

                <Text
                  style={
                    styles.warningText
                  }
                >
                  As sete dobras podem
                  ser registradas, mas
                  o cálculo do
                  percentual de gordura
                  do Pollock 7 ainda
                  aguarda validação da
                  equação pela
                  profissional
                  responsável.
                </Text>
              </View>
            </>
          ) : null}

          {loadedData
            ?.previous ? (
            <>
              <SectionTitle
                number="5"
                title="Avaliação anterior"
                description="Referência imediatamente anterior à data desta avaliação."
              />

              <View
                style={
                  styles.previousCard
                }
              >
                <View
                  style={
                    styles.previousHeader
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color="#40856C"
                  />

                  <Text
                    style={
                      styles.previousDate
                    }
                  >
                    {formatDate(
                      loadedData
                        .previous
                        .evaluation_date
                    )}
                  </Text>
                </View>

                <PreviousRow
                  label="Peso"
                  value={
                    loadedData
                      .previous
                      .weight_kg
                  }
                  suffix="kg"
                />

                <PreviousRow
                  label="Altura"
                  value={
                    loadedData
                      .previous
                      .height_m
                  }
                  suffix="m"
                />

                <PreviousRow
                  label="Meta de gordura"
                  value={
                    loadedData
                      .previous
                      .target_body_fat_percentage
                  }
                  suffix="%"
                />
              </View>
            </>
          ) : null}

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
                      Salvar composição
                    </Text>
                  </>
                )}
              </Pressable>

              <Text
                style={
                  styles.saveHint
                }
              >
                O preenchimento pode
                ser salvo parcialmente
                e retomado depois.
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

type ProtocolCardProps = {
  option: BodyCompositionProtocolOption;

  selected: boolean;

  disabled: boolean;

  onPress: () => void;
};

function ProtocolCard({
  option,
  selected,
  disabled,
  onPress,
}: ProtocolCardProps) {
  const available =
    option.fields_configured;

  return (
    <Pressable
      style={[
        styles.protocolCard,

        selected &&
          styles.protocolCardSelected,

        disabled &&
          styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <View
        style={[
          styles.protocolIcon,

          selected &&
            styles.protocolIconSelected,
        ]}
      >
        <Ionicons
          name={
            available
              ? 'checkmark-circle-outline'
              : 'time-outline'
          }
          size={22}
          color={
            selected
              ? '#FFFFFF'
              : available
                ? '#40856C'
                : '#9AA4A7'
          }
        />
      </View>

      <View
        style={
          styles.protocolContent
        }
      >
        <Text
          style={
            styles.protocolName
          }
        >
          {option.label}
        </Text>

        <Text
          style={[
            styles.protocolDescription,

            !available &&
              styles.protocolUnavailableText,
          ]}
        >
          {available
            ? option.calculation_configured
              ? 'Campos e cálculo configurados'
              : 'Campos disponíveis — fórmula aguardando validação'
            : 'Aguardando configuração'}
        </Text>
      </View>

      <View
        style={[
          styles.radio,

          selected &&
            styles.radioSelected,
        ]}
      >
        {selected ? (
          <View
            style={
              styles.radioInner
            }
          />
        ) : null}
      </View>
    </Pressable>
  );
}

type MetricFieldProps = {
  label: string;

  value: string;

  suffix: string;

  placeholder: string;

  previousValue?:
    | number
    | null;

  editable: boolean;

  onChangeText: (
    value: string
  ) => void;
};

function MetricField({
  label,
  value,
  suffix,
  placeholder,
  previousValue,
  editable,
  onChangeText,
}: MetricFieldProps) {
  return (
    <View
      style={
        styles.metricField
      }
    >
      <View
        style={
          styles.metricHeader
        }
      >
        <Text
          style={
            styles.fieldLabel
          }
        >
          {label}
        </Text>

        {previousValue !==
          null &&
        previousValue !==
          undefined ? (
          <Text
            style={
              styles.previousValue
            }
          >
            Última:{' '}
            {formatBrazilianNumber(
              previousValue,
              2
            )}{' '}
            {suffix}
          </Text>
        ) : null}
      </View>

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
          keyboardType="decimal-pad"
          editable={editable}
          style={
            styles.input
          }
          onChangeText={
            onChangeText
          }
        />

        <Text
          style={
            styles.inputSuffix
          }
        >
          {suffix}
        </Text>
      </View>
    </View>
  );
}

function ResultItem({
  label,
  value,
  available,
}: {
  label: string;
  value: string;
  available: boolean;
}) {
  return (
    <View
      style={
        styles.resultItem
      }
    >
      <View
        style={[
          styles.resultIcon,

          !available &&
            styles.resultIconUnavailable,
        ]}
      >
        <Ionicons
          name={
            available
              ? 'calculator-outline'
              : 'lock-closed-outline'
          }
          size={20}
          color={
            available
              ? '#40856C'
              : '#899497'
          }
        />
      </View>

      <View style={styles.flex}>
        <Text
          style={
            styles.resultLabel
          }
        >
          {label}
        </Text>

        <Text
          style={[
            styles.resultValue,

            !available &&
              styles.resultValueUnavailable,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function PreviousRow({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix: string;
}) {
  return (
    <View
      style={
        styles.previousRow
      }
    >
      <Text
        style={
          styles.previousRowLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.previousRowValue
        }
      >
        {value !== null
          ? `${formatBrazilianNumber(
              value,
              2
            )} ${suffix}`
          : 'Não informado'}
      </Text>
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

function sanitizeDecimalInput(
  value: string
): string {
  let normalized =
    value
      .replace(/\s/g, '')
      .replace(/[^\d,.]/g, '');

  const firstSeparator =
    normalized.search(
      /[,.]/
    );

  if (
    firstSeparator !== -1
  ) {
    const integerPart =
      normalized.slice(
        0,
        firstSeparator
      );

    const decimalPart =
      normalized
        .slice(
          firstSeparator + 1
        )
        .replace(
          /[,.]/g,
          ''
        );

    normalized =
      `${integerPart},${decimalPart}`;
  }

  return normalized;
}

function parseOptionalDecimal(
  value: string,
  label: string,
  min: number,
  max: number,
  allowZero: boolean
): number | null {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    !/^\d+(?:[,.]\d+)?$/.test(
      normalized
    )
  ) {
    throw new Error(
      `${label} deve ser um número válido.`
    );
  }

  const number =
    Number(
      normalized.replace(
        ',',
        '.'
      )
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    throw new Error(
      `${label} possui um valor inválido.`
    );
  }

  if (
    !allowZero &&
    number <= min
  ) {
    throw new Error(
      `${label} deve ser maior que ${min}.`
    );
  }

  if (
    allowZero &&
    number < min
  ) {
    throw new Error(
      `${label} não pode ser menor que ${min}.`
    );
  }

  if (number > max) {
    throw new Error(
      `${label} possui um valor acima do permitido.`
    );
  }

  return number;
}

function numberToBrazilianInput(
  value?: number | null
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(
    value
  ).replace('.', ',');
}

function formatBrazilianNumber(
  value: number,
  decimals = 2
): string {
  return value.toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits:
        decimals,

      maximumFractionDigits:
        decimals,
    }
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
      textAlign: 'center',
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
      fontSize: 25,
      fontWeight: '800',
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

    protocolsList: {
      gap: 9,
      marginBottom: 28,
    },

    protocolCard: {
      minHeight: 74,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      backgroundColor:
        '#FFFFFF',
      padding: 13,
      flexDirection: 'row',
      alignItems: 'center',
    },

    protocolCardSelected: {
      borderColor:
        '#8BB9A5',
      backgroundColor:
        '#F2F8F5',
    },

    protocolIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 12,
    },

    protocolIconSelected: {
      backgroundColor:
        '#40856C',
    },

    protocolContent: {
      flex: 1,
    },

    protocolName: {
      color: '#172D34',
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 4,
    },

    protocolDescription: {
      color: '#668078',
      fontSize: 10,
      lineHeight: 14,
    },

    protocolUnavailableText: {
      color: '#9AA4A7',
    },

    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor:
        '#C7D1CE',
      alignItems: 'center',
      justifyContent:
        'center',
      marginLeft: 10,
    },

    radioSelected: {
      borderColor:
        '#40856C',
    },

    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        '#40856C',
    },

    disabled: {
      opacity: 0.7,
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

    metricField: {
      marginBottom: 18,
    },

    metricHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    fieldLabel: {
      color: '#344A51',
      fontSize: 12,
      fontWeight: '700',
    },

    previousValue: {
      color: '#40856C',
      fontSize: 10,
      fontWeight: '700',
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
      fontSize: 15,
    },

    inputSuffix: {
      color: '#839095',
      fontSize: 11,
      fontWeight: '700',
      paddingRight: 13,
    },

    resultsCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      borderRadius: 22,
      paddingHorizontal: 17,
      marginBottom: 12,
    },

    resultItem: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
    },

    resultIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 13,
    },

    resultIconUnavailable: {
      backgroundColor:
        '#F1F3F2',
    },

    resultLabel: {
      color: '#839095',
      fontSize: 10,
      fontWeight: '700',
      marginBottom: 4,
    },

    resultValue: {
      color: '#172D34',
      fontSize: 15,
      fontWeight: '800',
    },

    resultValueUnavailable: {
      color: '#899497',
      fontSize: 12,
      fontWeight: '600',
    },

    resultDivider: {
      height: 1,
      backgroundColor:
        '#EFF2F1',
      marginLeft: 55,
    },

    infoBox: {
      backgroundColor:
        '#EAF3EF',
      borderRadius: 17,
      padding: 14,
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
      marginBottom: 28,
    },

    infoText: {
      flex: 1,
      color: '#526C64',
      fontSize: 11,
      lineHeight: 17,
    },

    warningBox: {
      backgroundColor:
        '#FFF6E8',
      borderRadius: 17,
      padding: 14,
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
      marginTop: -16,
      marginBottom: 28,
    },

    warningText: {
      flex: 1,
      color: '#80551A',
      fontSize: 11,
      lineHeight: 17,
    },

    previousCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      borderRadius: 20,
      padding: 16,
      marginBottom: 28,
    },

    previousHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },

    previousDate: {
      color: '#40856C',
      fontSize: 12,
      fontWeight: '800',
    },

    previousRow: {
      minHeight: 38,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor:
        '#EFF2F1',
    },

    previousRowLabel: {
      color: '#718084',
      fontSize: 11,
    },

    previousRowValue: {
      color: '#172D34',
      fontSize: 12,
      fontWeight: '700',
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