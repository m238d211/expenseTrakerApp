/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { ActivityIndicator, AppState, StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';
import { clearToken, readToken } from './src/auth/storage';
import { api } from './src/api/client';
import { registerForPushNotifications } from './src/notifications/push';
import { colors } from './src/design/tokens';

const queryClient = new QueryClient();

function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => { readToken().then(async token => { if (!token) return; try { await api.me(token); setAuthenticated(true); } catch { await clearToken(); } }).finally(() => setReady(true)); }, []);
  useEffect(() => { if (!authenticated) return; let unsubscribe: (() => void) | undefined; readToken().then(token => token ? registerForPushNotifications(token).then(cleanup => { unsubscribe = cleanup; }) : undefined); return () => unsubscribe?.(); }, [authenticated]);
  useEffect(() => {
    if (!authenticated) return;
    const refresh = () => { void queryClient.invalidateQueries(); };
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    const interval = setInterval(refresh, 20000);
    return () => { subscription.remove(); clearInterval(interval); };
  }, [authenticated]);

  return (
    <QueryClientProvider client={queryClient}><SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {ready ? <AppNavigator authenticated={authenticated} onSignedIn={() => setAuthenticated(true)} onSignedOut={() => setAuthenticated(false)} /> : <Startup />}
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
