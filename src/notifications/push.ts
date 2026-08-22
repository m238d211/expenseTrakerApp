import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { api } from '../api/client';
import { addNotification, hydrateNotifications } from './store';

function saveMessage(message: {
  notification?: { title?: string; body?: string };
  data?: { title?: string; body?: string; notificationId?: string };
}) {
  addNotification({
    id: message.data?.notificationId,
    title: message.notification?.title ?? message.data?.title ?? 'مصروفي',
    body: message.notification?.body ?? message.data?.body ?? 'لديك إشعار جديد',
  });
}

export async function loadSavedNotifications(accessToken: string) {
  try {
    const saved = await api.notifications(accessToken);
    hydrateNotifications(
      saved.map(notification => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        receivedAt: notification.createdAt,
        readAt: notification.readAt,
      })),
    );
  } catch {
    // Live FCM notifications remain available when the history request is offline.
  }
}

export async function registerForPushNotifications(accessToken: string) {
  const authorization = await messaging().requestPermission();
  const enabled = authorization === messaging.AuthorizationStatus.AUTHORIZED || authorization === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) return () => undefined;

  const unsubscribeForeground = messaging().onMessage(async message => {
    saveMessage(message);
  });
  const unsubscribeOpened = messaging().onNotificationOpenedApp(message => {
    saveMessage(message);
  });
  void messaging()
    .getInitialNotification()
    .then(message => {
      if (message) saveMessage(message);
    });

  const deviceToken = await messaging().getToken();
  if (deviceToken) await api.registerDevice(accessToken, deviceToken, Platform.OS === 'ios' ? 'ios' : 'android');
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async nextToken => {
    try {
      await api.registerDevice(accessToken, nextToken, Platform.OS === 'ios' ? 'ios' : 'android');
    } catch {
      // Registration will be retried on the next authenticated app start.
    }
  });
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
