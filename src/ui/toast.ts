import Toast from 'react-native-toast-message';

export function showError(title: string, error?: unknown, fallback = 'حاول مرة أخرى') {
  const description =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : fallback;

  Toast.show({
    type: 'error',
    text1: title,
    text2: description,
    position: 'bottom',
    visibilityTime: 4000,
    autoHide: true,
  });
}
