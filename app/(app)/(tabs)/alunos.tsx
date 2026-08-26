import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function StudentsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>MF</Text>
            <Text style={styles.title}>Alunos</Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() =>
              Alert.alert(
                'Próxima etapa',
                'Agora vamos desenvolver o cadastro completo de alunos.'
              )
            }
          >
            <Ionicons name="add" size={25} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.empty}>
          <View style={styles.icon}>
            <Ionicons
              name="people-outline"
              size={34}
              color="#40856C"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Nenhum aluno cadastrado
          </Text>

          <Text style={styles.emptyText}>
            Quando cadastrarmos o primeiro aluno, ele aparecerá nesta tela.
          </Text>

          <Pressable
            style={styles.button}
            onPress={() =>
              Alert.alert(
                'Próxima etapa',
                'O cadastro de aluno será nossa próxima funcionalidade.'
              )
            }
          >
            <Text style={styles.buttonText}>
              Cadastrar aluno
            </Text>
          </Pressable>
        </View>
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
    paddingTop: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#123C47',
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  icon: {
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
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },

  emptyText: {
    color: '#718084',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },

  button: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 17,
    backgroundColor: '#123C47',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});