import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Budget, RecurringTransaction, SavingsGoal } from '../api/client';
import { readToken } from '../auth/storage';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { colors, radius, spacing, typography } from '../design/tokens';

type Mode = 'budgets' | 'goals' | 'recurring';
export function PlanningScreen() {
  const [mode, setMode] = useState<Mode>('budgets');
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>التخطيط</Text>
      <Text style={styles.subtitle}>
        حوّل دخلك إلى خطة واضحة للإنفاق والادخار.
      </Text>
      <View style={styles.switcher}>
        {(
          [
            ['budgets', 'الميزانيات'],
            ['goals', 'الأهداف'],
            ['recurring', 'المتكررة'],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => setMode(value)}
            style={[styles.switch, mode === value && styles.activeSwitch]}
          >
            <Text
              style={[styles.switchText, mode === value && styles.activeText]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
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
  const [editing, setEditing] = useState<Budget | null>(null);
  const [pending, setPending] = useState<Budget | null>(null);
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
      if (editing)
        return api.updateBudget(token, editing.id, { amount: Number(amount) });
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
    onSuccess: () => {
      setAmount('');
      setEditing(null);
      void client.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: e =>
      Alert.alert(
        'تعذر حفظ الميزانية',
        e instanceof Error ? e.message : 'حاول مرة أخرى',
      ),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.deleteBudget(token, id);
    },
    onSuccess: () => {
      setPending(null);
      void client.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: e =>
      Alert.alert(
        'تعذر حذف الميزانية',
        e instanceof Error ? e.message : 'حاول مرة أخرى',
      ),
  });
  return (
    <>
      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editing ? 'تعديل الميزانية' : 'ميزانية هذا الشهر'}
        </Text>
        <Field
          label="الحد الأعلى للمصروفات"
          placeholder="مثلاً 500000"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
        />
        <View style={styles.formActions}>
          <PrimaryButton
            title={editing ? 'حفظ التعديل' : 'إضافة ميزانية'}
            loading={mutation.isPending}
            onPress={() =>
              Number(amount) > 0
                ? mutation.mutate()
                : Alert.alert('بيانات ناقصة', 'أدخل مبلغ الميزانية')
            }
          />
          {editing && (
            <Pressable
              onPress={() => {
                setEditing(null);
                setAmount('');
              }}
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>إلغاء</Text>
            </Pressable>
          )}
        </View>
      </View>
      {query.data?.map(item => (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemTop}>
            <View style={styles.iconActions}>
              <Pressable
                onPress={() => {
                  setEditing(item);
                  setAmount(String(item.amount));
                }}
                accessibilityLabel="تعديل الميزانية"
              >
                <Pencil color={colors.emeraldDark} size={18} />
              </Pressable>
              <Pressable
                onPress={() => setPending(item)}
                accessibilityLabel="حذف الميزانية"
              >
                <Trash2 color={colors.danger} size={18} />
              </Pressable>
            </View>
            <Text style={styles.itemTitle}>
              {item.category?.name ?? 'كل المصروفات'}
            </Text>
          </View>
          <Text style={styles.itemValue}>
            {item.amount.toLocaleString('en-US')} د.ع
          </Text>
          <Text style={styles.note}>الميزانية الشهرية الحالية</Text>
        </View>
      ))}
      <ConfirmDialog
        visible={Boolean(pending)}
        title="حذف الميزانية"
        message="هل تريد حذف هذه الميزانية؟"
        confirmLabel="حذف"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending.id)}
      />
    </>
  );
}

function Goals() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [pending, setPending] = useState<SavingsGoal | null>(null);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['savings-goals'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.savingsGoals(token);
    },
  });
  const monthly = useQuery({
    queryKey: ['monthly'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.monthly(token);
    },
  });
  const recurring = useQuery({
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
      return editing
        ? api.updateSavingsGoal(token, editing.id, {
            name: name.trim(),
            targetAmount: Number(amount),
            currentAmount: Number(currentAmount),
          })
        : api.createSavingsGoal(token, {
            name: name.trim(),
            targetAmount: Number(amount),
            currentAmount: Number(currentAmount),
          });
    },
    onSuccess: () => {
      setName('');
      setAmount('');
      setCurrentAmount('0');
      setEditing(null);
      void client.invalidateQueries({ queryKey: ['savings-goals'] });
    },
    onError: e =>
      Alert.alert(
        'تعذر حفظ الهدف',
        e instanceof Error ? e.message : 'حاول مرة أخرى',
      ),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.deleteSavingsGoal(token, id);
    },
    onSuccess: () => {
      setPending(null);
      void client.invalidateQueries({ queryKey: ['savings-goals'] });
    },
    onError: e =>
      Alert.alert(
        'تعذر حذف الهدف',
        e instanceof Error ? e.message : 'حاول مرة أخرى',
      ),
  });
  const currentBalance =
    (monthly.data?.openingBalance ?? 0) +
    (monthly.data?.income ?? 0) -
    (monthly.data?.expenses ?? 0);
  const recurringCommitment = (recurring.data ?? [])
    .filter(item => item.isActive && item.type === 'expense')
    .reduce((total, item) => {
      const monthlyAmount =
        item.frequency === 'daily'
          ? item.amount * 30
          : item.frequency === 'weekly'
          ? item.amount * 4
          : item.frequency === 'yearly'
          ? item.amount / 12
          : item.amount;
      return total + monthlyAmount;
    }, 0);
  const budgetOverspend = (monthly.data?.budgets ?? []).reduce(
    (total, budget) => total + Math.max(0, budget.used - budget.amount),
    0,
  );
  const derivedCurrentAmount = Math.max(
    0,
    Math.round(currentBalance - recurringCommitment - budgetOverspend),
  );
  return (
    <>
      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editing ? 'تعديل الهدف' : 'هدف ادخار جديد'}
        </Text>
        <Field
          label="اسم الهدف"
          placeholder="مثلاً: سفر"
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
        <Field
          label="المبلغ المدخر حاليًا"
          placeholder="0"
          value={currentAmount}
          onChangeText={setCurrentAmount}
          keyboardType="number-pad"
        />
        <View style={styles.formActions}>
          <PrimaryButton
            title={editing ? 'حفظ التعديل' : 'إضافة هدف'}
            loading={mutation.isPending}
            onPress={() =>
              name.trim() && Number(amount) > 0 && Number(currentAmount) >= 0
                ? mutation.mutate()
                : Alert.alert('بيانات ناقصة', 'أدخل اسم الهدف والمبلغ')
            }
          />
          {editing && (
            <Pressable
              onPress={() => {
                setEditing(null);
                setName('');
                setAmount('');
                setCurrentAmount('0');
              }}
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>إلغاء</Text>
            </Pressable>
          )}
        </View>
      </View>
      {query.data?.map(item => {
        const displayedCurrentAmount = derivedCurrentAmount;
        const progress = item.targetAmount
          ? Math.min(
              100,
              Math.round((displayedCurrentAmount / item.targetAmount) * 100),
            )
          : 0;
        return (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemTop}>
              <View style={styles.iconActions}>
                <Pressable
                  onPress={() => {
                    setEditing(item);
                    setName(item.name);
                    setAmount(String(item.targetAmount));
                    setCurrentAmount(String(item.currentAmount));
                  }}
                  accessibilityLabel="تعديل الهدف"
                >
                  <Pencil color={colors.emeraldDark} size={18} />
                </Pressable>
                <Pressable
                  onPress={() => setPending(item)}
                  accessibilityLabel="حذف الهدف"
                >
                  <Trash2 color={colors.danger} size={18} />
                </Pressable>
              </View>
              <Text style={styles.itemTitle}>{item.name}</Text>
            </View>
            <Text style={styles.itemValue}>
              {displayedCurrentAmount.toLocaleString('en-US')} /{' '}
              {item.targetAmount.toLocaleString('en-US')} د.ع
            </Text>
            <View style={styles.track}>
              <View style={[styles.progress, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.note}>{progress}% مكتمل</Text>
          </View>
        );
      })}
      <ConfirmDialog
        visible={Boolean(pending)}
        title="حذف الهدف"
        message="هل تريد حذف هدف الادخار؟"
        confirmLabel="حذف"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending.id)}
      />
    </>
  );
}

function Recurring() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] =
    useState<RecurringTransaction['frequency']>('monthly');
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [pending, setPending] = useState<RecurringTransaction | null>(null);
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
      return editing
        ? api.updateRecurringTransaction(token, editing.id, {
            amount: Number(amount),
            description: description.trim(),
            frequency,
          })
        : api.createRecurringTransaction(token, {
            amount: Number(amount),
            description: description.trim(),
            type: 'expense',
            frequency,
            nextRunAt: new Date().toISOString(),
          });
    },
    onSuccess: () => {
      setAmount('');
      setDescription('');
      setEditing(null);
      void client.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
    onError: e =>
      Alert.alert(
        'تعذر حفظ العملية المتكررة',
        e instanceof Error ? e.message : 'حاول مرة أخرى',
      ),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.deleteRecurringTransaction(token, id);
    },
    onSuccess: () => {
      setPending(null);
      void client.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
    onError: e =>
      Alert.alert(
        'تعذر حذف العملية المتكررة',
        e instanceof Error ? e.message : 'حاول مرة أخرى',
      ),
  });
  const labels = {
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    yearly: 'سنوي',
  };
  return (
    <>
      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editing ? 'تعديل العملية المتكررة' : 'عملية متكررة جديدة'}
        </Text>
        <Field
          label="الوصف"
          placeholder="مثلاً: إيجار"
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
        <View style={styles.frequency}>
          {(Object.keys(labels) as RecurringTransaction['frequency'][]).map(
            value => (
              <Pressable
                key={value}
                onPress={() => setFrequency(value)}
                style={[
                  styles.freq,
                  frequency === value && styles.activeSwitch,
                ]}
              >
                <Text
                  style={[
                    styles.switchText,
                    frequency === value && styles.activeText,
                  ]}
                >
                  {labels[value]}
                </Text>
              </Pressable>
            ),
          )}
        </View>
        <View style={styles.formActions}>
          <PrimaryButton
            title={editing ? 'حفظ التعديل' : 'إضافة العملية'}
            loading={mutation.isPending}
            onPress={() =>
              description.trim() && Number(amount) > 0
                ? mutation.mutate()
                : Alert.alert('بيانات ناقصة', 'أدخل الوصف والمبلغ')
            }
          />
          {editing && (
            <Pressable
              onPress={() => {
                setEditing(null);
                setDescription('');
                setAmount('');
              }}
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>إلغاء</Text>
            </Pressable>
          )}
        </View>
      </View>
      {query.data?.map(item => (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemTop}>
            <View style={styles.iconActions}>
              <Pressable
                onPress={() => {
                  setEditing(item);
                  setDescription(item.description);
                  setAmount(String(item.amount));
                  setFrequency(item.frequency);
                }}
                accessibilityLabel="تعديل العملية المتكررة"
              >
                <Pencil color={colors.emeraldDark} size={18} />
              </Pressable>
              <Pressable
                onPress={() => setPending(item)}
                accessibilityLabel="حذف العملية المتكررة"
              >
                <Trash2 color={colors.danger} size={18} />
              </Pressable>
            </View>
            <Text style={styles.itemTitle}>{item.description}</Text>
          </View>
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
      <ConfirmDialog
        visible={Boolean(pending)}
        title="حذف العملية المتكررة"
        message="هل تريد حذف هذه العملية؟"
        confirmLabel="حذف"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending.id)}
      />
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
  activeText: { color: colors.primaryText },
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
  formActions: { gap: spacing.sm },
  cancel: {
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
  },
  cancelText: { ...typography.label, color: colors.inkMuted },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  iconActions: { flexDirection: 'row-reverse', gap: spacing.md },
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
  frequency: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  freq: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
});
