import { Alert, Platform } from 'react-native';

type ConfirmationOptions = {
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

/**
 * Diálogo explícito em PWA (React Native Web) e aplicativos iOS/Android.
 * Não usar Alert.alert diretamente para ações irreversíveis na Web.
 */
export function confirmAction(
  title: string,
  message: string,
  options: ConfirmationOptions = {}
): Promise<boolean> {
  const confirmLabel = options.confirmLabel ?? 'Confirmar';
  const cancelLabel = options.cancelLabel ?? 'Cancelar';

  if (Platform.OS === 'web') {
    return Promise.resolve(
      typeof window !== 'undefined' &&
        window.confirm(`${title}\n\n${message}`)
    );
  }

  return new Promise<boolean>(resolve => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelLabel,
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: confirmLabel,
          style: options.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      }
    );
  });
}
