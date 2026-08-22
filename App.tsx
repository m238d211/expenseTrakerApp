/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { ActivityIndicator, AppState, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';
import { clearToken, readToken } from './src/auth/storage';
import { ApiError, api } from './src/api/client';
import { loadSavedNotifications, registerForPushNotifications } from './src/notifications/push';
import { clearNotifications } from './src/notifications/store';
import { colors } from './src/design/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    readToken()
      .then(async token => {
        if (!token) return;
        try {
          await api.me(token);
          setAuthenticated(true);
        } catch (error) {
          if (error instanceof ApiError && error.kind === 'auth') {
            await clearToken();
          } else {
            // Keep the local session during outages so the app can show cached data and retry.
            setAuthenticated(true);
          }
        }
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!authenticated) {
      clearNotifications();
      return;
    }
  }, [authenticated]);
  useEffect(() => {
    if (!authenticated) return;
    let unsubscribe: (() => void) | undefined;
    readToken().then(token => {
      if (!token) return;
      void loadSavedNotifications(token);
      registerForPushNotifications(token)
        .then(cleanup => {
          unsubscribe = cleanup;
        })
        .catch(() => undefined);
    });
    return () => unsubscribe?.();
  }, [authenticated]);
  useEffect(() => {
    if (!authenticated) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void queryClient.refetchQueries({ type: 'active' });
    });
    return () => subscription.remove();
  }, [authenticated]);

  return (
    <QueryClientProvider client={queryClient}><SafeAreaProvider>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {ready ? <AppNavigator authenticated={authenticated} onSignedIn={() => setAuthenticated(true)} onSignedOut={() => setAuthenticated(false)} /> : <Startup />}
      <Toast />
    </SafeAreaProvider></QueryClientProvider>
  );
}

function Startup() {
  return <View style={styles.container}><ActivityIndicator size="large" color={colors.emerald} /></View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
