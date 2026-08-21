import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Income } from '../api/client';
import { readToken } from '../auth/storage';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormSheet } from '../components/FormSheet';
import { FormTrigger } from '../components/FormTrigger';
import { DataLoading } from '../components/DataLoading';
import { DataError } from '../components/DataError';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { showError } from '../ui/toast';
import { colors, radius, spacing, typography } from '../design/tokens';

export function IncomeScreen({ navigation }: { navigation: any }) {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [payDay, setPayDay] = useState('1');
  const [recurring, setRecurring] = useState(true);
  const [editing, setEditing] = useState<Income | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [pending, setPending] = useState<Income | null>(null);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['incomes'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.incomes(token);
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      const data = {
        amount: Number(amount),
        type: source.trim(),
        payDay: Number(payDay),
        recurring,
      };
      return editing
        ? api.updateIncome(token, editing.id, data)
        : api.createIncome(token, data);
    },
    onSuccess: () => {
      reset();
      void client.invalidateQueries();
      if (editing) navigation.goBack();
    },
    onError: error => showError('تعذر حفظ الدخل', error),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.deleteIncome(token, id);
    },
    onSuccess: () => {
      setPending(null);
      void client.invalidateQueries();
    },
    onError: error => showError('تعذر حذف الدخل', error),
  });
  function reset() {
    setAmount('');
    setSource('');
    setPayDay('1');
    setRecurring(true);
    setEditing(null);
    setFormVisible(false);
  }
  function beginEdit(item: Income) {
    setEditing(item);
    setAmount(String(item.amount));
    setSource(item.type);
    setPayDay(String(item.payDay));
    setRecurring(item.recurring);
    setFormVisible(true);
  }
  return (
    <RefreshableScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>→ رجوع</Text>
      </Pressable>
      <Text style={styles.title}>
        الدخل الثابت
      </Text>
      <Text style={styles.subtitle}>
        سجّل راتبك أو أي دخل متكرر، ويمكنك تعديله أو حذفه لاحقًا.
      </Text>
      <FormTrigger title="إضافة دخل ثابت" onPress={() => setFormVisible(true)} />
      <FormSheet
        visible={formVisible}
        title={editing ? 'تعديل الدخل الثابت' : 'إضافة دخل ثابت'}
        onClose={reset}
      >
        <Field
          label="المبلغ بالدينار"
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
        />
        <Field
          label="مصدر الدخل"
          placeholder="مثلاً: الراتب أو عمل إضافي"
          value={source}
          onChangeText={setSource}
        />
        <Field
          label="يوم الاستلام"
          placeholder="1 - 31"
          value={payDay}
          onChangeText={setPayDay}
          keyboardType="number-pad"
        />
        <View style={styles.switchLabel}>
          <Text style={styles.switchText}>دخل متكرر شهريًا</Text>
          <Switch
            value={recurring}
            onValueChange={setRecurring}
            trackColor={{ true: colors.emerald }}
          />
        </View>
        <View style={styles.formActions}>
          <PrimaryButton
            title={editing ? 'حفظ التعديل' : 'حفظ الدخل'}
            loading={mutation.isPending}
            onPress={() =>
              Number(amount) > 0 &&
              source.trim().length > 0 &&
              Number(payDay) >= 1 &&
              Number(payDay) <= 31
                ? mutation.mutate()
                : showError(
                    'بيانات غير صحيحة',
                    'تحقق من المبلغ ومصدر الدخل ويوم الاستلام',
                  )
            }
          />
          {editing && (
            <Pressable onPress={reset} style={styles.cancel}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </Pressable>
          )}
        </View>
      </FormSheet>
      <Text style={styles.sectionTitle}>الدخول المسجلة</Text>
      {query.isError ? <DataError onRetry={() => void query.refetch()} /> : query.isLoading ? <DataLoading /> : query.data?.map(item => (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemTop}>
            <View style={styles.actions}>
              <Pressable
                onPress={() => beginEdit(item)}
                accessibilityLabel="تعديل الدخل"
              >
                <Pencil color={colors.emeraldDark} size={18} />
              </Pressable>
              <Pressable
                onPress={() => setPending(item)}
                accessibilityLabel="حذف الدخل"
              >
                <Trash2 color={colors.danger} size={18} />
              </Pressable>
            </View>
            <Text style={styles.itemTitle}>
              {item.amount.toLocaleString('en-US')} د.ع
            </Text>
          </View>
          <Text style={styles.note}>
            المصدر: {item.type} • يوم الاستلام: {item.payDay} •{' '}
            {item.recurring ? 'متكرر شهريًا' : 'غير متكرر'}
          </Text>
          <Text style={styles.note}>
            تاريخ الإضافة: {new Date(item.createdAt).toLocaleDateString('ar-IQ')}
          </Text>
        </View>
      ))}
      {!query.isLoading && !query.isError && !query.data?.length && (
        <Text style={styles.empty}>لا توجد دخول مسجلة بعد.</Text>
      )}
      <ConfirmDialog
        visible={Boolean(pending)}
        title="حذف الدخل"
        message="هل تريد حذف هذا الدخل؟"
        confirmLabel="حذف"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending.id)}
      />
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.xl,
    gap: spacing.md,
  },
  back: {
    ...typography.body,
    color: colors.emeraldDark,
    fontWeight: '700',
    textAlign: 'right',
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
    marginBottom: spacing.lg,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  switchText: { ...typography.body, color: colors.ink, textAlign: 'right' },
  formActions: { gap: spacing.sm },
  cancel: {
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
  },
  cancelText: { ...typography.label, color: colors.inkMuted },
  sectionTitle: {
    ...typography.heading,
    color: colors.ink,
    textAlign: 'right',
    marginTop: spacing.lg,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: { ...typography.heading, color: colors.ink, textAlign: 'right' },
  actions: { flexDirection: 'row-reverse', gap: spacing.md },
  note: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  empty: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
