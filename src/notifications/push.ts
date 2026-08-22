import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { api } from '../api/client';
import { addNotification } from './store';

function saveMessage(message: {
  notification?: { title?: string; body?: string };
}) {
  addNotification({
    title: message.notification?.title ?? 'مصروفي',
    body: message.notification?.body ?? 'لديك إشعار جديد',
  });
}

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
    saveMessage(message);
  });
  const unsubscribeOpened = messaging().onNotificationOpenedApp(message => {
    saveMessage(message);
  });
  const initialNotification = await messaging().getInitialNotification();
  if (initialNotification) saveMessage(initialNotification);
  return () => {
    unsubscribeTokenRefresh();
    unsubscribeForeground();
    unsubscribeOpened();
  };
}

export async function unregisterForPushNotifications(accessToken: string) {
  const deviceToken = await messaging().getToken();
  if (deviceToken) await api.removeDevice(accessToken, deviceToken);
}
