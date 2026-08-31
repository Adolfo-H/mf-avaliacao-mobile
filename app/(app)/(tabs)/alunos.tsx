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
  getStudentPhotoDataUrl,
  listStudents,
} from '@/services/students';

import {
  Student,
  StudentStatus,
} from '@/types/student';

export default function StudentsScreen() {
  const [students, setStudents] =
    useState<Student[]>([]);

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<StudentStatus>('active');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const loadStudents = useCallback(
    async (
      showLoading = true,
      searchValue = search,
      statusValue = status
    ) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError('');

        const response =
          await listStudents({
            search: searchValue,
            status: statusValue,
          });

        setStudents(
          response.data ?? []
        );
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : 'Não foi possível carregar os alunos.'
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
      void loadStudents();
    }, [loadStudents])
  );

  async function handleRefresh() {
    setRefreshing(true);

    await loadStudents(false);
  }

  async function handleSearch() {
    await loadStudents(
      true,
      search,
      status
    );
  }

  async function handleStatus(
    newStatus: StudentStatus
  ) {
    setStatus(newStatus);

    await loadStudents(
      true,
      search,
      newStatus
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
          style={styles.loadingText}
        >
          Carregando alunos...
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
            refreshing={refreshing}
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
              style={styles.label}
            >
              CADASTROS
            </Text>

            <Text
              style={styles.title}
            >
              Alunos
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() =>
              router.push(
                '/(app)/students/new'
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
            value={search}
            onChangeText={
              setSearch
            }
            placeholder="Pesquisar aluno"
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

          {search ? (
            <Pressable
              onPress={() => {
                setSearch('');

                void loadStudents(
                  true,
                  '',
                  status
                );
              }}
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
            label="Ativos"
            selected={
              status === 'active'
            }
            onPress={() =>
              handleStatus(
                'active'
              )
            }
          />

          <FilterButton
            label="Inativos"
            selected={
              status ===
              'inactive'
            }
            onPress={() =>
              handleStatus(
                'inactive'
              )
            }
          />

          <FilterButton
            label="Arquivados"
            selected={
              status ===
              'archived'
            }
            onPress={() =>
              handleStatus(
                'archived'
              )
            }
          />
        </View>

        {error ? (
          <View
            style={styles.errorBox}
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

        {students.length === 0 ? (
          <View
            style={styles.empty}
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="people-outline"
                size={34}
                color="#40856C"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Nenhum aluno encontrado
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {search
                ? 'Não encontramos alunos para essa pesquisa.'
                : status ===
                    'inactive'
                  ? 'Não há alunos inativos.'
                  : status ===
                      'archived'
                    ? 'Não há alunos arquivados.'
                    : 'Cadastre o primeiro aluno para começar as avaliações.'}
            </Text>

            {!search &&
            status === 'active' ? (
              <Pressable
                style={
                  styles.emptyButton
                }
                onPress={() =>
                  router.push(
                    '/(app)/students/new'
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
                  Cadastrar aluno
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View
            style={styles.list}
          >
            {students.map(
              (student) => {
                const studentStatus =
                  getStudentStatus(
                    student
                  );

                return (
                  <Pressable
                    key={
                      student.uuid
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.studentCard,

                      pressed &&
                        styles.studentCardPressed,
                    ]}
                    onPress={() =>
                      router.push(
                        `/(app)/students/${student.uuid}`
                      )
                    }
                  >
                    <StudentAvatar
                      student={
                        student
                      }
                    />

                    <View
                      style={
                        styles.studentContent
                      }
                    >
                      <View
                        style={
                          styles.studentHeader
                        }
                      >
                        <Text
                          style={
                            styles.studentName
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            student.name
                          }
                        </Text>

                        <View
                          style={[
                            styles.statusBadge,

                            studentStatus ===
                            'active'
                              ? styles.statusActive
                              : studentStatus ===
                                  'archived'
                                ? styles.statusArchived
                                : styles.statusInactive,
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,

                              studentStatus ===
                              'active'
                                ? styles.statusDotActive
                                : studentStatus ===
                                    'archived'
                                  ? styles.statusDotArchived
                                  : styles.statusDotInactive,
                            ]}
                          />

                          <Text
                            style={[
                              styles.statusText,

                              studentStatus ===
                              'active'
                                ? styles.statusTextActive
                                : studentStatus ===
                                    'archived'
                                  ? styles.statusTextArchived
                                  : styles.statusTextInactive,
                            ]}
                          >
                            {studentStatus ===
                            'active'
                              ? 'Ativo'
                              : studentStatus ===
                                  'archived'
                                ? 'Arquivado'
                                : 'Inativo'}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={
                          styles.age
                        }
                      >
                        {student.age !==
                        null
                          ? `${student.age} anos`
                          : 'Idade não informada'}
                      </Text>

                      <View
                        style={
                          styles.infoRow
                        }
                      >
                        <Ionicons
                          name="call-outline"
                          size={15}
                          color="#839095"
                        />

                        <Text
                          style={
                            styles.infoText
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {student
                            .contact
                            ?.mobile_phone ||
                            'Telefone não informado'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.infoRow
                        }
                      >
                        <Ionicons
                          name="location-outline"
                          size={15}
                          color="#839095"
                        />

                        <Text
                          style={
                            styles.infoText
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {formatLocation(
                            student
                          )}
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
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type StudentAvatarProps = {
  student: Student;
};

function StudentAvatar({
  student,
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
    student.has_photo
  );

  useEffect(() => {
    let active = true;

    async function loadPhoto() {
      if (
        !student.has_photo
      ) {
        setPhotoDataUrl(null);
        setLoadingPhoto(false);
        return;
      }

      try {
        setLoadingPhoto(true);

        const photo =
          await getStudentPhotoDataUrl(
            student.uuid
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
    student.uuid,
    student.has_photo,
  ]);

  if (loadingPhoto) {
    return (
      <View
        style={styles.avatar}
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
        style={styles.avatarText}
      >
        {getInitials(
          student.name
        )}
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
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function formatLocation(
  student: Student
): string {
  const city =
    student.address?.city;

  const state =
    student.address?.state;

  if (city && state) {
    return `${city} - ${state}`;
  }

  if (city) {
    return city;
  }

  if (state) {
    return state;
  }

  return 'Cidade não informada';
}

function getStudentStatus(
  student: Student
): StudentStatus {
  if (student.archived) {
    return 'archived';
  }

  if (!student.active) {
    return 'inactive';
  }

  return 'active';
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
      marginBottom: 22,
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
      fontSize: 28,
      fontWeight: '800',
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
      fontSize: 12,
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

    list: {
      gap: 11,
    },

    studentCard: {
      minHeight: 120,
      borderRadius: 20,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E9E7',
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    studentCardPressed: {
      opacity: 0.7,
    },

    avatar: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 14,
    },

    avatarImage: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor:
        '#EAF3EF',
      marginRight: 14,
    },

    avatarText: {
      color: '#123C47',
      fontSize: 17,
      fontWeight: '800',
    },

    studentContent: {
      flex: 1,
    },

    studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
    },

    studentName: {
      flex: 1,
      color: '#172D34',
      fontSize: 15,
      fontWeight: '800',
      paddingRight: 7,
    },

    age: {
      color: '#40856C',
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 7,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 3,
    },

    infoText: {
      flex: 1,
      color: '#839095',
      fontSize: 12,
    },

    statusBadge: {
      borderRadius: 100,
      paddingHorizontal: 8,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    statusActive: {
      backgroundColor:
        '#EAF6EF',
    },

    statusInactive: {
      backgroundColor:
        '#F5F0F0',
    },

    statusArchived: {
      backgroundColor:
        '#F1F1F1',
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    statusDotActive: {
      backgroundColor:
        '#40856C',
    },

    statusDotInactive: {
      backgroundColor:
        '#9B6868',
    },

    statusDotArchived: {
      backgroundColor:
        '#7B8588',
    },

    statusText: {
      fontSize: 10,
      fontWeight: '700',
    },

    statusTextActive: {
      color: '#40856C',
    },

    statusTextInactive: {
      color: '#9B6868',
    },

    statusTextArchived: {
      color: '#6F797C',
    },

    empty: {
      minHeight: 330,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 72,
      height: 72,
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
      marginBottom: 8,
      textAlign: 'center',
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
      paddingHorizontal: 22,
      borderRadius: 17,
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
      fontSize: 15,
      fontWeight: '700',
    },
  });