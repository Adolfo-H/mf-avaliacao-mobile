import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { login } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Informe o e-mail e a senha.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await login(normalizedEmail, password);

      router.replace('/(app)/(tabs)/dashboard');
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível realizar o login.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>MF</Text>
        </View>

        <Text style={styles.title}>Bem-vindo</Text>

        <Text style={styles.description}>
          Acesse o MF Avaliação Física para continuar.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>

          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            placeholder="seuemail@exemplo.com"
            placeholderTextColor="#A1ACAF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            style={styles.input}
          />

          <Text style={[styles.label, styles.passwordLabel]}>
            Senha
          </Text>

          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            placeholder="Digite sua senha"
            placeholderTextColor="#A1ACAF"
            secureTextEntry
            editable={!loading}
            style={styles.input}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.forgotButton}
            disabled={loading}
            onPress={() =>
              Alert.alert(
                'Em breve',
                'A recuperação de senha será implementada posteriormente.'
              )
            }
          >
            <Text style={styles.forgotText}>
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.loginButton,
              loading && styles.loginButtonDisabled,
            ]}
            disabled={loading}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>
                Entrar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.environment}>
        Ambiente de desenvolvimento
      </Text>
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
    paddingTop: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: '#123C47',
    fontSize: 34,
    lineHeight: 36,
    marginTop: -4,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#123C47',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  title: {
    color: '#122A32',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
  },

  description: {
    color: '#6D7B80',
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 36,
  },

  form: {},

  label: {
    color: '#344A51',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },

  passwordLabel: {
    marginTop: 20,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#DEE4E2',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    color: '#122A32',
    fontSize: 16,
  },

  errorBox: {
    marginTop: 14,
    backgroundColor: '#FFF1F1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  errorText: {
    color: '#B44747',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 16,
  },

  forgotText: {
    color: '#40856C',
    fontSize: 14,
    fontWeight: '700',
  },

  loginButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#123C47',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  environment: {
    textAlign: 'center',
    color: '#A0AAAD',
    fontSize: 12,
    paddingBottom: 28,
  },
});