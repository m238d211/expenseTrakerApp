import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { readToken } from '../auth/storage';
import { colors, radius, spacing, typography } from '../design/tokens';
import { DataLoading } from '../components/DataLoading';
import { DataError } from '../components/DataError';
import { RefreshableScrollView } from '../components/RefreshableScrollView';

export function AnalyticsScreen() {
  const monthly = useQuery({
    queryKey: ['monthly'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('Session expired');
      return api.monthly(token);
    },
  });
  const safe = useQuery({
    queryKey: ['safe-to-spend'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('Session expired');
      return api.safeToSpend(token);
    },
  });
  const trends = useQuery({
    queryKey: ['trends'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('Session expired');
      return api.trends(token, 6);
    },
  });
  const data = monthly.data;
  const categories = Object.entries(data?.byCategory ?? {}).sort(
    (a, b) => b[1] - a[1],
  );
  const trendItems = trends.data ?? [];
  const maxTrend = Math.max(
    ...trendItems.map(item => Math.max(item.income, item.expenses)),
    1,
  );
  if (monthly.isLoading || safe.isLoading || trends.isLoading) {
    return (
      <RefreshableScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.title}>التحليل المالي</Text>
        <DataLoading />
      </RefreshableScrollView>
    );
  }
  if (monthly.isError || safe.isError || trends.isError) {
    return (
      <RefreshableScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.title}>حدثت مشكلة اثناء تحديث البيانات</Text>
        <DataError onRetry={() => {
          void monthly.refetch();
          void safe.refetch();
          void trends.refetch();
        }} />
      </RefreshableScrollView>
    );
  }
  return (
    <RefreshableScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>التحليل المالي</Text>
      <Text style={styles.subtitle}>اعرف وين تروح فلوسك قبل نهاية الشهر.</Text>
      <View style={styles.grid}>
        <Metric
          label="الرصيد المرحّل"
          value={data?.openingBalance}
          color={colors.ink}
        />
        <Metric label="الدخل" value={data?.income} color={colors.emeraldDark} />
        <Metric
          label="المصروفات"
          value={data?.expenses}
          color={colors.danger}
        />
        <Metric label="الادخار" value={data?.savings} color={colors.gold} />
        <Metric
          label="نسبة الادخار"
          value={data ? `${data.savingsRate}%` : undefined}
          color={colors.ink}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>المتاح الآمن للصرف</Text>
        <Text style={styles.safe}>
          {safe.data
            ? `${safe.data.safeToSpend.toLocaleString('en-US')} د.ع / يوم`
            : '...'}
        </Text>
        <Text style={styles.note}>تقدير يومي حسب دخلك ومصروفاتك الحالية.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>اتجاه آخر 6 أشهر</Text>
        {trendItems.map(item => (
          <View key={item.month} style={styles.trendRow}>
            <Text style={styles.trendMonth}>{item.month.slice(5)}</Text>
            <View style={styles.bars}>
              <View
                style={[
                  styles.incomeBar,
                  { width: `${Math.max(2, (item.income / maxTrend) * 100)}%` },
                ]}
              />
              <View
                style={[
                  styles.expenseBar,
                  {
                    width: `${Math.max(2, (item.expenses / maxTrend) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.trendValue}>
              {item.changePercentage === null
                ? '—'
                : `${item.changePercentage}%`}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>المصروفات حسب التصنيف</Text>
        {categories.length ? (
          categories.map(([name, amount]) => (
            <View key={name} style={styles.categoryRow}>
              <Text style={styles.categoryAmount}>
                {amount.toLocaleString('en-US')} د.ع
              </Text>
              <Text style={styles.categoryName}>{name}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.note}>أضف عمليات مصنفة حتى يظهر التحليل.</Text>
        )}
      </View>
    </RefreshableScrollView>
  );
}
function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value?: number | string;
  color: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>
        {value === undefined
          ? '...'
          : typeof value === 'number'
          ? value.toLocaleString('en-US')
          : value}
      </Text>
      <Text style={styles.currency}>
        {typeof value === 'number' ? 'د.ع' : ''}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'right',
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  metric: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'right',
  },
  metricValue: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  currency: { ...typography.label, color: colors.inkMuted, textAlign: 'right' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.heading, color: colors.ink, textAlign: 'right' },
  safe: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.emeraldDark,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  note: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  trendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  trendMonth: { ...typography.label, color: colors.inkMuted, width: 24 },
  bars: { flex: 1, gap: 3 },
  incomeBar: {
    height: 8,
    backgroundColor: colors.emerald,
    borderRadius: radius.pill,
  },
  expenseBar: {
    height: 8,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
  },
  trendValue: {
    ...typography.label,
    color: colors.inkMuted,
    width: 48,
    textAlign: 'left',
  },
  categoryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryName: { ...typography.body, color: colors.ink, fontWeight: '700' },
  categoryAmount: { ...typography.label, color: colors.danger },
});
