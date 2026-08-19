declare module '@react-native-firebase/messaging' {
  type Messaging = {
    requestPermission: () => Promise<number>;
    getToken: () => Promise<string>;
    onTokenRefresh: (listener: (token: string) => void) => () => void;
    onMessage: (listener: (message: { notification?: { title?: string; body?: string } }) => void) => () => void;
  };
  const messaging: (() => Messaging) & { AuthorizationStatus: { AUTHORIZED: number; PROVISIONAL: number } };
  export default messaging;
}
