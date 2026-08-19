import React, { useEffect, useState } from 'react';
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

export function EditTransactionScreen({
  route,
  navigation,
}: {
  route: { params: { id: string } };
  navigation: any;
}) {
  const id = route.params.id;
  const client = useQueryClient();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>();
  const [date, setDate] = useState('');
  const transaction = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.transaction(token, id);
    },
  });
  useEffect(() => {
    if (transaction.data) {
      setAmount(String(transaction.data.amount));
      setDescription(transaction.data.description);
      setCategoryId(transaction.data.category?.id);
      setDate(transaction.data.transactionDate.slice(0, 10));
    }
  }, [transaction.data]);
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.categories(token);
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.updateTransaction(token, id, {
        amount: Number(amount),
        description,
        categoryId,
        transactionDate: date ? new Date(date).toISOString() : undefined,
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries();
      navigation.goBack();
    },
    onError: error =>
      Alert.alert(
        'تعذر التعديل',
        error instanceof Error ? error.message : 'حاول مرة أخرى',
      ),
  });
  if (transaction.isLoading)
    return (
      <View style={styles.loading}>
        <Text style={styles.note}>جاري تحميل العملية...</Text>
      </View>
    );
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>→ رجوع</Text>
      </Pressable>
      <Text style={styles.title}>تعديل العملية</Text>
      <Field
        label="المبلغ"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
        placeholder="0"
      />
      <Field
        label="الوصف"
        value={description}
        onChangeText={setDescription}
        placeholder="الوصف"
      />
      <Field
        label="التاريخ YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        placeholder="2026-08-19"
      />
      {transaction.data?.type === 'expense' && (
        <View style={styles.categories}>
          <Text style={styles.label}>التصنيف</Text>
          <View style={styles.chips}>
            {categories.data?.map(category => (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                style={[
                  styles.chip,
                  categoryId === category.id && styles.selected,
                ]}
              >
                <Text
                  style={
                    categoryId === category.id
                      ? styles.selectedText
                      : styles.chipText
                  }
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <PrimaryButton
        title="حفظ التعديل"
        loading={mutation.isPending}
        onPress={() =>
          Number(amount) > 0 && description.trim()
            ? mutation.mutate()
            : Alert.alert('بيانات ناقصة', 'أدخل المبلغ والوصف')
        }
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.xl,
    gap: spacing.md,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  back: {
    ...typography.body,
    color: colors.emeraldDark,
    textAlign: 'right',
    fontWeight: '700',
  },
  title: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'right',
    marginTop: spacing.lg,
  },
  categories: { gap: spacing.sm },
  label: { ...typography.label, color: colors.ink, textAlign: 'right' },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { ...typography.label, color: colors.ink },
  selectedText: { ...typography.label, color: colors.white },
  note: { ...typography.body, color: colors.inkMuted },
});
