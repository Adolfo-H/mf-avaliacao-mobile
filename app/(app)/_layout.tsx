import { Redirect, Stack } from 'expo-router';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#123C47"
        />

        <Text style={styles.loadingText}>
          Verificando sessão...
        </Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}

const styles = StyleSheet.create({
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
});