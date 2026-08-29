import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getStudent,
  updateStudentStatus,
} from '@/services/students';
import { Student } from '@/types/student';

export default function StudentDetailsScreen() {
  const params = useLocalSearchParams<{
    uuid?: string | string[];
  }>();

  const studentUuid = getStudentUuid(params.uuid);

  const [student, setStudent] =
    useState<Student | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [changingStatus, setChangingStatus] =
    useState(false);

  const [
    confirmingStatusChange,
    setConfirmingStatusChange,
  ] = useState(false);

  const loadStudent = useCallback(
    async (showLoading = true) => {
      if (!studentUuid) {
        setError('Aluno inválido.');
        setLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        setError('');

        const response =
          await getStudent(studentUuid);

        setStudent(response);
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : 'Não foi possível carregar o aluno.'
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }

        setRefreshing(false);
      }
    },
    [studentUuid]
  );

  useFocusEffect(
    useCallback(() => {
      void loadStudent();
    }, [loadStudent])
  );

  async function handleRefresh() {
    setRefreshing(true);

    await loadStudent(false);
  }

  async function handleStatusChange() {
    if (
      !student ||
      changingStatus
    ) {
      return;
    }

    try {
      setChangingStatus(true);
      setError('');

      const updated =
        await updateStudentStatus(
          student.uuid,
          !student.active
        );

      setStudent(updated);

      setConfirmingStatusChange(false);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível alterar o status.'
      );
    } finally {
      setChangingStatus(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#123C47"
        />

        <Text style={styles.loadingText}>
          Carregando aluno...
        </Text>
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorPage}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color="#B44747"
            />
          </View>

          <Text style={styles.errorTitle}>
            Não foi possível abrir o aluno
          </Text>

          <Text style={styles.errorDescription}>
            {error ||
              'O cadastro solicitado não foi encontrado.'}
          </Text>

          <Pressable
            style={styles.backButtonLarge}
            onPress={() => router.back()}
          >
            <Text
              style={styles.backButtonLargeText}
            >
              Voltar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
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

          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>
              ALUNO
            </Text>

            <Text style={styles.headerTitle}>
              Ficha do aluno
            </Text>
          </View>
        </View>

<Pressable
  style={styles.editButton}
  onPress={() =>
    router.push({
      pathname:
        '/(app)/students/[uuid]/edit',
      params: {
        uuid: student.uuid,
      },
    })
  }
>
  <Ionicons
    name="create-outline"
    size={21}
    color="#123C47"
  />
</Pressable>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#B44747"
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(student.name)}
            </Text>
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.name}>
              {student.name}
            </Text>

            <Text style={styles.age}>
              {student.age !== null
                ? `${student.age} anos`
                : 'Idade não informada'}
            </Text>

            <View
              style={[
                styles.statusBadge,
                student.active
                  ? styles.statusActive
                  : styles.statusInactive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  student.active
                    ? styles.statusDotActive
                    : styles.statusDotInactive,
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  student.active
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {student.active
                  ? 'Ativo'
                  : 'Inativo'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Identificação
        </Text>

        <View style={styles.detailsCard}>
          <DetailRow
            icon="person-outline"
            label="Nome completo"
            value={student.name}
          />

          <Divider />

          <DetailRow
            icon="calendar-outline"
            label="Data de nascimento"
            value={
              formatDate(
                student.birth_date
              ) ||
              'Não informada'
            }
          />

          <Divider />

          <DetailRow
            icon="people-outline"
            label="Sexo"
            value={formatSex(student.sex)}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Contato
        </Text>

        <View style={styles.detailsCard}>
          <DetailRow
            icon="call-outline"
            label="Celular"
            value={
              student.contact
                ?.mobile_phone ||
              'Não informado'
            }
          />

          <Divider />

          <DetailRow
            icon="call-outline"
            label="Telefone residencial"
            value={
              student.contact
                ?.home_phone ||
              'Não informado'
            }
          />

          <Divider />

          <DetailRow
            icon="mail-outline"
            label="E-mail"
            value={
              student.contact?.email ||
              'Não informado'
            }
          />
        </View>

        <Text style={styles.sectionTitle}>
          Endereço
        </Text>

        <View style={styles.detailsCard}>
          <DetailRow
            icon="location-outline"
            label="Endereço"
            value={formatStreet(student)}
          />

          <Divider />

          <DetailRow
            icon="map-outline"
            label="Bairro"
            value={
              student.address
                ?.neighborhood ||
              'Não informado'
            }
          />

          <Divider />

          <DetailRow
            icon="business-outline"
            label="Cidade / UF"
            value={formatCity(student)}
          />
        </View>

        {student.administrative_notes ? (
          <>
            <Text style={styles.sectionTitle}>
              Observações administrativas
            </Text>

            <View style={styles.notesCard}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color="#40856C"
              />

              <Text style={styles.notesText}>
                {
                  student.administrative_notes
                }
              </Text>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>
          Situação
        </Text>

        <View style={styles.accessCard}>
          <View style={styles.accessIcon}>
            <Ionicons
              name={
                student.active
                  ? 'checkmark-circle-outline'
                  : 'remove-circle-outline'
              }
              size={24}
              color={
                student.active
                  ? '#40856C'
                  : '#9B6868'
              }
            />
          </View>

          <View style={styles.accessContent}>
            <Text style={styles.accessTitle}>
              {student.active
                ? 'Aluno ativo'
                : 'Aluno inativo'}
            </Text>

            <Text
              style={styles.accessDescription}
            >
              {student.active
                ? 'Este aluno está disponível para novas avaliações.'
                : 'Este aluno não aparecerá na lista de ativos enquanto permanecer inativo.'}
            </Text>
          </View>
        </View>

        {!confirmingStatusChange ? (
          <Pressable
            style={({ pressed }) => [
              styles.statusButton,

              student.active
                ? styles.deactivateButton
                : styles.activateButton,

              pressed &&
                styles.statusButtonPressed,
            ]}
            onPress={() =>
              setConfirmingStatusChange(true)
            }
          >
            <Ionicons
              name={
                student.active
                  ? 'person-remove-outline'
                  : 'person-add-outline'
              }
              size={21}
              color={
                student.active
                  ? '#B44747'
                  : '#40856C'
              }
            />

            <Text
              style={[
                styles.statusButtonText,

                student.active
                  ? styles.deactivateButtonText
                  : styles.activateButtonText,
              ]}
            >
              {student.active
                ? 'Inativar aluno'
                : 'Reativar aluno'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {student.active
                ? 'Inativar este aluno?'
                : 'Reativar este aluno?'}
            </Text>

            <Text
              style={styles.confirmDescription}
            >
              {student.active
                ? 'O histórico permanecerá preservado, mas o aluno deixará de aparecer entre os ativos.'
                : 'O aluno voltará a aparecer entre os cadastros ativos.'}
            </Text>

            <View style={styles.confirmActions}>
              <Pressable
                style={styles.cancelConfirmButton}
                disabled={changingStatus}
                onPress={() =>
                  setConfirmingStatusChange(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.cancelConfirmText
                  }
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.confirmButton,

                  student.active
                    ? styles.confirmDeactivate
                    : styles.confirmActivate,

                  changingStatus &&
                    styles.buttonDisabled,
                ]}
                disabled={changingStatus}
                onPress={handleStatusChange}
              >
                {changingStatus ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.confirmButtonText
                    }
                  >
                    Confirmar
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Cadastro criado em{' '}
          {formatDateTime(
            student.created_at
          )}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type DetailRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function DetailRow({
  icon,
  label,
  value,
}: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#40856C"
        />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function getStudentUuid(
  value?: string | string[]
): string | null {
  const uuid = Array.isArray(value)
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

function formatDate(
  value: string | null
): string | null {
  if (!value) {
    return null;
  }

  const parts = value.split('-');

  if (parts.length !== 3) {
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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'data não disponível';
  }

  return new Intl.DateTimeFormat(
    'pt-BR'
  ).format(date);
}

function formatSex(
  sex: Student['sex']
): string {
  switch (sex) {
    case 'male':
      return 'Masculino';

    case 'female':
      return 'Feminino';

    case 'other':
      return 'Outro';

    case 'not_informed':
      return 'Não informado';

    default:
      return 'Não informado';
  }
}

function formatStreet(
  student: Student
): string {
  const street =
    student.address?.street;

  const number =
    student.address?.number;

  const complement =
    student.address?.complement;

  const parts = [];

  if (street) {
    parts.push(street);
  }

  if (number) {
    parts.push(number);
  }

  if (complement) {
    parts.push(complement);
  }

  return parts.length > 0
    ? parts.join(', ')
    : 'Não informado';
}

function formatCity(
  student: Student
): string {
  const city =
    student.address?.city;

  const state =
    student.address?.state;

  if (city && state) {
    return `${city} - ${state}`;
  }

  return city ||
    state ||
    'Não informado';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F6',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 42,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F8F6',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 25,
    fontWeight: '800',
  },

  errorBox: {
    backgroundColor: '#FFF1F1',
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

  profileCard: {
    backgroundColor: '#123C47',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  avatarText: {
    color: '#123C47',
    fontSize: 21,
    fontWeight: '800',
  },

  profileContent: {
    flex: 1,
  },

  name: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 5,
  },

  age: {
    color: '#C9D8DA',
    fontSize: 13,
    marginBottom: 10,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  statusActive: {
    backgroundColor: '#EAF6EF',
  },

  statusInactive: {
    backgroundColor: '#F8EDED',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusDotActive: {
    backgroundColor: '#40856C',
  },

  statusDotInactive: {
    backgroundColor: '#B44747',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  statusTextActive: {
    color: '#40856C',
  },

  statusTextInactive: {
    color: '#B44747',
  },

  sectionTitle: {
    color: '#172D34',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 13,
  },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 22,
    paddingHorizontal: 17,
    paddingVertical: 6,
    marginBottom: 28,
  },

  detailRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    color: '#839095',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },

  detailValue: {
    color: '#172D34',
    fontSize: 14,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#EFF2F1',
    marginLeft: 53,
  },

  notesCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },

  notesText: {
    flex: 1,
    color: '#536569',
    fontSize: 13,
    lineHeight: 20,
  },

  accessCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  accessIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  accessContent: {
    flex: 1,
  },

  accessTitle: {
    color: '#172D34',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },

  accessDescription: {
    color: '#718084',
    fontSize: 12,
    lineHeight: 17,
  },

  statusButton: {
    height: 56,
    borderRadius: 17,
    borderWidth: 1,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  deactivateButton: {
    backgroundColor: '#FFF7F7',
    borderColor: '#F0D9D9',
  },

  activateButton: {
    backgroundColor: '#F1F8F4',
    borderColor: '#D6E9DF',
  },

  statusButtonPressed: {
    opacity: 0.7,
  },

  statusButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  deactivateButtonText: {
    color: '#B44747',
  },

  activateButtonText: {
    color: '#40856C',
  },

  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 20,
    padding: 17,
    marginTop: 14,
  },

  confirmTitle: {
    color: '#172D34',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },

  confirmDescription: {
    color: '#718084',
    fontSize: 12,
    lineHeight: 18,
  },

  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  cancelConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DEE4E2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelConfirmText: {
    color: '#5D6C70',
    fontSize: 13,
    fontWeight: '700',
  },

  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmDeactivate: {
    backgroundColor: '#B44747',
  },

  confirmActivate: {
    backgroundColor: '#40856C',
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  footer: {
    color: '#A0AAAD',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 26,
  },

  errorPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
    justifyContent: 'center',
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

  backButtonLarge: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#123C47',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonLargeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  editButton: {
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E4E9E7',
  alignItems: 'center',
  justifyContent: 'center',
},
});