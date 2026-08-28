import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await signOut();

      router.replace('/');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>
          CONTA
        </Text>

        <Text style={styles.title}>
          Perfil
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons
              name="person-outline"
              size={30}
              color="#123C47"
            />
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.name}>
              {user?.name ?? 'Usuário'}
            </Text>

            <Text style={styles.email}>
              {user?.email ?? ''}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Aplicativo
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color="#40856C"
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>
                  Sessão protegida
                </Text>

                <Text style={styles.infoDescription}>
                  Sua autenticação está protegida no dispositivo.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={21}
                  color="#40856C"
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>
                  MF Avaliação Física
                </Text>

                <Text style={styles.infoDescription}>
                  Ambiente de desenvolvimento
                </Text>
              </View>
            </View>
          </View>

          {/* GERENCIAMENTO DE AVALIADORES */}
          <Pressable
            style={({ pressed }) => [
              styles.managementCard,
              pressed && styles.managementCardPressed,
            ]}
            onPress={() =>
              router.push('/(app)/evaluators')
            }
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="people-outline"
                size={22}
                color="#40856C"
              />
            </View>

            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>
                Gerenciar avaliadores
              </Text>

              <Text style={styles.managementDescription}>
                Cadastre e gerencie os profissionais da equipe.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9BA5A8"
            />
          </Pressable>
        </View>

        {/* LOGOUT SEPARADO */}
        <Pressable
          style={({ pressed }) => [
            styles.logout,
            pressed &&
              !loggingOut &&
              styles.logoutPressed,
            loggingOut &&
              styles.logoutDisabled,
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <>
              <ActivityIndicator
                size="small"
                color="#B44747"
              />

              <Text style={styles.logoutText}>
                Saindo...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={21}
                color="#B44747"
              />

              <Text style={styles.logoutText}>
                Sair
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F6',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  label: {
    color: '#40856C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  title: {
    color: '#172D34',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 28,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  profileContent: {
    flex: 1,
  },

  name: {
    color: '#172D34',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  email: {
    color: '#718084',
    fontSize: 13,
  },

  section: {
    marginTop: 30,
  },

  sectionTitle: {
    color: '#172D34',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: '#172D34',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },

  infoDescription: {
    color: '#718084',
    fontSize: 12,
    lineHeight: 17,
  },

  managementCard: {
    minHeight: 78,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  managementCardPressed: {
    opacity: 0.7,
  },

  managementIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  managementContent: {
    flex: 1,
    paddingRight: 10,
  },

  managementTitle: {
    color: '#172D34',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },

  managementDescription: {
    color: '#718084',
    fontSize: 12,
    lineHeight: 17,
  },

  logout: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DDDD',
    marginTop: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  logoutPressed: {
    opacity: 0.7,
  },

  logoutDisabled: {
    opacity: 0.7,
  },

  logoutText: {
    color: '#B44747',
    fontSize: 15,
    fontWeight: '700',
  },
});