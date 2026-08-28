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
  getEvaluator,
  updateEvaluatorStatus,
} from '@/services/evaluators';
import { Evaluator } from '@/types/evaluator';

export default function EvaluatorDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const evaluatorId = getEvaluatorId(params.id);

  const [evaluator, setEvaluator] =
    useState<Evaluator | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');

  const [changingStatus, setChangingStatus] =
    useState(false);

  const [
    confirmingStatusChange,
    setConfirmingStatusChange,
  ] = useState(false);

  const loadEvaluator = useCallback(
  async (showLoading = true) => {
    if (!evaluatorId) {
      setError('Avaliador inválido.');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }

      setError('');

      const response =
        await getEvaluator(evaluatorId);

      setEvaluator(response);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível carregar o avaliador.'
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }

      setRefreshing(false);
    }
  },
  [evaluatorId]
);

useFocusEffect(
  useCallback(() => {
    void loadEvaluator();
  }, [loadEvaluator])
);

  async function handleRefresh() {
    setRefreshing(true);

    await loadEvaluator(false);
  }

  async function handleStatusChange() {
    if (!evaluator || changingStatus) {
      return;
    }

    try {
      setChangingStatus(true);
      setError('');

      const updated =
        await updateEvaluatorStatus(
          evaluator.id,
          !evaluator.active
        );

      setEvaluator(updated);

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
          Carregando avaliador...
        </Text>
      </SafeAreaView>
    );
  }

  if (!evaluator) {
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
            Não foi possível abrir o avaliador
          </Text>

          <Text style={styles.errorDescription}>
            {error ||
              'O registro solicitado não foi encontrado.'}
          </Text>

          <Pressable
            style={styles.backToListButton}
            onPress={() => router.back()}
          >
            <Text
              style={
                styles.backToListButtonText
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

          <View style={styles.headerText}>
            <Text style={styles.headerLabel}>
              AVALIADOR
            </Text>

            <Text style={styles.headerTitle}>
              Dados profissionais
            </Text>
          </View>
        </View>

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
              {getInitials(evaluator.name)}
            </Text>
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.name}>
              {evaluator.name}
            </Text>

            <Text style={styles.email}>
              {evaluator.email}
            </Text>

            <View
              style={[
                styles.statusBadge,
                evaluator.active
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  evaluator.active
                    ? styles.statusDotActive
                    : styles.statusDotInactive,
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  evaluator.active
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {evaluator.active
                  ? 'Ativo'
                  : 'Inativo'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Informações profissionais
        </Text>

        <View style={styles.detailsCard}>
          <DetailRow
            icon="person-outline"
            label="Nome completo"
            value={evaluator.name}
          />

          <Divider />

          <DetailRow
            icon="mail-outline"
            label="E-mail"
            value={evaluator.email}
          />

          <Divider />

          <DetailRow
            icon="call-outline"
            label="Telefone"
            value={
              evaluator.profile?.phone ||
              'Não informado'
            }
          />

          <Divider />

          <DetailRow
            icon="card-outline"
            label="Registro profissional"
            value={
              evaluator.profile
                ?.professional_registration ||
              'Não informado'
            }
          />

          <Divider />

          <DetailRow
            icon="fitness-outline"
            label="Especialidade"
            value={
              evaluator.profile?.specialty ||
              'Não informada'
            }
          />

          <Divider />

          <DetailRow
            icon="business-outline"
            label="Empresa"
            value={
              evaluator.profile?.company_name ||
              'Não informada'
            }
          />
        </View>

        <Text style={styles.sectionTitle}>
          Situação do acesso
        </Text>

        <View style={styles.accessCard}>
          <View style={styles.accessIcon}>
            <Ionicons
              name={
                evaluator.active
                  ? 'shield-checkmark-outline'
                  : 'shield-outline'
              }
              size={24}
              color={
                evaluator.active
                  ? '#40856C'
                  : '#9B6868'
              }
            />
          </View>

          <View style={styles.accessContent}>
            <Text style={styles.accessTitle}>
              {evaluator.active
                ? 'Acesso ativo'
                : 'Acesso inativo'}
            </Text>

            <Text
              style={styles.accessDescription}
            >
              {evaluator.active
                ? 'Este avaliador pode acessar o sistema com suas credenciais.'
                : 'Este avaliador não pode acessar o sistema enquanto estiver inativo.'}
            </Text>
          </View>
        </View>

        {!confirmingStatusChange ? (
          <Pressable
            style={({ pressed }) => [
              styles.statusButton,
              evaluator.active
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
                evaluator.active
                  ? 'person-remove-outline'
                  : 'person-add-outline'
              }
              size={21}
              color={
                evaluator.active
                  ? '#B44747'
                  : '#40856C'
              }
            />

            <Text
              style={[
                styles.statusButtonText,
                evaluator.active
                  ? styles.deactivateButtonText
                  : styles.activateButtonText,
              ]}
            >
              {evaluator.active
                ? 'Inativar avaliador'
                : 'Reativar avaliador'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.confirmCard}>
            <View style={styles.confirmHeader}>
              <View
                style={styles.confirmIcon}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color={
                    evaluator.active
                      ? '#B44747'
                      : '#40856C'
                  }
                />
              </View>

              <View
                style={styles.confirmContent}
              >
                <Text
                  style={styles.confirmTitle}
                >
                  {evaluator.active
                    ? 'Inativar este avaliador?'
                    : 'Reativar este avaliador?'}
                </Text>

                <Text
                  style={
                    styles.confirmDescription
                  }
                >
                  {evaluator.active
                    ? 'O profissional perderá o acesso ao aplicativo e os tokens de autenticação atuais serão revogados.'
                    : 'O profissional poderá voltar a acessar o aplicativo com suas credenciais.'}
                </Text>
              </View>
            </View>

            <View
              style={styles.confirmActions}
            >
              <Pressable
                style={styles.cancelButton}
                disabled={changingStatus}
                onPress={() =>
                  setConfirmingStatusChange(
                    false
                  )
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

              <Pressable
                style={[
                  styles.confirmButton,
                  evaluator.active
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

        <Text style={styles.footerInfo}>
          Cadastro criado em{' '}
          {formatDate(evaluator.created_at)}
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

function getEvaluatorId(
  value?: string | string[]
): number | null {
  const rawValue = Array.isArray(value)
    ? value[0]
    : value;

  if (!rawValue) {
    return null;
  }

  const id = Number(rawValue);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function getInitials(name: string): string {
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

  headerText: {
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
    fontSize: 24,
    fontWeight: '800',
  },

  errorBox: {
    backgroundColor: '#FFF1F1',
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

  email: {
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

  statusBadgeActive: {
    backgroundColor: '#EAF6EF',
  },

  statusBadgeInactive: {
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

  confirmHeader: {
    flexDirection: 'row',
  },

  confirmIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F7F1F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  confirmContent: {
    flex: 1,
  },

  confirmTitle: {
    color: '#172D34',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
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

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DEE4E2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
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

  footerInfo: {
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

  backToListButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#123C47',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backToListButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});