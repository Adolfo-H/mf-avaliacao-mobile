import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { MFThemeProvider, useMFTheme } from '@/contexts/MFThemeContext';

function MFRootNavigator() {
  const { theme, colors } = useMFTheme();
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
