import { Platform, Alert } from 'react-native';

/**
 * Cross-platform alert. React Native's Alert.alert is a no-op on web.
 */
export function showAlert(title: string, message: string, onOk?: () => void): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    onOk?.();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
}

/**
 * Cross-platform confirm dialog. Returns a promise that resolves to true if confirmed.
 */
export function showConfirm(
  title: string,
  message: string
): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const result = window.confirm(`${title}\n\n${message}`);
      resolve(result);
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'OK', onPress: () => resolve(true) },
      ]);
    }
  });
}
