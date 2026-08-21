import { Alert, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { api } from '../api/client';

export async function registerForPushNotifications(accessToken: string) {
  const authorization = await messaging().requestPermission();
  const enabled = authorization === messaging.AuthorizationStatus.AUTHORIZED || authorization === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) return () => undefined;

  const deviceToken = await messaging().getToken();
  if (deviceToken) await api.registerDevice(accessToken, deviceToken, Platform.OS === 'ios' ? 'ios' : 'android');
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async nextToken => {
    try {
      await api.registerDevice(accessToken, nextToken, Platform.OS === 'ios' ? 'ios' : 'android');
    } catch {
      // Registration will be retried on the next authenticated app start.
    }
  });
  const unsubscribeForeground = messaging().onMessage(async message => {
    const title = message.notification?.title ?? 'مصروفي';
    const body = message.notification?.body ?? 'لديك إشعار جديد';
    Alert.alert(title, body);
  });
  return () => {
    unsubscribeTokenRefresh();
    unsubscribeForeground();
  };
}

export async function unregisterForPushNotifications(accessToken: string) {
  const deviceToken = await messaging().getToken();
  if (deviceToken) await api.removeDevice(accessToken, deviceToken);
}
