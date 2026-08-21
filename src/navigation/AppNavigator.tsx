import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CalendarCheck2,
  ChartPie,
  House,
  ReceiptText,
  ListChecks,
} from 'lucide-react-native';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TransactionScreen } from '../screens/TransactionScreen';
import { IncomeScreen } from '../screens/IncomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { PlanningScreen } from '../screens/PlanningScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { EditTransactionScreen } from '../screens/EditTransactionScreen';
import { colors } from '../design/tokens';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  AddTransaction: { type: 'expense' | 'income' };
  AddIncome: undefined;
  EditTransaction: { id: string };
  Settings: undefined;
};
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  const iconOptions = (Icon: typeof House) => ({
    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
      <Icon color={color} size={size} strokeWidth={2.2} />
    ),
  });
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.emeraldDark,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarActiveBackgroundColor: colors.navActiveSurface,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 3 },
        tabBarStyle: {
          height: 82,
          paddingBottom: 9,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.navSurface,
          elevation: 14,
          shadowColor: colors.ink,
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -5 },
        },
      }}
    >

      <Tabs.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: 'العمليات', ...iconOptions(ReceiptText) }}
      />
      <Tabs.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'التحليل', ...iconOptions(ChartPie) }}
      />
        <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'الرئيسية', ...iconOptions(House) }}
      />
      <Tabs.Screen
        name="Planning"
        component={PlanningScreen}
        options={{ title: 'التخطيط', ...iconOptions(CalendarCheck2) }}
      />

      <Tabs.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: 'المهام', ...iconOptions(ListChecks) }}
      />
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
              {() => <MainTabs />}
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
            <Stack.Screen name="Settings">
              {props => <SettingsScreen {...props} onSignedOut={onSignedOut} />}
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
