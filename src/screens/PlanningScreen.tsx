import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { readToken } from '../auth/storage';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../design/tokens';

export function PlanningScreen() {
  const [mode, setMode] = useState<'budgets' | 'goals' | 'recurring'>(
    'budgets',
  );
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>التخطيط</Text>
      <Text style={styles.subtitle}>
        حوّل دخلك إلى خطة واضحة للإنفاق والادخار.
      </Text>
      <View style={styles.switcher}>
        <Pressable
          onPress={() => setMode('budgets')}
          style={[styles.switch, mode === 'budgets' && styles.activeSwitch]}
        >
          <Text
            style={[styles.switchText, mode === 'budgets' && styles.activeText]}
          >
            الميزانيات
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('goals')}
          style={[styles.switch, mode === 'goals' && styles.activeSwitch]}
        >
          <Text
            style={[styles.switchText, mode === 'goals' && styles.activeText]}
          >
            الأهداف
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('recurring')}
          style={[styles.switch, mode === 'recurring' && styles.activeSwitch]}
        >
          <Text
            style={[
              styles.switchText,
              mode === 'recurring' && styles.activeText,
            ]}
          >
            المتكررة
          </Text>
        </Pressable>
      </View>
      {mode === 'budgets' ? (
        <Budgets />
      ) : mode === 'goals' ? (
        <Goals />
      ) : (
        <Recurring />
      )}
    </ScrollView>
  );
}
function Budgets() {
  const [amount, setAmount] = useState('');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.budgets(token);
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      const now = new Date();
      return api.createBudget(token, {
        amount: Number(amount),
        startDate: new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
        ).toISOString(),
        endDate: new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
        ).toISOString(),
      });
    },
    onSuccess: async () => {
      setAmount('');
      await client.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: e =>
      Alert.alert(
        'تعذر حفظ الميزانية',
        e instanceof Error ? e.message : 'حاول مرة أخرى',
      ),
  });
  return (
    <>
      <View style={styles.form}>
        <Text style={styles.formTitle}>ميزانية هذا الشهر</Text>
        <Field
          label="الحد الأعلى للمصروفات"
          placeholder="مثلاً 500000"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
        />
        <PrimaryButton
          title="إضافة ميزانية"
          loading={mutation.isPending}
          onPress={() =>
            Number(amount) > 0
              ? mutation.mutate()
              : Alert.alert('بيانات ناقصة', 'أدخل مبلغ الميزانية')
          }
        />
      </View>
      {query.data?.map(item => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.itemTitle}>
            {item.category?.name ?? 'كل المصروفات'}
          </Text>
          <Text style={styles.itemValue}>
            {item.amount.toLocaleString('en-US')} د.ع
          </Text>
          <Text style={styles.note}>الميزانية الشهرية الحالية</Text>
        </View>
      ))}
    </>
  );
}
function Goals() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['savings-goals'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.savingsGoals(token);
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.createSavingsGoal(token, {
        name,
        targetAmount: Number(amount),
      });
    },
    onSuccess: async () => {
      setName('');
      setAmount('');
      await client.invalidateQueries({ queryKey: ['savings-goals'] });
    },
    onError: e =>
      Alert.alert(
        'تعذر حفظ الهدف',
        e instanceof Error ? e.message : 'حاول مرة أخرى',
      ),
  });
  return (
    <>
      <View style={styles.form}>
        <Text style={styles.formTitle}>هدف جديد</Text>
        <Field
          label="اسم الهدف"
          placeholder="مثلاً سفر"
          value={name}
          onChangeText={setName}
        />
        <Field
          label="المبلغ المستهدف"
          placeholder="مثلاً 2000000"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
        />
        <PrimaryButton
          title="إضافة هدف"
          loading={mutation.isPending}
          onPress={() =>
            name.trim() && Number(amount) > 0
              ? mutation.mutate()
              : Alert.alert('بيانات ناقصة', 'أدخل اسم الهدف والمبلغ')
          }
        />
      </View>
      {query.data?.map(item => {
        const progress = item.targetAmount
          ? Math.min(
              100,
              Math.round((item.currentAmount / item.targetAmount) * 100),
            )
          : 0;
        return (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemValue}>
              {item.currentAmount.toLocaleString('en-US')} /{' '}
              {item.targetAmount.toLocaleString('en-US')} د.ع
            </Text>
            <View style={styles.track}>
              <View style={[styles.progress, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.note}>{progress}% مكتمل</Text>
          </View>
        );
      })}
    </>
  );
}
function Recurring() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly'
  >('monthly');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.recurringTransactions(token);
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.createRecurringTransaction(token, {
        amount: Number(amount),
        description,
        type: 'expense',
        frequency,
        nextRunAt: new Date().toISOString(),
      });
    },
    onSuccess: async () => {
      setAmount('');
      setDescription('');
      await client.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
    onError: e =>
      Alert.alert(
        'تعذر حفظ العملية المتكررة',
        e instanceof Error ? e.message : 'حاول مرة أخرى',
      ),
  });
  return (
    <>
      <View style={styles.form}>
        <Text style={styles.formTitle}>عملية متكررة جديدة</Text>
        <Field
          label="الوصف"
          placeholder="مثلاً إيجار"
          value={description}
          onChangeText={setDescription}
        />
        <Field
          label="المبلغ"
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
        />
        <View style={styles.switcher}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(value => (
            <Pressable
              key={value}
              onPress={() => setFrequency(value)}
              style={[
                styles.switch,
                frequency === value && styles.activeSwitch,
              ]}
            >
              <Text
                style={
                  frequency === value ? styles.activeText : styles.switchText
                }
              >
                {
                  {
                    daily: 'يومي',
                    weekly: 'أسبوعي',
                    monthly: 'شهري',
                    yearly: 'سنوي',
                  }[value]
                }
              </Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          title="إضافة العملية"
          loading={mutation.isPending}
          onPress={() =>
            description.trim() && Number(amount) > 0
              ? mutation.mutate()
              : Alert.alert('بيانات ناقصة', 'أدخل الوصف والمبلغ')
          }
        />
      </View>
      {query.data?.map(item => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.itemTitle}>{item.description}</Text>
          <Text style={styles.itemValue}>
            {item.amount.toLocaleString('en-US')} د.ع •{' '}
            {item.isActive ? 'فعالة' : 'متوقفة'}
          </Text>
          <Text style={styles.note}>
            التنفيذ القادم:{' '}
            {new Date(item.nextRunAt).toLocaleDateString('ar-IQ')}
          </Text>
        </View>
      ))}
    </>
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
  switcher: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switch: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  activeSwitch: { backgroundColor: colors.ink },
  switchText: { ...typography.label, color: colors.inkMuted },
  activeText: { color: colors.white },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: { ...typography.heading, color: colors.ink, textAlign: 'right' },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTitle: { ...typography.heading, color: colors.ink, textAlign: 'right' },
  itemValue: {
    ...typography.body,
    color: colors.emeraldDark,
    textAlign: 'right',
    marginTop: spacing.xs,
    fontWeight: '700',
  },
  note: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  track: {
    height: 8,
    backgroundColor: colors.mint,
    borderRadius: radius.pill,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: colors.emerald,
    borderRadius: radius.pill,
  },
});
