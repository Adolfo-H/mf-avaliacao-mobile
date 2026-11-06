import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  busy: boolean;
  completedSections: number;
  totalSections: number;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Janela própria e acessível: funciona tanto no iPhone/PWA como no aplicativo nativo. */
export function AssessmentCompletionDialog({
  visible,
  busy,
  completedSections,
  totalSections,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <View style={styles.symbol}>
            <Ionicons name="checkmark-done-outline" size={31} color="#40856C" />
          </View>
          <Text style={styles.eyebrow}>FINALIZAÇÃO</Text>
          <Text style={styles.title}>Concluir avaliação?</Text>
          <Text style={styles.description}>
            Ao concluir, os dados ficarão disponíveis para consulta,
            histórico e relatórios, sem possibilidade de edição.
          </Text>

          <View style={styles.progressRow}>
            <Ionicons name="checkmark-circle" size={19} color="#40856C" />
            <Text style={styles.progressText}>
              {completedSections} de {totalSections} seções concluídas
            </Text>
          </View>

          <View style={styles.noteRow}>
            <Ionicons name="information-circle-outline" size={18} color="#A17324" />
            <Text style={styles.noteText}>
              Confira os dados antes de confirmar. Esta ação não pode ser desfeita.
            </Text>
          </View>

          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar conclusão da avaliação"
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              disabled={busy}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Voltar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirmar conclusão da avaliação"
              style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
              disabled={busy}
              onPress={onConfirm}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark" size={19} color="#FFFFFF" />
              )}
              <Text style={styles.confirmText}>Concluir</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 30, 37, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: 425,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E4E9E7',
    paddingHorizontal: 23,
    paddingTop: 26,
    paddingBottom: 22,
  },
  symbol: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: '#E7F3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#40856C',
    marginBottom: 7,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#172D34',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#617277',
    marginBottom: 19,
  },
  progressRow: {
    backgroundColor: '#EAF5EF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    color: '#2E7059',
    fontWeight: '800',
    flexShrink: 1,
  },
  noteRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF7E9',
    borderRadius: 12,
    padding: 12,
    gap: 9,
    marginBottom: 22,
  },
  noteText: {
    color: '#845E23',
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    minHeight: 51,
    backgroundColor: '#F7F9F8',
    borderColor: '#DDE6E1',
    borderWidth: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '800', color: '#526A6E' },
  confirmButton: {
    flex: 1.3,
    minHeight: 51,
    backgroundColor: '#123C47',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  confirmText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  pressed: { opacity: 0.75 },
});
