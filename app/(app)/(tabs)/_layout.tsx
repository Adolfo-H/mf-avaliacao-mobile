import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMFTheme } from '@/contexts/MFThemeContext';

/** Barra real é única e compartilhada pelo shell, inclusive nas telas profundas. */
export default function TabsLayout() {
  const { colors } = useMFTheme();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none', backgroundColor: colors.surface } }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Início', tabBarIcon: ({color,size}) => <Ionicons name="home-outline" color={typeof color === 'string' ? color : colors.muted} size={size}/> }} />
      <Tabs.Screen name="alunos" options={{ title: 'Alunos', tabBarIcon: ({color,size}) => <Ionicons name="people-outline" color={typeof color === 'string' ? color : colors.muted} size={size}/> }} />
      <Tabs.Screen name="avaliacoes" options={{ title: 'Avaliações', tabBarIcon: ({color,size}) => <Ionicons name="pulse-outline" color={typeof color === 'string' ? color : colors.muted} size={size}/> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({color,size}) => <Ionicons name="person-outline" color={typeof color === 'string' ? color : colors.muted} size={size}/> }} />
    </Tabs>
  );
}
