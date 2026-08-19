import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TransactionScreen } from '../screens/TransactionScreen';
import { IncomeScreen } from '../screens/IncomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { PlanningScreen } from '../screens/PlanningScreen';
import { EditTransactionScreen } from '../screens/EditTransactionScreen';
import { colors } from '../design/tokens';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  AddTransaction: { type: 'expense' | 'income' };
  AddIncome: undefined;
  EditTransaction: { id: string };
};
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function MainTabs({ onSignedOut }: { onSignedOut: () => void }) {
  const icon = (glyph: string) => (
    <Text style={{ fontSize: 24, lineHeight: 28 }}>{glyph}</Text>
  );
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.emeraldDark,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarIconStyle: { height: 30 },
        tabBarStyle: {
          height: 70,
          paddingBottom: 8,
          paddingTop: 5,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'الرئيسية', tabBarIcon: () => icon('⌂') }}
      />
      <Tabs.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: 'العمليات', tabBarIcon: () => icon('▤') }}
      />
      <Tabs.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'التحليل', tabBarIcon: () => icon('◔') }}
      />
      <Tabs.Screen
        name="Planning"
        component={PlanningScreen}
        options={{ title: 'التخطيط', tabBarIcon: () => icon('◎') }}
      />
      <Tabs.Screen
        name="Settings"
        options={{ title: 'الإعدادات', tabBarIcon: () => icon('⚙') }}
      >
        {props => <SettingsScreen {...props} onSignedOut={onSignedOut} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

export function AppNavigator({
  authenticated,
  onSignedIn,
  onSignedOut,
}: {
  authenticated: boolean;
  onSignedIn: () => void;
  onSignedOut: () => void;
}) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        {authenticated ? (
          <>
            <Stack.Screen name="MainTabs">
              {() => <MainTabs onSignedOut={onSignedOut} />}
            </Stack.Screen>
            <Stack.Screen name="AddTransaction">
              {props => <TransactionScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="AddIncome">
              {props => <IncomeScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="EditTransaction">
              {props => <EditTransactionScreen {...props} />}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Auth">
            {props => <AuthScreen {...props} onSignedIn={onSignedIn} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
