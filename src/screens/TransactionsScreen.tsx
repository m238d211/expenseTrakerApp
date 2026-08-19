import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
} from 'lucide-react-native';
import { api, Category, Income } from '../api/client';
import { readToken } from '../auth/storage';
import { colors, radius, spacing, typography } from '../design/tokens';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Field } from '../components/Field';

export function TransactionsScreen({ navigation }: { navigation: any }) {
  const [pendingDelete, setPendingDelete] = React.useState<{
    type: 'transaction' | 'category';
    id: string;
    label: string;
  } | null>(null);
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState<'all' | 'expense' | 'income'>('all');
  const [categoryId, setCategoryId] = React.useState('');
  const [showCategories, setShowCategories] = React.useState(false);
  const [categoryName, setCategoryName] = React.useState('');
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null,
  );
  const [selectedIncome, setSelectedIncome] = React.useState<Income | null>(
    null,
  );
  const client = useQueryClient();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.categories(token);
    },
  });
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (type !== 'all') params.set('type', type);
  if (categoryId) params.set('categoryId', categoryId);
  const query = useQuery({
    queryKey: ['transactions', search, type, categoryId],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.transactionsFiltered(token, params.toString());
    },
  });
  const incomes = useQuery({
    queryKey: ['incomes'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.incomes(token);
    },
  });
  const removeTransaction = useMutation({
    mutationFn: async (id: string) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.deleteTransaction(token, id);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['transactions'] });
      void client.invalidateQueries({ queryKey: ['monthly'] });
    },
    onError: error =>
      Alert.alert(
        'تعذر حذف العملية',
        error instanceof Error ? error.message : 'حاول مرة أخرى',
      ),
  });
  const saveCategory = useMutation({
    mutationFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return editingCategory
        ? api.updateCategory(token, editingCategory.id, {
            name: categoryName.trim(),
          })
        : api.createCategory(token, { name: categoryName.trim() });
    },
    onSuccess: () => {
      setCategoryName('');
      setEditingCategory(null);
      void client.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: error =>
      Alert.alert(
        'تعذر حفظ التصنيف',
        error instanceof Error ? error.message : 'حاول مرة أخرى',
      ),
  });
  const removeCategory = useMutation({
    mutationFn: async (id: string) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.deleteCategory(token, id);
    },
    onSuccess: () => {
      setPendingDelete(null);
      void client.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: error =>
      Alert.alert(
        'تعذر حذف التصنيف',
        error instanceof Error ? error.message : 'حاول مرة أخرى',
      ),
  });
  const items = query.data?.data ?? [];
  const visibleIncomes = (incomes.data ?? []).filter(item => {
    if (type === 'expense') return false;
    return !search.trim() || item.type.includes(search.trim());
  });
  const expenseTotal = items
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const incomeTotal = items
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const registeredIncomeTotal = visibleIncomes.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const customCategories = (categories.data ?? []).filter(
    category => !category.isSystem,
  );

  function startCategoryEdit(category: Category) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowCategories(true);
  }
  function resetCategoryEditor() {
    setEditingCategory(null);
    setCategoryName('');
  }
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>سجلّك المالي</Text>
          <Text style={styles.title}>العمليات</Text>
          <Text style={styles.subtitle}>راجع مصروفاتك ودخلك بسرعة ووضوح.</Text>
        </View>
        <View style={styles.headerIcon}>
          <SlidersHorizontal color={colors.emeraldDark} size={23} />
        </View>
      </View>
      <Pressable
        style={styles.add}
        onPress={() =>
          navigation.navigate('AddTransaction', { type: 'expense' })
        }
      >
        <Plus color={colors.primaryText} size={21} />
        <Text style={styles.addText}>إضافة عملية</Text>
      </Pressable>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <ArrowDownLeft color={colors.danger} size={19} />
          <Text style={styles.summaryLabel}>المصروفات</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>
            {expenseTotal.toLocaleString('en-US')} د.ع
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ArrowUpRight color={colors.emeraldDark} size={19} />
          <Text style={styles.summaryLabel}>الدخل</Text>
          <Text style={[styles.summaryValue, { color: colors.emeraldDark }]}>
            {(incomeTotal + registeredIncomeTotal).toLocaleString('en-US')} د.ع
          </Text>
        </View>
      </View>
      <View style={styles.searchWrap}>
        <Search color={colors.inkMuted} size={19} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث في وصف العملية"
          placeholderTextColor={colors.inkMuted}
          style={styles.search}
        />
      </View>
      <View style={styles.filters}>
        {(['all', 'expense', 'income'] as const).map(value => (
          <Pressable
            key={value}
            onPress={() => setType(value)}
            style={[styles.filter, type === value && styles.filterActive]}
          >
            <Text
              style={
                type === value ? styles.filterActiveText : styles.filterText
              }
            >
              {value === 'all'
                ? 'الكل'
                : value === 'expense'
                ? 'مصروفات'
                : 'دخل'}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>التصنيفات</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="إدارة التصنيفات"
          onPress={() => setShowCategories(value => !value)}
          style={styles.manageButton}
        >
          {showCategories ? (
            <X color={colors.emeraldDark} size={17} />
          ) : (
            <Tag color={colors.emeraldDark} size={17} />
          )}
          <Text style={styles.manageText}>
            {showCategories ? 'إغلاق' : 'إدارة'}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilters}
      >
        <Pressable
          onPress={() => setCategoryId('')}
          style={[
            styles.categoryChip,
            !categoryId && styles.categoryChipActive,
          ]}
        >
          <Text
            style={!categoryId ? styles.filterActiveText : styles.filterText}
          >
            كل التصنيفات
          </Text>
        </Pressable>
        {categories.data?.map(category => (
          <Pressable
            key={category.id}
            onPress={() => setCategoryId(category.id)}
            style={[
              styles.categoryChip,
              categoryId === category.id && styles.categoryChipActive,
            ]}
          >
            <Text
              style={
                categoryId === category.id
                  ? styles.filterActiveText
                  : styles.filterText
              }
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {showCategories && (
        <View style={styles.categoryPanel}>
          <Text style={styles.panelTitle}>
            {editingCategory ? 'تعديل التصنيف' : 'تصنيف جديد'}
          </Text>
          <Field
            label="اسم التصنيف"
            placeholder="مثلاً: المنزل"
            value={categoryName}
            onChangeText={setCategoryName}
          />
          <View style={styles.panelActions}>
            <Pressable
              onPress={() => {
                if (categoryName.trim()) saveCategory.mutate();
                else Alert.alert('بيانات ناقصة', 'أدخل اسم التصنيف');
              }}
              style={styles.saveCategory}
              disabled={saveCategory.isPending}
            >
              <Text style={styles.saveCategoryText}>
                {editingCategory ? 'حفظ التعديل' : 'إضافة التصنيف'}
              </Text>
            </Pressable>
            {editingCategory && (
              <Pressable
                onPress={resetCategoryEditor}
                style={styles.cancelCategory}
              >
                <Text style={styles.cancelCategoryText}>إلغاء</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.customList}>
            {customCategories.map(category => (
              <View key={category.id} style={styles.customRow}>
                <Text style={styles.customName}>{category.name}</Text>
                <View style={styles.iconActions}>
                  <Pressable
                    onPress={() => startCategoryEdit(category)}
                    accessibilityLabel={`تعديل ${category.name}`}
                  >
                    <Pencil color={colors.emeraldDark} size={18} />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setPendingDelete({
                        type: 'category',
                        id: category.id,
                        label: category.name,
                      })
                    }
                    accessibilityLabel={`حذف ${category.name}`}
                  >
                    <Trash2 color={colors.danger} size={18} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>آخر العمليات</Text>
        <Text style={styles.count}>
          {items.length + visibleIncomes.length} عملية
        </Text>
      </View>
      {visibleIncomes.map(item => (
        <Pressable
          key={`income-${item.id}`}
          style={styles.row}
          onPress={() => setSelectedIncome(item)}
          accessibilityRole="button"
          accessibilityLabel={`تفاصيل دخل ${item.type}`}
        >
          <View style={[styles.typeIcon, styles.incomeIcon]}>
            <ArrowUpRight color={colors.emeraldDark} size={20} />
          </View>
          <View style={styles.details}>
            <Text style={styles.description}>{item.type}</Text>
            <Text style={styles.category}>دخل مسجل</Text>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString('ar-IQ')}
            </Text>
          </View>
          <View style={styles.side}>
            <Text style={[styles.amount, styles.income]}>
              +{item.amount.toLocaleString('en-US')} د.ع
            </Text>
            <Text style={styles.incomeHint}>اضغط للتفاصيل</Text>
          </View>
        </Pressable>
      ))}
      {items.map(item => (
        <View key={item.id} style={styles.row}>
          <View
            style={[
              styles.typeIcon,
              item.type === 'income' ? styles.incomeIcon : styles.expenseIcon,
            ]}
          >
            {item.type === 'income' ? (
              <ArrowUpRight color={colors.emeraldDark} size={20} />
            ) : (
              <ArrowDownLeft color={colors.danger} size={20} />
            )}
          </View>
          <View style={styles.details}>
            <Text style={styles.description}>{item.description}</Text>
            <Text
              style={[
                styles.category,
                item.category?.color ? { color: item.category.color } : null,
              ]}
            >
              {item.category?.name ?? 'بدون تصنيف'}
            </Text>
            <Text style={styles.date}>
              {new Date(item.transactionDate).toLocaleDateString('ar-IQ')}
            </Text>
          </View>
          <View style={styles.side}>
            <Text
              style={[styles.amount, item.type === 'income' && styles.income]}
            >
              {item.type === 'income' ? '+' : '−'}
              {item.amount.toLocaleString('en-US')} د.ع
            </Text>
            <View style={styles.rowActions}>
              <Pressable
                onPress={() =>
                  navigation.navigate('EditTransaction', { id: item.id })
                }
                accessibilityLabel="تعديل العملية"
                style={styles.rowAction}
              >
                <Pencil color={colors.emeraldDark} size={17} />
              </Pressable>
              <Pressable
                onPress={() =>
                  setPendingDelete({
                    type: 'transaction',
                    id: item.id,
                    label: item.description,
                  })
                }
                accessibilityLabel="حذف العملية"
                style={styles.rowAction}
              >
                <Trash2 color={colors.danger} size={17} />
              </Pressable>
            </View>
          </View>
        </View>
      ))}
      {!items.length && !visibleIncomes.length && (
        <View style={styles.empty}>
          <Tag color={colors.gold} size={38} />
          <Text style={styles.emptyTitle}>لا توجد عمليات مطابقة</Text>
          <Text style={styles.emptyText}>
            أضف عملية جديدة أو غيّر الفلاتر لتظهر النتائج هنا.
          </Text>
        </View>
      )}
      <Modal
        visible={Boolean(selectedIncome)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIncome(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تفاصيل الدخل</Text>
              <Pressable
                onPress={() => setSelectedIncome(null)}
                accessibilityLabel="إغلاق تفاصيل الدخل"
              >
                <X color={colors.inkMuted} size={22} />
              </Pressable>
            </View>
            {selectedIncome && (
              <View style={styles.modalDetails}>
                <Text style={styles.modalAmount}>
                  {selectedIncome.amount.toLocaleString('en-US')} د.ع
                </Text>
                <Text style={styles.modalLine}>
                  المصدر: {selectedIncome.type}
                </Text>
                <Text style={styles.modalLine}>
                  تاريخ الاستلام: {new Date(selectedIncome.createdAt).toLocaleDateString('ar-IQ')}
                </Text>
                <Text style={styles.modalLine}>
                  يوم الاستلام الشهري: {selectedIncome.payDay}
                </Text>
                <Text style={styles.modalLine}>
                  الحالة: {selectedIncome.recurring ? 'متكرر شهريًا' : 'غير متكرر'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title={
          pendingDelete?.type === 'category' ? 'حذف التصنيف' : 'حذف العملية'
        }
        message={pendingDelete ? `هل تريد حذف «${pendingDelete.label}»؟` : ''}
        confirmLabel="حذف"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.type === 'category')
            removeCategory.mutate(pendingDelete.id);
          else {
            removeTransaction.mutate(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
  },
  headerCopy: { flex: 1 },
  kicker: { ...typography.label, color: colors.emerald },
  title: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    backgroundColor: colors.emerald,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  addText: { ...typography.body, color: colors.primaryText, fontWeight: '800' },
  summary: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'flex-end', gap: 3 },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  summaryLabel: { ...typography.label, color: colors.inkMuted },
  summaryValue: { ...typography.label, fontWeight: '800' },
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  search: {
    flex: 1,
    height: 52,
    color: colors.ink,
    textAlign: 'right',
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  filter: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { ...typography.label, color: colors.inkMuted },
  filterActiveText: { ...typography.label, color: colors.primaryText },
  sectionHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.ink,
    textAlign: 'right',
  },
  manageButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    padding: spacing.sm,
  },
  manageText: {
    ...typography.label,
    color: colors.emeraldDark,
    fontWeight: '800',
  },
  categoryFilters: { gap: spacing.sm, paddingVertical: spacing.sm },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  categoryPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  panelTitle: { ...typography.heading, color: colors.ink, textAlign: 'right' },
  panelActions: { flexDirection: 'row-reverse', gap: spacing.sm },
  saveCategory: {
    flex: 1,
    backgroundColor: colors.emerald,
    borderRadius: radius.sm,
    alignItems: 'center',
    padding: spacing.sm,
  },
  saveCategoryText: {
    ...typography.label,
    color: colors.primaryText,
    fontWeight: '800',
  },
  cancelCategory: {
    padding: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
  },
  cancelCategoryText: { ...typography.label, color: colors.inkMuted },
  customList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  customRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  customName: { ...typography.body, color: colors.ink, fontWeight: '700' },
  iconActions: { flexDirection: 'row-reverse', gap: spacing.md },
  listHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  count: { ...typography.label, color: colors.inkMuted },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIcon: { backgroundColor: colors.expenseSoft },
  incomeIcon: { backgroundColor: colors.incomeSoft },
  details: { flex: 1, marginHorizontal: spacing.sm },
  description: {
    ...typography.body,
    color: colors.ink,
    textAlign: 'right',
    fontWeight: '700',
  },
  category: {
    ...typography.label,
    color: colors.emeraldDark,
    textAlign: 'right',
    marginTop: 3,
  },
  date: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: 3,
  },
  side: { alignItems: 'flex-end' },
  amount: { ...typography.label, color: colors.danger, fontWeight: '800' },
  income: { color: colors.emeraldDark },
  incomeHint: { ...typography.label, color: colors.inkMuted, textAlign: 'right' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { ...typography.heading, color: colors.ink, textAlign: 'right' },
  modalDetails: { gap: spacing.sm, marginTop: spacing.lg },
  modalAmount: {
    ...typography.title,
    color: colors.emeraldDark,
    textAlign: 'right',
  },
  modalLine: { ...typography.body, color: colors.ink, textAlign: 'right' },
  rowActions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rowAction: { padding: 4 },
  empty: { alignItems: 'center', padding: spacing.xxl },
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
  },
});
