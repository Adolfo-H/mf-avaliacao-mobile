import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { restoreSession } from '@/services/auth';

export default function WelcomeScreen() {
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const user = await restoreSession();

        if (user) {
          router.replace('/(app)/(tabs)/dashboard');
          return;
        }
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>MF</Text>
        </View>

        <ActivityIndicator
          size="large"
          color="#123C47"
          style={styles.loadingIndicator}
        />

        <Text style={styles.loadingText}>
          Carregando...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>MF</Text>
        </View>

        <Text style={styles.brand}>
          Saúde e Movimento
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>
          AVALIAÇÃO FÍSICA
        </Text>

        <Text style={styles.title}>
          Acompanhe cada evolução de forma simples e completa.
        </Text>

        <Text style={styles.description}>
          Alunos, avaliações, composição corporal, medidas, evolução e
          relatórios em um único aplicativo.
        </Text>

        <View style={styles.feature}>
          <View style={styles.featureDot} />

          <Text style={styles.featureText}>
            Avaliações organizadas por aluno
          </Text>
        </View>

        <View style={styles.feature}>
          <View style={styles.featureDot} />

          <Text style={styles.featureText}>
            Histórico completo de evolução
          </Text>
        </View>

        <View style={styles.feature}>
          <View style={styles.featureDot} />

          <Text style={styles.featureText}>
            Informações protegidas e centralizadas
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.buttonText}>
            Entrar
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          MF Saúde e Movimento
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F6',
    paddingHorizontal: 24,
  },

  header: {
    paddingTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#123C47',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  brand: {
    color: '#123C47',
    fontSize: 18,
    fontWeight: '700',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
  },

  label: {
    color: '#40856C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
  },

  title: {
    color: '#122A32',
    fontSize: 38,
    lineHeight: 45,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 18,
  },

  description: {
    color: '#66757A',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },

  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#40856C',
    marginRight: 12,
  },

  featureText: {
    color: '#344A51',
    fontSize: 15,
    fontWeight: '500',
  },

  footer: {
    paddingBottom: 30,
  },

  button: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#123C47',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  footerText: {
    textAlign: 'center',
    color: '#96A1A4',
    fontSize: 12,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingLogo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#123C47',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  loadingLogoText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
  },

  loadingIndicator: {
    marginBottom: 14,
  },

  loadingText: {
    color: '#66757A',
    fontSize: 14,
    fontWeight: '600',
  },
});