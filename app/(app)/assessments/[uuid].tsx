import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  getAssessment,
} from '@/services/assessments';

import {
  getStudentPhotoDataUrl,
} from '@/services/students';

import {
  Assessment,
  AssessmentSection,
  AssessmentSectionKey,
  AssessmentSectionStatus,
} from '@/types/assessment';

export default function AssessmentDetailsScreen() {
  const params =
    useLocalSearchParams<{
      uuid?: string | string[];
    }>();

  const assessmentUuid =
    getAssessmentUuid(
      params.uuid
    );

  const [
    assessment,
    setAssessment,
  ] = useState<Assessment | null>(
    null
  );

  const [
    studentPhoto,
    setStudentPhoto,
  ] = useState<string | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingPhoto,
    setLoadingPhoto,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const loadAssessment =
    useCallback(
      async (
        showLoading = true
      ) => {
        if (!assessmentUuid) {
          setError(
            'Avaliação inválida.'
          );

          setLoading(false);

          return;
        }

        try {
          if (showLoading) {
            setLoading(true);
          }

          setError('');

          const response =
            await getAssessment(
              assessmentUuid
            );

          setAssessment(response);
        } catch (exception) {
          setError(
            exception instanceof Error
              ? exception.message
              : 'Não foi possível carregar a avaliação.'
          );
        } finally {
          if (showLoading) {
            setLoading(false);
          }

          setRefreshing(false);
        }
      },
      [assessmentUuid]
    );

  useFocusEffect(
    useCallback(() => {
      void loadAssessment();
    }, [loadAssessment])
  );

  useEffect(() => {
    let active = true;

    async function loadPhoto() {
      if (
        !assessment?.student
          .has_photo
      ) {
        setStudentPhoto(null);
        setLoadingPhoto(false);

        return;
      }

      try {
        setLoadingPhoto(true);

        const photo =
          await getStudentPhotoDataUrl(
            assessment.student.uuid
          );

        if (active) {
          setStudentPhoto(
            photo
          );
        }
      } catch {
        if (active) {
          setStudentPhoto(
            null
          );
        }
      } finally {
        if (active) {
          setLoadingPhoto(
            false
          );
        }
      }
    }

    void loadPhoto();

    return () => {
      active = false;
    };
  }, [
    assessment?.student.uuid,
    assessment?.student.has_photo,
  ]);

  async function handleRefresh() {
    setRefreshing(true);

    await loadAssessment(false);
  }

  function openSection(
    section: AssessmentSection
  ) {
    if (!assessment) {
      return;
    }

    const readOnly =
      assessment.can_edit
        ? '0'
        : '1';

    if (
      section.key ===
      'anamnesis'
    ) {
      router.push({
        pathname:
          '/(app)/assessments/[uuid]/anamnesis',

        params: {
          uuid:
            assessment.uuid,

          readOnly,
        },
      });

      return;
    }

    if (
      section.key ===
      'body_composition'
    ) {
      router.push({
        pathname:
          '/(app)/assessments/[uuid]/body-composition',

        params: {
          uuid:
            assessment.uuid,

          readOnly,
        },
      });
    }
  }

  function canOpenSection(
    key: AssessmentSectionKey
  ): boolean {
    return (
      key ===
        'anamnesis' ||
      key ===
        'body_composition'
    );
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
          Carregando avaliação...
        </Text>
      </SafeAreaView>
    );
  }

  if (!assessment) {
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
          <View
            style={
              styles.errorIcon
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={36}
              color="#B44747"
            />
          </View>

          <Text
            style={
              styles.errorTitle
            }
          >
            Não foi possível abrir
            a avaliação
          </Text>

          <Text
            style={
              styles.errorDescription
            }
          >
            {error ||
              'A avaliação solicitada não foi encontrada.'}
          </Text>

          <Pressable
            style={
              styles.returnButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.returnButtonText
              }
            >
              Voltar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const progress =
    Math.max(
      0,
      Math.min(
        100,
        assessment.progress
          ?.percentage ?? 0
      )
    );

  const progressWidth =
    `${progress}%` as `${number}%`;

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
          />
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
              Avaliação
            </Text>
          </View>
        </View>

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

        <View
          style={
            styles.studentCard
          }
        >
          <View
            style={
              styles.avatarContainer
            }
          >
            {loadingPhoto ? (
              <View
                style={
                  styles.avatar
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#123C47"
                />
              </View>
            ) : studentPhoto ? (
              <Image
                source={{
                  uri: studentPhoto,
                }}
                style={
                  styles.avatarImage
                }
              />
            ) : (
              <View
                style={
                  styles.avatar
                }
              >
                <Text
                  style={
                    styles.avatarText
                  }
                >
                  {getInitials(
                    assessment
                      .student.name
                  )}
                </Text>
              </View>
            )}
          </View>

          <View
            style={
              styles.studentContent
            }
          >
            <Text
              style={
                styles.studentName
              }
            >
              {
                assessment
                  .student.name
              }
            </Text>

            <Text
              style={
                styles.studentAge
              }
            >
              {assessment.student
                .age_at_evaluation !==
              null
                ? `${assessment.student.age_at_evaluation} anos na avaliação`
                : 'Idade não disponível'}
            </Text>

            <AssessmentStatusBadge
              status={
                assessment.status
              }
            />
          </View>
        </View>

        <View
          style={
            styles.metadataCard
          }
        >
          <MetadataItem
            icon="calendar-outline"
            label="Data da avaliação"
            value={formatDate(
              assessment
                .evaluation_date
            )}
          />

          <View
            style={
              styles.metadataDivider
            }
          />

          <MetadataItem
            icon="person-outline"
            label="Avaliador responsável"
            value={
              assessment
                .evaluator.name
            }
          />
        </View>

        <View
          style={
            styles.progressCard
          }
        >
          <View
            style={
              styles.progressHeader
            }
          >
            <View>
              <Text
                style={
                  styles.progressLabel
                }
              >
                PROGRESSO DA AVALIAÇÃO
              </Text>

              <Text
                style={
                  styles.progressTitle
                }
              >
                {
                  assessment
                    .progress
                    .completed
                }{' '}
                de{' '}
                {
                  assessment
                    .progress
                    .total
                }{' '}
                seções concluídas
              </Text>
            </View>

            <View
              style={
                styles.progressPercentageBox
              }
            >
              <Text
                style={
                  styles.progressPercentage
                }
              >
                {progress}%
              </Text>
            </View>
          </View>

          <View
            style={
              styles.progressTrack
            }
          >
            <View
              style={[
                styles.progressFill,

                {
                  width:
                    progressWidth,
                },
              ]}
            />
          </View>

          <Text
            style={
              styles.progressDescription
            }
          >
            {assessment.status ===
            'draft'
              ? 'A avaliação está em rascunho e pode ser continuada posteriormente.'
              : 'Esta avaliação foi concluída e está preservada no histórico.'}
          </Text>
        </View>

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionHeaderLabel
            }
          >
            PREENCHIMENTO
          </Text>

          <Text
            style={
              styles.sectionHeaderTitle
            }
          >
            Seções da avaliação
          </Text>
        </View>

        <View
          style={
            styles.sectionsList
          }
        >
          {assessment.sections
            .slice()
            .sort(
              (
                first,
                second
              ) =>
                (first.order ??
                  999) -
                (second.order ??
                  999)
            )
            .map(
              (
                section,
                index
              ) => (
                <SectionCard
                  key={
                    section.key
                  }
                  section={
                    section
                  }
                  index={
                    index + 1
                  }
                  enabled={canOpenSection(
                    section.key
                  )}
                  onPress={() =>
                    openSection(
                      section
                    )
                  }
                />
              )
            )}
        </View>

        <View
          style={
            styles.nextStepBox
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#40856C"
          />

          <Text
            style={
              styles.nextStepText
            }
          >
            Anamnese e Composição
            Corporal já estão
            disponíveis. As demais
            seções serão habilitadas
            conforme avançarmos.
          </Text>
        </View>

        <Text
          style={
            styles.footer
          }
        >
          Criada em{' '}
          {formatDateTime(
            assessment.created_at
          )}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type MetadataItemProps = {
  icon:
    keyof typeof Ionicons.glyphMap;

  label: string;

  value: string;
};

function MetadataItem({
  icon,
  label,
  value,
}: MetadataItemProps) {
  return (
    <View
      style={
        styles.metadataItem
      }
    >
      <View
        style={
          styles.metadataIcon
        }
      >
        <Ionicons
          name={icon}
          size={19}
          color="#40856C"
        />
      </View>

      <View
        style={
          styles.metadataContent
        }
      >
        <Text
          style={
            styles.metadataLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.metadataValue
          }
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

type SectionCardProps = {
  section: AssessmentSection;

  index: number;

  enabled: boolean;

  onPress: () => void;
};

function SectionCard({
  section,
  index,
  enabled,
  onPress,
}: SectionCardProps) {
  const icon =
    getSectionIcon(
      section.key
    );

  return (
    <Pressable
      style={({
        pressed,
      }) => [
        styles.sectionCard,

        !enabled &&
          styles.sectionCardDisabled,

        pressed &&
          enabled &&
          styles.sectionCardPressed,
      ]}
      disabled={!enabled}
      onPress={onPress}
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
          styles.sectionIcon
        }
      >
        <Ionicons
          name={icon}
          size={22}
          color={
            enabled
              ? '#40856C'
              : '#9AA4A7'
          }
        />
      </View>

      <View
        style={
          styles.sectionContent
        }
      >
        <Text
          style={[
            styles.sectionName,

            !enabled &&
              styles.sectionNameDisabled,
          ]}
        >
          {section.label ??
            getFallbackSectionLabel(
              section.key
            )}
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          {getSectionDescription(
            section.key
          )}
        </Text>
      </View>

      <SectionStatusBadge
        status={
          section.status
        }
        label={
          section.status_label
        }
      />

      {enabled ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#9BA5A8"
          style={
            styles.sectionChevron
          }
        />
      ) : (
        <Ionicons
          name="lock-closed-outline"
          size={15}
          color="#A7B0B2"
          style={
            styles.sectionChevron
          }
        />
      )}
    </Pressable>
  );
}

type SectionStatusBadgeProps = {
  status:
    AssessmentSectionStatus;

  label: string | null;
};

function SectionStatusBadge({
  status,
  label,
}: SectionStatusBadgeProps) {
  return (
    <View
      style={[
        styles.sectionStatus,

        status ===
          'not_started' &&
          styles.sectionStatusNotStarted,

        status ===
          'in_progress' &&
          styles.sectionStatusProgress,

        status ===
          'completed' &&
          styles.sectionStatusCompleted,

        status ===
          'pending' &&
          styles.sectionStatusPending,
      ]}
    >
      <View
        style={[
          styles.sectionStatusDot,

          status ===
            'not_started' &&
            styles.sectionStatusDotNotStarted,

          status ===
            'in_progress' &&
            styles.sectionStatusDotProgress,

          status ===
            'completed' &&
            styles.sectionStatusDotCompleted,

          status ===
            'pending' &&
            styles.sectionStatusDotPending,
        ]}
      />

      <Text
        style={[
          styles.sectionStatusText,

          status ===
            'not_started' &&
            styles.sectionStatusTextNotStarted,

          status ===
            'in_progress' &&
            styles.sectionStatusTextProgress,

          status ===
            'completed' &&
            styles.sectionStatusTextCompleted,

          status ===
            'pending' &&
            styles.sectionStatusTextPending,
        ]}
      >
        {label ??
          getSectionStatusLabel(
            status
          )}
      </Text>
    </View>
  );
}

function AssessmentStatusBadge({
  status,
}: {
  status:
    | 'draft'
    | 'completed';
}) {
  const completed =
    status === 'completed';

  return (
    <View
      style={[
        styles.assessmentStatus,

        completed
          ? styles.assessmentCompleted
          : styles.assessmentDraft,
      ]}
    >
      <View
        style={[
          styles.assessmentStatusDot,

          completed
            ? styles.assessmentStatusDotCompleted
            : styles.assessmentStatusDotDraft,
        ]}
      />

      <Text
        style={[
          styles.assessmentStatusText,

          completed
            ? styles.assessmentStatusTextCompleted
            : styles.assessmentStatusTextDraft,
        ]}
      >
        {completed
          ? 'Concluída'
          : 'Rascunho'}
      </Text>
    </View>
  );
}

function getSectionIcon(
  key: AssessmentSectionKey
): keyof typeof Ionicons.glyphMap {
  switch (key) {
    case 'anamnesis':
      return 'document-text-outline';

    case 'body_composition':
      return 'body-outline';

    case 'circumferences':
      return 'resize-outline';

    case 'vo2_max':
      return 'heart-outline';

    case 'neuromotor_tests':
      return 'fitness-outline';

    case 'progress_photos':
      return 'camera-outline';

    case 'postural_assessment':
      return 'accessibility-outline';
  }
}

function getSectionDescription(
  key: AssessmentSectionKey
): string {
  switch (key) {
    case 'anamnesis':
      return 'Objetivos, histórico, sinais vitais e PAR-Q';

    case 'body_composition':
      return 'Peso, altura, protocolo e composição corporal';

    case 'circumferences':
      return 'Perímetros e diâmetros ósseos';

    case 'vo2_max':
      return 'Capacidade aeróbia e testes de campo';

    case 'neuromotor_tests':
      return 'Flexibilidade e resistência muscular';

    case 'progress_photos':
      return 'Registro fotográfico da evolução física';

    case 'postural_assessment':
      return 'Fotografias e análise postural';
  }
}

function getFallbackSectionLabel(
  key: AssessmentSectionKey
): string {
  switch (key) {
    case 'anamnesis':
      return 'Anamnese';

    case 'body_composition':
      return 'Composição corporal';

    case 'circumferences':
      return 'Perímetros';

    case 'vo2_max':
      return 'VO2Max';

    case 'neuromotor_tests':
      return 'Testes neuromotores';

    case 'progress_photos':
      return 'Fotos de evolução';

    case 'postural_assessment':
      return 'Avaliação postural';
  }
}

function getSectionStatusLabel(
  status: AssessmentSectionStatus
): string {
  switch (status) {
    case 'not_started':
      return 'Não iniciada';

    case 'in_progress':
      return 'Em preenchimento';

    case 'completed':
      return 'Concluída';

    case 'pending':
      return 'Com pendências';
  }
}

function getAssessmentUuid(
  value?: string | string[]
): string | null {
  const uuid =
    Array.isArray(value)
      ? value[0]
      : value;

  if (!uuid?.trim()) {
    return null;
  }

  return uuid.trim();
}

function getInitials(
  name: string
): string {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return 'MF';
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
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

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return 'data não disponível';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'data não disponível';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    }
  ).format(date);
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F7F8F6',
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 44,
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
      alignItems: 'center',
      marginBottom: 18,
    },

    errorText: {
      flex: 1,
      color: '#B44747',
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },

    studentCard: {
      backgroundColor:
        '#123C47',
      borderRadius: 24,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },

    avatarContainer: {
      width: 68,
      height: 68,
      marginRight: 16,
    },

    avatar: {
      width: 68,
      height: 68,
      borderRadius: 22,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    avatarImage: {
      width: 68,
      height: 68,
      borderRadius: 22,
      backgroundColor:
        '#EAF3EF',
    },

    avatarText: {
      color: '#123C47',
      fontSize: 20,
      fontWeight: '800',
    },

    studentContent: {
      flex: 1,
    },

    studentName: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 5,
    },

    studentAge: {
      color: '#CAD8DA',
      fontSize: 12,
      marginBottom: 9,
    },

    assessmentStatus: {
      alignSelf:
        'flex-start',
      borderRadius: 100,
      paddingHorizontal: 9,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    assessmentDraft: {
      backgroundColor:
        '#FFF5E5',
    },

    assessmentCompleted: {
      backgroundColor:
        '#EAF6EF',
    },

    assessmentStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    assessmentStatusDotDraft: {
      backgroundColor:
        '#BC7B22',
    },

    assessmentStatusDotCompleted: {
      backgroundColor:
        '#40856C',
    },

    assessmentStatusText: {
      fontSize: 10,
      fontWeight: '800',
    },

    assessmentStatusTextDraft: {
      color: '#A66A19',
    },

    assessmentStatusTextCompleted: {
      color: '#40856C',
    },

    metadataCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      paddingHorizontal: 16,
      marginBottom: 14,
    },

    metadataItem: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
    },

    metadataIcon: {
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

    metadataContent: {
      flex: 1,
    },

    metadataLabel: {
      color: '#839095',
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 3,
    },

    metadataValue: {
      color: '#172D34',
      fontSize: 14,
      fontWeight: '700',
    },

    metadataDivider: {
      height: 1,
      backgroundColor:
        '#EFF2F1',
      marginLeft: 55,
    },

    progressCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      borderRadius: 22,
      padding: 18,
      marginBottom: 28,
    },

    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 16,
    },

    progressLabel: {
      color: '#40856C',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 4,
    },

    progressTitle: {
      color: '#172D34',
      fontSize: 14,
      fontWeight: '800',
    },

    progressPercentageBox: {
      minWidth: 54,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    progressPercentage: {
      color: '#40856C',
      fontSize: 14,
      fontWeight: '800',
    },

    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor:
        '#E9EEEC',
      overflow: 'hidden',
    },

    progressFill: {
      height: 8,
      borderRadius: 4,
      backgroundColor:
        '#40856C',
    },

    progressDescription: {
      color: '#718084',
      fontSize: 11,
      lineHeight: 16,
      marginTop: 11,
    },

    sectionHeader: {
      marginBottom: 14,
    },

    sectionHeaderLabel: {
      color: '#40856C',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 3,
    },

    sectionHeaderTitle: {
      color: '#172D34',
      fontSize: 19,
      fontWeight: '800',
    },

    sectionsList: {
      gap: 10,
    },

    sectionCard: {
      minHeight: 88,
      borderRadius: 20,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      padding: 13,
      flexDirection: 'row',
      alignItems: 'center',
    },

    sectionCardPressed: {
      opacity: 0.7,
    },

    sectionCardDisabled: {
      opacity: 0.72,
    },

    sectionChevron: {
      marginLeft: 6,
    },

    sectionNumber: {
      width: 25,
      height: 25,
      borderRadius: 9,
      backgroundColor:
        '#F1F4F3',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 8,
    },

    sectionNumberText: {
      color: '#839095',
      fontSize: 10,
      fontWeight: '800',
    },

    sectionIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 12,
    },

    sectionContent: {
      flex: 1,
      paddingRight: 8,
    },

    sectionName: {
      color: '#172D34',
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 4,
    },

    sectionNameDisabled: {
      color: '#708084',
    },

    sectionDescription: {
      color: '#839095',
      fontSize: 10,
      lineHeight: 14,
    },

    sectionStatus: {
      borderRadius: 100,
      paddingHorizontal: 7,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      maxWidth: 105,
    },

    sectionStatusDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },

    sectionStatusText: {
      fontSize: 9,
      fontWeight: '800',
    },

    sectionStatusNotStarted: {
      backgroundColor:
        '#F1F3F2',
    },

    sectionStatusDotNotStarted: {
      backgroundColor:
        '#97A2A5',
    },

    sectionStatusTextNotStarted: {
      color: '#758185',
    },

    sectionStatusProgress: {
      backgroundColor:
        '#EAF1F7',
    },

    sectionStatusDotProgress: {
      backgroundColor:
        '#4D7999',
    },

    sectionStatusTextProgress: {
      color: '#426B88',
    },

    sectionStatusCompleted: {
      backgroundColor:
        '#EAF6EF',
    },

    sectionStatusDotCompleted: {
      backgroundColor:
        '#40856C',
    },

    sectionStatusTextCompleted: {
      color: '#40856C',
    },

    sectionStatusPending: {
      backgroundColor:
        '#FFF5E5',
    },

    sectionStatusDotPending: {
      backgroundColor:
        '#BC7B22',
    },

    sectionStatusTextPending: {
      color: '#A66A19',
    },

    nextStepBox: {
      backgroundColor:
        '#EAF3EF',
      borderRadius: 18,
      padding: 15,
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
      marginTop: 22,
    },

    nextStepText: {
      flex: 1,
      color: '#526C64',
      fontSize: 12,
      lineHeight: 18,
    },

    footer: {
      color: '#A0AAAD',
      fontSize: 10,
      textAlign: 'center',
      marginTop: 25,
    },

    errorPage: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 30,
    },

    errorIcon: {
      width: 74,
      height: 74,
      borderRadius: 24,
      backgroundColor:
        '#FFF1F1',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 18,
    },

    errorTitle: {
      color: '#172D34',
      fontSize: 19,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 8,
    },

    errorDescription: {
      color: '#718084',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: 22,
    },

    returnButton: {
      minHeight: 50,
      borderRadius: 16,
      backgroundColor:
        '#123C47',
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    returnButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });