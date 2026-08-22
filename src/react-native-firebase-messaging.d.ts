declare module '@react-native-firebase/messaging' {
  type Messaging = {
    requestPermission: () => Promise<number>;
    getToken: () => Promise<string>;
    onTokenRefresh: (listener: (token: string) => void) => () => void;
    onMessage: (listener: (message: { notification?: { title?: string; body?: string }; data?: { title?: string; body?: string; notificationId?: string } }) => void) => () => void;
    onNotificationOpenedApp: (listener: (message: { notification?: { title?: string; body?: string }; data?: { title?: string; body?: string; notificationId?: string } }) => void) => () => void;
    getInitialNotification: () => Promise<{ notification?: { title?: string; body?: string }; data?: { title?: string; body?: string; notificationId?: string } } | null>;
  };
  const messaging: (() => Messaging) & { AuthorizationStatus: { AUTHORIZED: number; PROVISIONAL: number } };
  export default messaging;
}
