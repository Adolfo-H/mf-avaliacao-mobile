import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
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
import { useCallback, useState } from 'react';

import { listEvaluators } from '@/services/evaluators';
import { Evaluator } from '@/types/evaluator';

export default function EvaluatorsScreen() {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadEvaluators(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError('');

      const response = await listEvaluators();

      setEvaluators(response.data);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível carregar os avaliadores.'
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }

      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadEvaluators();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadEvaluators(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#123C47"
        />

        <Text style={styles.loadingText}>
          Carregando avaliadores...
        </Text>
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
            <Text style={styles.label}>
              EQUIPE
            </Text>

            <Text style={styles.title}>
              Avaliadores
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() =>
              router.push('/(app)/evaluators/new')
            }
          >
            <Ionicons
              name="add"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <Text style={styles.description}>
          Gerencie os profissionais responsáveis pelas avaliações físicas.
        </Text>

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

        {evaluators.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={34}
                color="#40856C"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Nenhum avaliador cadastrado
            </Text>

            <Text style={styles.emptyText}>
              Cadastre o primeiro profissional para começar a vincular
              avaliações.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() =>
                router.push('/(app)/evaluators/new')
              }
            >
              <Ionicons
                name="add"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.emptyButtonText}>
                Novo avaliador
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {evaluators.map((evaluator) => (
              <Pressable
                key={evaluator.id}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() =>
                  router.push(
                    `/(app)/evaluators/${evaluator.id}`
                  )
                }
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(evaluator.name)}
                  </Text>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.nameRow}>
                    <Text
                      style={styles.name}
                      numberOfLines={1}
                    >
                      {evaluator.name}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        evaluator.active
                          ? styles.statusActive
                          : styles.statusInactive,
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

                  <Text
                    style={styles.specialty}
                    numberOfLines={1}
                  >
                    {evaluator.profile?.specialty ||
                      'Especialidade não informada'}
                  </Text>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="card-outline"
                      size={15}
                      color="#839095"
                    />

                    <Text
                      style={styles.infoText}
                      numberOfLines={1}
                    >
                      {evaluator.profile?.professional_registration ||
                        'Registro não informado'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="mail-outline"
                      size={15}
                      color="#839095"
                    />

                    <Text
                      style={styles.infoText}
                      numberOfLines={1}
                    >
                      {evaluator.email}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9BA5A8"
                />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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

  return `${parts[0][0]}${parts[parts.length - 1][0]}`
    .toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F6',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#66757A',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
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

  label: {
    color: '#40856C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 3,
  },

  title: {
    color: '#172D34',
    fontSize: 27,
    fontWeight: '800',
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#123C47',
    alignItems: 'center',
    justifyContent: 'center',
  },

  description: {
    color: '#718084',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 22,
    marginBottom: 20,
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

  list: {
    gap: 11,
  },

  card: {
    minHeight: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  avatarText: {
    color: '#123C47',
    fontSize: 17,
    fontWeight: '800',
  },

  cardContent: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  name: {
    flex: 1,
    color: '#172D34',
    fontSize: 15,
    fontWeight: '800',
    paddingRight: 8,
  },

  specialty: {
    color: '#40856C',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
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
    backgroundColor: '#EAF6EF',
  },

  statusInactive: {
    backgroundColor: '#F5F0F0',
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
    backgroundColor: '#9B6868',
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

  emptyCard: {
    minHeight: 320,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    color: '#172D34',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },

  emptyText: {
    color: '#718084',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },

  emptyButton: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#123C47',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});