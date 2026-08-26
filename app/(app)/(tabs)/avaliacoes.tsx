import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function AssessmentsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>ACOMPANHAMENTO</Text>
            <Text style={styles.title}>Avaliações</Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() =>
              Alert.alert(
                'Em breve',
                'Vamos construir o fluxo completo da avaliação depois do cadastro de alunos.'
              )
            }
          >
            <Ionicons name="add" size={25} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.empty}>
          <View style={styles.icon}>
            <Ionicons
              name="clipboard-outline"
              size={34}
              color="#40856C"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Nenhuma avaliação ainda
          </Text>

          <Text style={styles.emptyText}>
            As avaliações físicas do aluno serão organizadas e acompanhadas
            por aqui.
          </Text>

          <Pressable
            style={styles.button}
            onPress={() =>
              Alert.alert(
                'Cadastro necessário',
                'Primeiro construiremos o cadastro de alunos.'
              )
            }
          >
            <Text style={styles.buttonText}>
              Nova avaliação
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