import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>CONTA</Text>
        <Text style={styles.title}>Perfil</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons
              name="person-outline"
              size={30}
              color="#123C47"
            />
          </View>

          <View>
            <Text style={styles.name}>
              Usuário de desenvolvimento
            </Text>

            <Text style={styles.email}>
              Autenticação ainda não conectada
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.logout}
          onPress={() => router.replace('/')}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color="#B44747"
          />

          <Text style={styles.logoutText}>Sair</Text>
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
    padding: 20,
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

  name: {
    color: '#172D34',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },

  email: {
    color: '#718084',
    fontSize: 13,
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
    gap: 10,
  },

  logoutText: {
    color: '#B44747',
    fontSize: 15,
    fontWeight: '700',
  },
});