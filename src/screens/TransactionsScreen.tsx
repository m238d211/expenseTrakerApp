import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { readToken } from '../auth/storage';
import { colors, radius, spacing, typography } from '../design/tokens';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function TransactionsScreen({ navigation }: { navigation: any }) {
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState<'all' | 'expense' | 'income'>('all');
  const [categoryId, setCategoryId] = React.useState('');
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ['categories'], queryFn: async () => { const token = await readToken(); if (!token) throw new Error('Session expired'); return api.categories(token); } });
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (type !== 'all') params.set('type', type);
  if (categoryId) params.set('categoryId', categoryId);
  const query = useQuery({ queryKey: ['transactions', search, type, categoryId], queryFn: async () => { const token = await readToken(); if (!token) throw new Error('Session expired'); return api.transactionsFiltered(token, params.toString()); } });
  const remove = useMutation({
    mutationFn: async (id: string) => { const token = await readToken(); if (!token) throw new Error('Session expired'); return api.deleteTransaction(token, id); },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['transactions'] }); await queryClient.invalidateQueries({ queryKey: ['monthly'] }); },
    onError: error => Alert.alert('Delete failed', error instanceof Error ? error.message : 'Try again'),
  });
  return <ScrollView contentContainerStyle={styles.screen}>
    <Text style={styles.title}>العمليات</Text>
    <Text style={styles.subtitle}>ابحث وفلتر عملياتك بسهولة.</Text>
    <Pressable style={styles.add} onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}><Text style={styles.addText}>+ إضافة مصروف</Text></Pressable>
    <TextInput value={search} onChangeText={setSearch} placeholder="بحث بالوصف" placeholderTextColor={colors.inkMuted} style={styles.search} />
    <View style={styles.filters}>{(['all', 'expense', 'income'] as const).map(value => <Pressable key={value} onPress={() => setType(value)} style={[styles.filter, type === value && styles.filterActive]}><Text style={type === value ? styles.filterActiveText : styles.filterText}>{value === 'all' ? 'الكل' : value === 'expense' ? 'مصروف' : 'دخل'}</Text></Pressable>)}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilters}><Pressable onPress={() => setCategoryId('')} style={[styles.categoryChip, !categoryId && styles.categoryChipActive]}><Text style={!categoryId ? styles.filterActiveText : styles.filterText}>كل التصنيفات</Text></Pressable>{categories.data?.map(category => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.categoryChip, categoryId === category.id && styles.categoryChipActive]}><Text style={categoryId === category.id ? styles.filterActiveText : styles.filterText}>{category.name}</Text></Pressable>)}</ScrollView>
    {query.data?.data.map(item => <View key={item.id} style={styles.row}><View style={styles.details}><Text style={styles.description}>{item.description}</Text><Text style={[styles.category, item.category?.color ? { color: item.category.color } : null]}>{item.category?.name ?? 'بدون تصنيف'}</Text><Text style={styles.date}>{new Date(item.transactionDate).toLocaleDateString('ar-IQ')}</Text></View><View style={styles.side}><Text style={[styles.amount, item.type === 'income' && styles.income]}>{item.type === 'income' ? '+' : '−'}{item.amount.toLocaleString('en-US')} د.ع</Text><Pressable onPress={() => navigation.navigate('EditTransaction', { id: item.id })}><Text style={styles.edit}>تعديل</Text></Pressable><Pressable onPress={() => setPendingDelete(item.id)}><Text style={styles.delete}>حذف</Text></Pressable></View></View>)}
    {!query.data?.data.length && <Text style={styles.empty}>لا توجد عمليات مطابقة.</Text>}
    <ConfirmDialog visible={Boolean(pendingDelete)} title="حذف العملية" message="هل تريد حذف هذه العملية؟" confirmLabel="حذف" destructive onCancel={() => setPendingDelete(null)} onConfirm={() => { if (pendingDelete) remove.mutate(pendingDelete); setPendingDelete(null); }} />
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.xl, paddingBottom: spacing.xxl }, title: { ...typography.title, color: colors.ink, textAlign: 'right', marginTop: spacing.lg }, subtitle: { ...typography.body, color: colors.inkMuted, textAlign: 'right', marginTop: spacing.sm, marginBottom: spacing.lg }, add: { backgroundColor: colors.emerald, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md }, addText: { ...typography.body, color: colors.white, fontWeight: '700' }, search: { backgroundColor: colors.surface, color: colors.ink, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlign: 'right' }, filters: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }, filter: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, filterActive: { backgroundColor: colors.ink, borderColor: colors.ink }, filterText: { ...typography.label, color: colors.inkMuted }, filterActiveText: { ...typography.label, color: colors.white }, categoryFilters: { gap: spacing.sm, paddingVertical: spacing.sm }, categoryChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, categoryChipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald }, row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border }, details: { flex: 1 }, description: { ...typography.body, color: colors.ink, textAlign: 'right', fontWeight: '700' }, category: { ...typography.label, color: colors.emeraldDark, textAlign: 'right', marginTop: 3 }, date: { ...typography.label, color: colors.inkMuted, textAlign: 'right', marginTop: 3 }, side: { alignItems: 'flex-start', marginRight: spacing.md }, amount: { ...typography.label, color: colors.danger, fontWeight: '800' }, income: { color: colors.emeraldDark }, edit: { ...typography.label, color: colors.emeraldDark, marginTop: spacing.sm }, delete: { ...typography.label, color: colors.danger, marginTop: spacing.sm }, empty: { ...typography.body, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.xxl },
});
