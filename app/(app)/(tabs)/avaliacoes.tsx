import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
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
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  listAssessments,
} from '@/services/assessments';

import {
  getStudentPhotoDataUrl,
} from '@/services/students';

import {
  Assessment,
  AssessmentStatus,
} from '@/types/assessment';

type StatusFilter =
  | 'all'
  | AssessmentStatus;

export default function AssessmentsScreen() {
  const [
    assessments,
    setAssessments,
  ] = useState<Assessment[]>([]);

  const [
    searchInput,
    setSearchInput,
  ] = useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<StatusFilter>('all');

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const loadAssessments =
    useCallback(
      async (
        showLoading = true
      ) => {
        try {
          if (showLoading) {
            setLoading(true);
          }

          setError('');

          const response =
            await listAssessments({
              search:
                search ||
                undefined,

              status:
                status === 'all'
                  ? undefined
                  : status,
            });

          setAssessments(
            response.data ?? []
          );
        } catch (exception) {
          setError(
            exception instanceof Error
              ? exception.message
              : 'Não foi possível carregar as avaliações.'
          );
        } finally {
          if (showLoading) {
            setLoading(false);
          }

          setRefreshing(false);
        }
      },
      [search, status]
    );

  useFocusEffect(
    useCallback(() => {
      void loadAssessments();
    }, [loadAssessments])
  );

  async function handleRefresh() {
    setRefreshing(true);

    await loadAssessments(false);
  }

  function handleSearch() {
    setSearch(
      searchInput.trim()
    );
  }

  function handleClearSearch() {
    setSearchInput('');
    setSearch('');
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
          Carregando avaliações...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
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
          style={styles.header}
        >
          <View>
            <Text
              style={
                styles.label
              }
            >
              AVALIAÇÕES
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Avaliações físicas
            </Text>
          </View>

          <Pressable
            style={
              styles.addButton
            }
            onPress={() =>
              router.push(
                '/(app)/assessments/new'
              )
            }
          >
            <Ionicons
              name="add"
              size={25}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <Text
          style={
            styles.description
          }
        >
          Consulte avaliações em
          andamento e concluídas.
        </Text>

        <View
          style={
            styles.searchContainer
          }
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#839095"
          />

          <TextInput
            value={searchInput}
            onChangeText={
              setSearchInput
            }
            placeholder="Pesquisar por aluno"
            placeholderTextColor="#A1ACAF"
            returnKeyType="search"
            autoCorrect={false}
            style={
              styles.searchInput
            }
            onSubmitEditing={
              handleSearch
            }
          />

          {searchInput ? (
            <Pressable
              onPress={
                handleClearSearch
              }
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#A1ACAF"
              />
            </Pressable>
          ) : null}
        </View>

        <View
          style={styles.filters}
        >
          <FilterButton
            label="Todas"
            selected={
              status === 'all'
            }
            onPress={() =>
              setStatus('all')
            }
          />

          <FilterButton
            label="Rascunhos"
            selected={
              status === 'draft'
            }
            onPress={() =>
              setStatus('draft')
            }
          />

          <FilterButton
            label="Concluídas"
            selected={
              status ===
              'completed'
            }
            onPress={() =>
              setStatus(
                'completed'
              )
            }
          />
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

        {assessments.length ===
        0 ? (
          <View
            style={styles.empty}
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="clipboard-outline"
                size={36}
                color="#40856C"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Nenhuma avaliação
              encontrada
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {search
                ? 'Não encontramos avaliações para esse aluno.'
                : status ===
                    'draft'
                  ? 'Não há avaliações em rascunho.'
                  : status ===
                      'completed'
                    ? 'Não há avaliações concluídas.'
                    : 'Inicie a primeira avaliação física.'}
            </Text>

            {!search &&
            status === 'all' ? (
              <Pressable
                style={
                  styles.emptyButton
                }
                onPress={() =>
                  router.push(
                    '/(app)/assessments/new'
                  )
                }
              >
                <Ionicons
                  name="add"
                  size={20}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  Nova avaliação
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View
            style={styles.list}
          >
            {assessments.map(
              (assessment) => (
                <AssessmentCard
                  key={
                    assessment.uuid
                  }
                  assessment={
                    assessment
                  }
                  onPress={() =>
                    router.push(
                      `/(app)/assessments/${assessment.uuid}`
                    )
                  }
                />
              )
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type AssessmentCardProps = {
  assessment: Assessment;
  onPress: () => void;
};

function AssessmentCard({
  assessment,
  onPress,
}: AssessmentCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,

        pressed &&
          styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <StudentAvatar
        assessment={
          assessment
        }
      />

      <View
        style={
          styles.cardContent
        }
      >
        <View
          style={
            styles.cardHeader
          }
        >
          <Text
            style={
              styles.studentName
            }
            numberOfLines={1}
          >
            {
              assessment
                .student.name
            }
          </Text>

          <StatusBadge
            status={
              assessment.status
            }
          />
        </View>

        <View
          style={styles.infoRow}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color="#839095"
          />

          <Text
            style={styles.infoText}
          >
            {formatDate(
              assessment
                .evaluation_date
            )}
          </Text>
        </View>

        <View
          style={styles.infoRow}
        >
          <Ionicons
            name="person-outline"
            size={15}
            color="#839095"
          />

          <Text
            style={styles.infoText}
            numberOfLines={1}
          >
            {
              assessment
                .evaluator.name
            }
          </Text>
        </View>

        <View
          style={
            styles.ageRow
          }
        >
          <Text
            style={
              styles.ageText
            }
          >
            {assessment.student
              .age_at_evaluation !==
            null
              ? `${assessment.student.age_at_evaluation} anos na avaliação`
              : 'Idade não disponível'}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9BA5A8"
      />
    </Pressable>
  );
}

type StudentAvatarProps = {
  assessment: Assessment;
};

function StudentAvatar({
  assessment,
}: StudentAvatarProps) {
  const [
    photoDataUrl,
    setPhotoDataUrl,
  ] = useState<string | null>(
    null
  );

  const [
    loadingPhoto,
    setLoadingPhoto,
  ] = useState(
    assessment.student
      .has_photo
  );

  useEffect(() => {
    let active = true;

    async function loadPhoto() {
      if (
        !assessment.student
          .has_photo
      ) {
        setPhotoDataUrl(null);
        setLoadingPhoto(false);
        return;
      }

      try {
        setLoadingPhoto(true);

        const photo =
          await getStudentPhotoDataUrl(
            assessment.student
              .uuid
          );

        if (active) {
          setPhotoDataUrl(
            photo
          );
        }
      } catch {
        if (active) {
          setPhotoDataUrl(
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
    assessment.student.uuid,
    assessment.student
      .has_photo,
  ]);

  if (loadingPhoto) {
    return (
      <View
        style={
          styles.avatar
        }
      >
        <ActivityIndicator
          size="small"
          color="#40856C"
        />
      </View>
    );
  }

  if (photoDataUrl) {
    return (
      <Image
        source={{
          uri: photoDataUrl,
        }}
        style={
          styles.avatarImage
        }
      />
    );
  }

  return (
    <View style={styles.avatar}>
      <Text
        style={
          styles.avatarText
        }
      >
        {getInitials(
          assessment.student
            .name
        )}
      </Text>
    </View>
  );
}

type StatusBadgeProps = {
  status: AssessmentStatus;
};

function StatusBadge({
  status,
}: StatusBadgeProps) {
  const completed =
    status === 'completed';

  return (
    <View
      style={[
        styles.statusBadge,

        completed
          ? styles.statusCompleted
          : styles.statusDraft,
      ]}
    >
      <View
        style={[
          styles.statusDot,

          completed
            ? styles.statusDotCompleted
            : styles.statusDotDraft,
        ]}
      />

      <Text
        style={[
          styles.statusText,

          completed
            ? styles.statusTextCompleted
            : styles.statusTextDraft,
        ]}
      >
        {completed
          ? 'Concluída'
          : 'Rascunho'}
      </Text>
    </View>
  );
}

type FilterButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterButton({
  label,
  selected,
  onPress,
}: FilterButtonProps) {
  return (
    <Pressable
      style={[
        styles.filterButton,

        selected &&
          styles.filterButtonSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,

          selected &&
            styles.filterTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getInitials(
  name: string
): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'MF';
  }

  if (parts.length === 1) {
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

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
      paddingTop: 20,
      paddingBottom: 40,
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
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    label: {
      color: '#40856C',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginBottom: 4,
    },

    title: {
      color: '#172D34',
      fontSize: 27,
      fontWeight: '800',
    },

    description: {
      color: '#718084',
      fontSize: 14,
      marginTop: 10,
      marginBottom: 22,
    },

    addButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor:
        '#123C47',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    searchContainer: {
      minHeight: 54,
      borderRadius: 17,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor: '#DEE4E2',
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    searchInput: {
      flex: 1,
      color: '#172D34',
      fontSize: 15,
    },

    filters: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 13,
      marginBottom: 20,
    },

    filterButton: {
      flex: 1,
      minHeight: 40,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: '#DEE4E2',
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    filterButtonSelected: {
      backgroundColor:
        '#EAF3EF',
      borderColor: '#CFE2D9',
    },

    filterText: {
      color: '#718084',
      fontSize: 11,
      fontWeight: '700',
    },

    filterTextSelected: {
      color: '#40856C',
    },

    errorBox: {
      backgroundColor:
        '#FFF1F1',
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 18,
    },

    errorText: {
      flex: 1,
      color: '#B44747',
      fontSize: 13,
      fontWeight: '600',
    },

    list: {
      gap: 11,
    },

    card: {
      minHeight: 122,
      borderRadius: 20,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E9E7',
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    cardPressed: {
      opacity: 0.7,
    },

    avatar: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 14,
    },

    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: 18,
      marginRight: 14,
      backgroundColor:
        '#EAF3EF',
    },

    avatarText: {
      color: '#123C47',
      fontSize: 17,
      fontWeight: '800',
    },

    cardContent: {
      flex: 1,
    },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 7,
    },

    studentName: {
      flex: 1,
      color: '#172D34',
      fontSize: 15,
      fontWeight: '800',
      paddingRight: 8,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },

    infoText: {
      flex: 1,
      color: '#718084',
      fontSize: 12,
    },

    ageRow: {
      marginTop: 6,
    },

    ageText: {
      color: '#40856C',
      fontSize: 11,
      fontWeight: '600',
    },

    statusBadge: {
      borderRadius: 100,
      paddingHorizontal: 8,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    statusDraft: {
      backgroundColor:
        '#FFF6E8',
    },

    statusCompleted: {
      backgroundColor:
        '#EAF6EF',
    },

    statusDotDraft: {
      backgroundColor:
        '#BC7B22',
    },

    statusDotCompleted: {
      backgroundColor:
        '#40856C',
    },

    statusText: {
      fontSize: 10,
      fontWeight: '800',
    },

    statusTextDraft: {
      color: '#A66A19',
    },

    statusTextCompleted: {
      color: '#40856C',
    },

    empty: {
      minHeight: 330,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 74,
      height: 74,
      borderRadius: 24,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 20,
    },

    emptyTitle: {
      color: '#172D34',
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 8,
    },

    emptyText: {
      color: '#718084',
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
      marginBottom: 24,
    },

    emptyButton: {
      minHeight: 54,
      borderRadius: 17,
      paddingHorizontal: 22,
      backgroundColor:
        '#123C47',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
    },

    emptyButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });