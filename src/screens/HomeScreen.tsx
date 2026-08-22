import React, { useEffect, useState } from 'react';
import {
  NativeModules,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react-native';
import { api } from '../api/client';
import { readToken } from '../auth/storage';
import { colors, radius, spacing, typography } from '../design/tokens';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { QuickAddSheet } from '../components/QuickAddSheet';
import { DataLoading } from '../components/DataLoading';
import { DataError } from '../components/DataError';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { showError } from '../ui/toast';
import { NotificationCenter } from '../components/NotificationCenter';
import { useNotifications } from '../notifications/store';
export function HomeScreen({
  navigation,
}: {
  navigation: {
    navigate: (
      screen: 'Settings' | 'AddTransaction' | 'AddIncome',
      params?: { type: 'expense' | 'income' },
    ) => void;
  };
}) {
  const summary = useQuery({
    queryKey: ['monthly'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.monthly(token);
    },
  });
  const profile = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.me(token);
    },
  });
  const transactions = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.transactions(token);
    },
  });
  const telegramStatus = useQuery({
    queryKey: ['telegram-status'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.telegramStatus(token);
    },
    retry: false,
  });
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    description: string;
  } | null>(null);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const notifications = useNotifications();
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.deleteTransaction(token, id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['monthly'] });
    },
    onError: error => showError('تعذر حذف العملية', error),
  });
  
  function openDeleteDialog(id: string, description: string) {
    setPendingDelete({ id, description });
  }
  const data = summary.data;
  useEffect(() => {
    const balance =
      (data?.openingBalance ?? 0) + (data?.income ?? 0) - (data?.expenses ?? 0);
    const updateWidget = NativeModules.ExpenseWidget?.updateSnapshot;
    if (updateWidget && transactions.data?.data)
      updateWidget(
        balance,
        transactions.data.data
          .slice(0, 3)
          .map(
            item =>
              `${item.description}: ${item.amount.toLocaleString('en-US')} د.ع`,
          ),
        new Date().toISOString(),
      );
  }, [data, transactions.data]);
  return (
    <RefreshableScrollView contentContainerStyle={styles.screen}>
      {telegramStatus.data && !telegramStatus.data.linked && (
        <View style={styles.telegramBanner}>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>اربط Telegram بمصروفي</Text>
            <Text style={styles.bannerText}>
              سجّل مصروفاتك من البوت وخليها توصل لتطبيقك.
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={styles.bannerButton}
          >
            <Text style={styles.bannerButtonText}>ربط الآن</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>لوحة المتابعة</Text>
          <Text style={styles.title}>
            مرحبا {profile.data?.name || 'بك'}👋
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="الإشعارات"
            onPress={() => setNotificationsVisible(true)}
            style={styles.headerButton}
          >
            <Bell color={colors.ink} size={21} />
            {notifications.some(notification => !notification.readAt) && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notifications.filter(notification => !notification.readAt).length > 1
                    ? '1+'
                    : notifications.filter(notification => !notification.readAt).length}
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="الإعدادات"
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerButton}
          >
            <Text style={styles.settingsText}>⚙</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>الرصيد الحالي</Text>
        <Text style={styles.balanceValue}>
          {data
            ? `${(
                (data.openingBalance ?? 0) +
                data.income -
                data.expenses
              ).toLocaleString('en-US')} د.ع`
            : '—'}
        </Text>
        <Text style={styles.balanceHint}>
          {data
            ? `${
                (data.openingBalance ?? 0) > 0
                  ? `مرحل من الشهر السابق: ${(
                      data.openingBalance ?? 0
                    ).toLocaleString('en-US')} د.ع • `
                  : ''
              }ادخار ${data.savingsRate}% هذا الشهر`
            : 'جاري تحميل الملخص...'}
        </Text>
      </View>
      <Pressable
        style={styles.quickAdd}
        onPress={() => setQuickAddVisible(true)}
      >
        <Text style={styles.quickAddText}>+ إضافة سريعة</Text>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          onPress={() =>
            navigation.navigate('AddTransaction', { type: 'expense' })
          }
          style={styles.action}
        >
          <Text style={styles.actionIcon}>−</Text>
          <Text style={styles.actionText}>مصروف</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('AddIncome')}
          style={styles.action}
        >
          <Text style={[styles.actionIcon, styles.income]}>+</Text>
          <Text style={styles.actionText}>دخل ثابت</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionTitle}>آخر العمليات</Text>
      {summary.isError || transactions.isError ? (
        <DataError onRetry={() => {
          void summary.refetch();
          void transactions.refetch();
        }} />
      ) : summary.isLoading || transactions.isLoading ? (
        <DataLoading />
      ) : transactions.data?.data.length ? (
        transactions.data.data.slice(0, 8).map(item => (
          <View key={item.id} style={styles.row}>
            <View>
              <Text style={styles.rowDescription}>{item.description}</Text>
              <Text style={styles.rowCategory}>
                {item.category?.name ?? 'بدون تصنيف'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="حذف العملية"
              onPress={() => openDeleteDialog(item.id, item.description)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>حذف</Text>
            </Pressable>
            <Text
              style={[
                styles.rowAmount,
                item.type === 'income' && styles.incomeText,
              ]}
            >
              {item.type === 'income' ? '+' : '−'}
              {item.amount.toLocaleString('en-US')} د.ع
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>◌</Text>
          <Text style={styles.emptyTitle}>لا توجد عمليات بعد</Text>
          <Text style={styles.emptyText}>
            ابدأ بإضافة أول مصروف أو دخل حتى يظهر ملخصك هنا.
          </Text>
        </View>
      )}
      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title="حذف العملية"
        message={
          pendingDelete ? `هل تريد حذف «${pendingDelete.description}»؟` : ''
        }
        confirmLabel="حذف"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
      <QuickAddSheet
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onExpense={() => {
          setQuickAddVisible(false);
          navigation.navigate('AddTransaction', { type: 'expense' });
        }}
        onIncome={() => {
          setQuickAddVisible(false);
          navigation.navigate('AddIncome');
        }}
      />
      <NotificationCenter
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </RefreshableScrollView>
  );
}
const styles = StyleSheet.create({
  quickAdd: {
    backgroundColor: colors.quickAddSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  quickAddText: { ...typography.body, color: colors.quickAddText, fontWeight: '700' },
  screen: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  eyebrow: { ...typography.label, color: colors.emerald },
  title: { ...typography.heading, color: colors.ink, marginTop: spacing.xs },
  headerActions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
  },
  settingsText: { fontSize: 22, color: colors.ink },
  telegramBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  bannerCopy: { flex: 1 },
  bannerTitle: {
    ...typography.body,
    color: colors.ink,
    textAlign: 'right',
    fontWeight: '800',
  },
  bannerText: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: 3,
  },
  bannerButton: {
    backgroundColor: colors.emerald,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  bannerButtonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '800',
  },
  balance: {
    backgroundColor: colors.balanceSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  balanceLabel: { ...typography.label, color: colors.balanceText, textAlign: 'right' },
  balanceValue: {
    color: colors.balanceText,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  balanceHint: {
    ...typography.label,
    color: colors.balanceMuted,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  action: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: { color: colors.danger, fontSize: 28, fontWeight: '600' },
  income: { color: colors.emerald },
  actionText: { ...typography.label, color: colors.ink, marginTop: spacing.xs },
  sectionTitle: {
    ...typography.heading,
    color: colors.ink,
    textAlign: 'right',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowDescription: {
    ...typography.body,
    color: colors.ink,
    textAlign: 'right',
    fontWeight: '600',
  },
  rowCategory: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  rowAmount: { ...typography.label, color: colors.danger },
  incomeText: { color: colors.emeraldDark },
  deleteButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  deleteText: { ...typography.label, color: colors.danger, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyIcon: { fontSize: 44, color: colors.gold },
  emptyTitle: {
    ...typography.heading,
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
});
