import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { readToken } from '../auth/storage';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { DataLoading } from '../components/DataLoading';
import { showError } from '../ui/toast';
import { colors, radius, spacing, typography } from '../design/tokens';

export function TransactionScreen({ route, navigation }: { route: { params: { type: 'expense' | 'income' } }; navigation: any }) {
  const type = route.params.type;
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const categories = useQuery({
    queryKey: ['categories'],
    enabled: type === 'expense',
    queryFn: async () => { const token = await readToken(); if (!token) throw new Error('انتهت الجلسة'); return api.categories(token); },
  });
  const mutation = useMutation({
    mutationFn: async () => { const token = await readToken(); if (!token) throw new Error('انتهت الجلسة'); return api.createTransaction(token, { amount: Number(amount), type, description, categoryId }); },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['transactions'] }); await queryClient.invalidateQueries({ queryKey: ['monthly'] }); navigation.goBack(); },
    onError: error => showError('تعذر الحفظ', error),
  });
  const valid = Number(amount) > 0 && description.trim() && (type === 'income' || categoryId);
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>→ رجوع</Text></Pressable>
      <Text style={styles.title}>{type === 'expense' ? 'إضافة مصروف' : 'إضافة دخل'}</Text>
      <Text style={styles.subtitle}>سجّل العملية حتى يبقى التحليل المالي دقيقاً.</Text>
      <Field label="المبلغ بالدينار" placeholder="0" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
      <Field label="الوصف" placeholder="مثلاً: مشتريات البيت" value={description} onChangeText={setDescription} />
      {type === 'expense' && <View style={styles.categoryGroup}>
        <Text style={styles.label}>التصنيف *</Text>
        {categories.isLoading ? <DataLoading label="جارٍ تحميل التصنيفات..." /> : <View style={styles.categories}>{categories.data?.map(category => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.category, categoryId === category.id && styles.selectedCategory]}><Text style={[styles.categoryText, categoryId === category.id && styles.selectedCategoryText]}>{category.name}</Text></Pressable>)}</View>}
        {!categoryId && <Text style={styles.hint}>اختار تصنيف حتى يظهر المصروف بالتحليل المالي.</Text>}
      </View>}
      <PrimaryButton title="حفظ العملية" loading={mutation.isPending} onPress={() => valid ? mutation.mutate() : showError('بيانات ناقصة', type === 'expense' ? 'أدخل المبلغ والوصف واختار التصنيف' : 'أدخل المبلغ والوصف')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.xl, gap: spacing.md },
  back: { ...typography.body, color: colors.emeraldDark, fontWeight: '700', textAlign: 'right' },
  title: { ...typography.title, color: colors.ink, textAlign: 'right', marginTop: spacing.lg },
  subtitle: { ...typography.body, color: colors.inkMuted, textAlign: 'right', marginBottom: spacing.lg },
  categoryGroup: { gap: spacing.xs },
  label: { ...typography.label, color: colors.ink, textAlign: 'right' },
  categories: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  category: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  selectedCategory: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  categoryText: { ...typography.label, color: colors.ink },
  selectedCategoryText: { color: colors.white },
  hint: { ...typography.label, color: colors.inkMuted, textAlign: 'right' },
});
