import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { MFThemeProvider, useMFTheme } from '@/contexts/MFThemeContext';

function MFRootNavigator() {
  const { theme, colors } = useMFTheme();
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    // Complementa a proteção no HTML inicial para navegação SPA.
    document.documentElement.lang = 'pt-BR';
    for (const el of [document.documentElement, document.body, document.getElementById('root')]) {
      if (!el) continue;
      el.setAttribute('translate', 'no');
      el.classList.add('notranslate');
    }
  }, []);
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <MFThemeProvider>
      <AuthProvider>
        <MFRootNavigator />
      </AuthProvider>
    </MFThemeProvider>
  );
}
