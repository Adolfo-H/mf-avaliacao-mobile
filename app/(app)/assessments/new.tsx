import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
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
  listAssessmentEvaluators,
} from '@/services/assessment-evaluators';

import {
  createAssessment,
} from '@/services/assessments';

import {
  getStudentPhotoDataUrl,
  listStudents,
} from '@/services/students';

import {
  AssessmentEvaluatorOption,
} from '@/types/assessment-evaluator';

import {
  Student,
} from '@/types/student';

export default function NewAssessmentScreen() {
  const [
    students,
    setStudents,
  ] = useState<Student[]>([]);

  const [
    evaluators,
    setEvaluators,
  ] = useState<
    AssessmentEvaluatorOption[]
  >([]);

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState<Student | null>(
    null
  );

  const [
    selectedEvaluator,
    setSelectedEvaluator,
  ] = useState<
    AssessmentEvaluatorOption | null
  >(null);

  const [
    studentSearch,
    setStudentSearch,
  ] = useState('');

  const [
    evaluationDate,
    setEvaluationDate,
  ] = useState(
    getTodayBrazilian()
  );

  const [
    loadingStudents,
    setLoadingStudents,
  ] = useState(true);

  const [
    loadingEvaluators,
    setLoadingEvaluators,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

const loadStudents = useCallback(
  async (search = '') => {
    try {
      setLoadingStudents(true);

      const response =
        await listStudents({
          status: 'active',

          search:
            search.trim() ||
            undefined,
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
      setLoadingStudents(false);
    }
  },
  []
);

const loadEvaluators = useCallback(
  async () => {
    try {
      setLoadingEvaluators(true);

      const response =
        await listAssessmentEvaluators();

      setEvaluators(response);

      if (
        response.length === 1
      ) {
        setSelectedEvaluator(
          response[0]
        );
      }
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível carregar os avaliadores.'
      );
    } finally {
      setLoadingEvaluators(false);
    }
  },
  []
);

const loadInitialData = useCallback(
  async () => {
    await Promise.all([
      loadStudents(),
      loadEvaluators(),
    ]);
  },
  [
    loadStudents,
    loadEvaluators,
  ]
);

useEffect(() => {
  void loadInitialData();
}, [loadInitialData]);

  async function handleStudentSearch() {
    await loadStudents(
      studentSearch
    );
  }

  async function handleCreate() {
    if (saving) {
      return;
    }

    if (!selectedStudent) {
      setError(
        'Selecione o aluno que será avaliado.'
      );

      return;
    }

    if (!selectedEvaluator) {
      setError(
        'Selecione o avaliador responsável.'
      );

      return;
    }

    const isoDate =
      parseBrazilianDate(
        evaluationDate
      );

    if (!isoDate) {
      setError(
        'Informe uma data válida no formato DD/MM/AAAA.'
      );

      return;
    }

    const todayIso =
      getTodayIso();

    if (isoDate > todayIso) {
      setError(
        'A data da avaliação não pode ser futura.'
      );

      return;
    }

    if (
      selectedStudent.birth_date &&
      isoDate <
        selectedStudent.birth_date
    ) {
      setError(
        'A data da avaliação não pode ser anterior ao nascimento do aluno.'
      );

      return;
    }

    try {
      setSaving(true);
      setError('');

      await createAssessment({
        student_uuid:
          selectedStudent.uuid,

        evaluator_id:
          selectedEvaluator.id,

        evaluation_date:
          isoDate,
      });

      /*
       * Por enquanto retornamos para
       * a listagem.
       *
       * No próximo passo criaremos
       * a tela da avaliação e iremos
       * abrir o rascunho diretamente.
       */
      router.replace(
        '/(app)/(tabs)/avaliacoes'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível iniciar a avaliação.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
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
            disabled={saving}
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
              AVALIAÇÕES
            </Text>

            <Text
              style={
                styles.headerTitle
              }
            >
              Nova avaliação
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.description
          }
        >
          Selecione o aluno, o
          avaliador responsável e a
          data para iniciar a
          avaliação física.
        </Text>

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

        <Text
          style={
            styles.sectionTitle
          }
        >
          1. Aluno
        </Text>

        {selectedStudent ? (
          <View
            style={
              styles.selectedCard
            }
          >
            <StudentAvatar
              student={
                selectedStudent
              }
              size={58}
            />

            <View
              style={
                styles.selectedContent
              }
            >
              <Text
                style={
                  styles.selectedLabel
                }
              >
                ALUNO SELECIONADO
              </Text>

              <Text
                style={
                  styles.selectedName
                }
              >
                {
                  selectedStudent.name
                }
              </Text>

              <Text
                style={
                  styles.selectedDescription
                }
              >
                {selectedStudent.age !==
                null
                  ? `${selectedStudent.age} anos`
                  : 'Idade não informada'}
              </Text>
            </View>

            <Pressable
              style={
                styles.changeButton
              }
              disabled={saving}
              onPress={() =>
                setSelectedStudent(
                  null
                )
              }
            >
              <Text
                style={
                  styles.changeButtonText
                }
              >
                Trocar
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
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
                value={
                  studentSearch
                }
                onChangeText={
                  setStudentSearch
                }
                placeholder="Pesquisar aluno"
                placeholderTextColor="#A1ACAF"
                returnKeyType="search"
                autoCorrect={false}
                style={
                  styles.searchInput
                }
                onSubmitEditing={
                  handleStudentSearch
                }
              />

              {studentSearch ? (
                <Pressable
                  onPress={() => {
                    setStudentSearch('');

                    void loadStudents(
                      ''
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

            {loadingStudents ? (
              <View
                style={
                  styles.loadingBox
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#40856C"
                />

                <Text
                  style={
                    styles.loadingBoxText
                  }
                >
                  Carregando alunos...
                </Text>
              </View>
            ) : students.length ===
              0 ? (
              <View
                style={
                  styles.emptyBox
                }
              >
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Nenhum aluno ativo
                  encontrado.
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.optionsCard
                }
              >
                {students.map(
                  (
                    student,
                    index
                  ) => (
                    <View
                      key={
                        student.uuid
                      }
                    >
                      {index > 0 ? (
                        <View
                          style={
                            styles.divider
                          }
                        />
                      ) : null}

                      <Pressable
                        style={
                          styles.studentOption
                        }
                        disabled={
                          saving
                        }
                        onPress={() => {
                          setSelectedStudent(
                            student
                          );

                          setError('');
                        }}
                      >
                        <StudentAvatar
                          student={
                            student
                          }
                          size={48}
                        />

                        <View
                          style={
                            styles.optionContent
                          }
                        >
                          <Text
                            style={
                              styles.optionName
                            }
                          >
                            {
                              student.name
                            }
                          </Text>

                          <Text
                            style={
                              styles.optionDescription
                            }
                          >
                            {student.age !==
                            null
                              ? `${student.age} anos`
                              : 'Idade não informada'}
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={19}
                          color="#9BA5A8"
                        />
                      </Pressable>
                    </View>
                  )
                )}
              </View>
            )}
          </>
        )}

        <Text
          style={[
            styles.sectionTitle,
            styles.sectionSpacing,
          ]}
        >
          2. Avaliador responsável
        </Text>

        {loadingEvaluators ? (
          <View
            style={
              styles.loadingBox
            }
          >
            <ActivityIndicator
              size="small"
              color="#40856C"
            />

            <Text
              style={
                styles.loadingBoxText
              }
            >
              Carregando
              avaliadores...
            </Text>
          </View>
        ) : evaluators.length ===
          0 ? (
          <View
            style={
              styles.warningBox
            }
          >
            <Ionicons
              name="person-outline"
              size={21}
              color="#A66A19"
            />

            <Text
              style={
                styles.warningText
              }
            >
              Não existe avaliador
              ativo disponível.
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.optionsCard
            }
          >
            {evaluators.map(
              (
                evaluator,
                index
              ) => {
                const selected =
                  selectedEvaluator
                    ?.id ===
                  evaluator.id;

                return (
                  <View
                    key={
                      evaluator.id
                    }
                  >
                    {index > 0 ? (
                      <View
                        style={
                          styles.divider
                        }
                      />
                    ) : null}

                    <Pressable
                      style={
                        styles.evaluatorOption
                      }
                      disabled={
                        saving
                      }
                      onPress={() => {
                        setSelectedEvaluator(
                          evaluator
                        );

                        setError('');
                      }}
                    >
                      <View
                        style={
                          styles.evaluatorAvatar
                        }
                      >
                        <Text
                          style={
                            styles.evaluatorAvatarText
                          }
                        >
                          {getInitials(
                            evaluator.name
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.optionContent
                        }
                      >
                        <Text
                          style={
                            styles.optionName
                          }
                        >
                          {
                            evaluator.name
                          }
                        </Text>

                        <Text
                          style={
                            styles.optionDescription
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            evaluator.email
                          }
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
                  </View>
                );
              }
            )}
          </View>
        )}

        <Text
          style={[
            styles.sectionTitle,
            styles.sectionSpacing,
          ]}
        >
          3. Data da avaliação
        </Text>

        <View
          style={styles.dateCard}
        >
          <View
            style={
              styles.dateIcon
            }
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color="#40856C"
            />
          </View>

          <View
            style={
              styles.dateContent
            }
          >
            <Text
              style={
                styles.dateLabel
              }
            >
              Data
            </Text>

            <TextInput
              value={
                evaluationDate
              }
              onChangeText={(
                value
              ) => {
                setEvaluationDate(
                  formatDateInput(
                    value
                  )
                );

                setError('');
              }}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#A1ACAF"
              keyboardType="numeric"
              maxLength={10}
              editable={!saving}
              style={
                styles.dateInput
              }
            />
          </View>
        </View>

        <View
          style={styles.infoBox}
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
            A avaliação será criada
            como rascunho e poderá ser
            continuada posteriormente.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.createButton,

            pressed &&
              !saving &&
              styles.createButtonPressed,

            saving &&
              styles.buttonDisabled,
          ]}
          disabled={saving}
          onPress={
            handleCreate
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
                  styles.createButtonText
                }
              >
                Iniciando...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="clipboard-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.createButtonText
                }
              >
                Iniciar avaliação
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={
            styles.cancelButton
          }
          disabled={saving}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.cancelButtonText
            }
          >
            Cancelar
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type StudentAvatarProps = {
  student: Student;
  size: number;
};

function StudentAvatar({
  student,
  size,
}: StudentAvatarProps) {
  const [
    photo,
    setPhoto,
  ] = useState<string | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(
    student.has_photo
  );

  useEffect(() => {
    let active = true;

    async function load() {
      if (!student.has_photo) {
        setPhoto(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response =
          await getStudentPhotoDataUrl(
            student.uuid
          );

        if (active) {
          setPhoto(response);
        }
      } catch {
        if (active) {
          setPhoto(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [
    student.uuid,
    student.has_photo,
  ]);

  const radius =
    Math.round(size * 0.32);

  if (loading) {
    return (
      <View
        style={[
          styles.dynamicAvatar,
          {
            width: size,
            height: size,
            borderRadius:
              radius,
          },
        ]}
      >
        <ActivityIndicator
          size="small"
          color="#40856C"
        />
      </View>
    );
  }

  if (photo) {
    return (
      <Image
        source={{
          uri: photo,
        }}
        style={{
          width: size,
          height: size,
          borderRadius:
            radius,
          marginRight: 13,
          backgroundColor:
            '#EAF3EF',
        }}
      />
    );
  }

  return (
    <View
      style={[
        styles.dynamicAvatar,
        {
          width: size,
          height: size,
          borderRadius:
            radius,
        },
      ]}
    >
      <Text
        style={
          styles.dynamicAvatarText
        }
      >
        {getInitials(
          student.name
        )}
      </Text>
    </View>
  );
}

function getInitials(
  name: string
): string {
  const parts = name
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

function getTodayIso(): string {
  const today = new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      today.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTodayBrazilian(): string {
  const iso =
    getTodayIso();

  const [
    year,
    month,
    day,
  ] = iso.split('-');

  return `${day}/${month}/${year}`;
}

function formatDateInput(
  value: string
): string {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 8);

  if (
    digits.length <= 2
  ) {
    return digits;
  }

  if (
    digits.length <= 4
  ) {
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

    header: {
      flexDirection: 'row',
      alignItems: 'center',
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
      letterSpacing: 1.3,
      marginBottom: 3,
    },

    headerTitle: {
      color: '#172D34',
      fontSize: 27,
      fontWeight: '800',
    },

    description: {
      color: '#718084',
      fontSize: 14,
      lineHeight: 20,
      marginTop: 22,
      marginBottom: 24,
    },

    errorBox: {
      backgroundColor:
        '#FFF1F1',
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 22,
    },

    errorText: {
      flex: 1,
      color: '#B44747',
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },

    sectionTitle: {
      color: '#172D34',
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 12,
    },

    sectionSpacing: {
      marginTop: 28,
    },

    searchContainer: {
      minHeight: 54,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DEE4E2',
      borderRadius: 17,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },

    searchInput: {
      flex: 1,
      color: '#172D34',
      fontSize: 15,
    },

    optionsCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      borderRadius: 20,
      overflow: 'hidden',
    },

    studentOption: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    evaluatorOption: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    optionContent: {
      flex: 1,
    },

    optionName: {
      color: '#172D34',
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 4,
    },

    optionDescription: {
      color: '#839095',
      fontSize: 12,
    },

    divider: {
      height: 1,
      backgroundColor:
        '#EFF2F1',
      marginLeft: 72,
    },

    dynamicAvatar: {
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 13,
    },

    dynamicAvatarText: {
      color: '#123C47',
      fontSize: 15,
      fontWeight: '800',
    },

    selectedCard: {
      backgroundColor:
        '#123C47',
      borderRadius: 22,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },

    selectedContent: {
      flex: 1,
    },

    selectedLabel: {
      color: '#8EC5AE',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 4,
    },

    selectedName: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 3,
    },

    selectedDescription: {
      color: '#CCD9DB',
      fontSize: 12,
    },

    changeButton: {
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    changeButtonText: {
      color: '#123C47',
      fontSize: 11,
      fontWeight: '800',
    },

    evaluatorAvatar: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 13,
    },

    evaluatorAvatarText: {
      color: '#123C47',
      fontSize: 14,
      fontWeight: '800',
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

    dateCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      borderRadius: 20,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    dateIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 13,
    },

    dateContent: {
      flex: 1,
    },

    dateLabel: {
      color: '#839095',
      fontSize: 11,
      fontWeight: '700',
      marginBottom: 2,
    },

    dateInput: {
      color: '#172D34',
      fontSize: 16,
      fontWeight: '700',
      paddingVertical: 6,
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
      marginTop: 24,
      marginBottom: 24,
    },

    infoText: {
      flex: 1,
      color: '#526C64',
      fontSize: 12,
      lineHeight: 18,
    },

    createButton: {
      height: 58,
      borderRadius: 18,
      backgroundColor:
        '#123C47',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 9,
    },

    createButtonPressed: {
      opacity: 0.75,
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    createButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },

    cancelButton: {
      height: 52,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 6,
    },

    cancelButtonText: {
      color: '#718084',
      fontSize: 14,
      fontWeight: '700',
    },

    loadingBox: {
      minHeight: 76,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 10,
    },

    loadingBoxText: {
      color: '#718084',
      fontSize: 13,
      fontWeight: '600',
    },

    emptyBox: {
      minHeight: 76,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E4E9E7',
      borderRadius: 18,
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 15,
    },

    emptyText: {
      color: '#718084',
      fontSize: 13,
      textAlign: 'center',
    },

    warningBox: {
      backgroundColor:
        '#FFF6E8',
      borderRadius: 17,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    warningText: {
      flex: 1,
      color: '#93621D',
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },
  });