import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Circle, ListChecks, Pencil, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Task } from '../api/client';
import { readToken } from '../auth/storage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { FormSheet } from '../components/FormSheet';
import { FormTrigger } from '../components/FormTrigger';
import { DataLoading } from '../components/DataLoading';
import { DataError } from '../components/DataError';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import { showError } from '../ui/toast';
import { colors, radius, spacing, typography } from '../design/tokens';
import { formatLocalDate, localDateEndOfDay } from '../utils/dates';

type Filter = 'all' | 'open' | 'done' | 'overdue';
function isOverdue(task: Task) {
  return Boolean(task.deadline && !task.completed && new Date(task.deadline) < new Date());
}
const currentDate = formatLocalDate();
export function TasksScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(currentDate);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [editing, setEditing] = useState<Task | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [pending, setPending] = useState<Task | null>(null);
  const [filter, setFilter] = useState<Filter>('open');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.tasks(token);
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline.trim()
          ? localDateEndOfDay(deadline.trim())
          : undefined,
        category: category.trim() || undefined,
        priority,
      };
      return editing
        ? api.updateTask(token, editing.id, data)
        : api.createTask(token, data);
    },
    onSuccess: () => {
      reset();
      void client.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: error => showError('تعذر حفظ المهمة', error, 'تحقق من البيانات'),
  });
  const toggle = useMutation({
    mutationFn: async (task: Task) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.updateTask(token, task.id, { completed: !task.completed });
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      return api.deleteTask(token, id);
    },
    onSuccess: () => {
      setPending(null);
      void client.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
  const snooze = useMutation({
    mutationFn: async (task: Task) => {
      const token = await readToken();
      if (!token) throw new Error('انتهت الجلسة');
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return api.updateTask(token, task.id, { snoozedUntil: date.toISOString() });
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['tasks'] }),
  });

  function reset() {
    setTitle('');
    setDescription('');
    setDeadline('');
    setCategory('');
    setPriority('medium');
    setEditing(null);
    setFormVisible(false);
  }
  function beginEdit(task: Task) {
    setEditing(task);
    setTitle(task.title);
    setDescription(task.description ?? '');
    setDeadline(task.deadline ? task.deadline.slice(0, 10) : '');
    setCategory(task.category ?? '');
    setPriority(task.priority);
    setFormVisible(true);
  }
  const tasks = (query.data ?? []).filter(task => {
    const snoozed = Boolean(task.snoozedUntil && new Date(task.snoozedUntil) > new Date());
    if (filter === 'open') return !task.completed && !snoozed;
    if (filter === 'done') return task.completed;
    if (filter === 'overdue') return isOverdue(task) && !snoozed;
    return true;
  });

  return (
    <RefreshableScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>أفكارك تحت السيطرة</Text>
          <Text style={styles.title}>المهام والأفكار</Text>
        </View>
        <View style={styles.headerIcon}><ListChecks color={colors.emeraldDark} size={25} /></View>
      </View>
      <FormTrigger title="إضافة مهمة أو فكرة" onPress={() => setFormVisible(true)} />
      <FormSheet
        visible={formVisible}
        title={editing ? 'تعديل المهمة' : 'فكرة أو مهمة جديدة'}
        onClose={reset}
      >
          <Field label="العنوان" placeholder="مثلاً: مراجعة الميزانية" value={title} onChangeText={setTitle} />
          <Field label="وصف اختياري" placeholder="تفاصيل تساعدك تتذكرها" value={description} onChangeText={setDescription} />
          <Field label="الموعد النهائي" placeholder="YYYY-MM-DD" value={deadline} onChangeText={setDeadline} />
          <Field label="التصنيف" placeholder="مثلاً: مالي أو شخصي" value={category} onChangeText={setCategory} />
          <Text style={styles.label}>الأولوية</Text>
          <View style={styles.choices}>
            {(['low', 'medium', 'high'] as const).map(value => (
              <Pressable key={value} onPress={() => setPriority(value)} style={[styles.choice, priority === value && styles.choiceActive]}>
                <Text style={priority === value ? styles.choiceActiveText : styles.choiceText}>
                  {value === 'low' ? 'منخفضة' : value === 'medium' ? 'متوسطة' : 'مهمة'}
                </Text>
              </Pressable>
            ))}
          </View>
          <PrimaryButton
            title={editing ? 'حفظ التعديل' : 'إضافة المهمة'}
            loading={save.isPending}
            onPress={() => title.trim() ? save.mutate() : showError('بيانات ناقصة', 'أدخل عنوان المهمة')}
          />
          {editing && <Pressable onPress={reset} style={styles.cancel}><Text style={styles.cancelText}>إلغاء</Text></Pressable>}
      </FormSheet>
      <View style={styles.filters}>
        {(['open', 'all', 'overdue', 'done'] as const).map(value => (
          <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterActive]}>
            <Text style={filter === value ? styles.filterActiveText : styles.filterText}>
              {value === 'open' ? 'غير مكتملة' : value === 'all' ? 'الكل' : value === 'overdue' ? 'متأخرة' : 'مكتملة'}
            </Text>
          </Pressable>
        ))}
      </View>
      {query.isError ? <DataError onRetry={() => void query.refetch()} /> : query.isLoading ? <DataLoading /> : tasks.map(task => (
        <View key={task.id} style={[styles.item, task.completed && styles.itemDone]}>
          <Pressable onPress={() => toggle.mutate(task)} style={styles.check}>
            {task.completed ? <Check color={colors.emeraldDark} size={23} /> : <Circle color={colors.inkMuted} size={23} />}
          </Pressable>
          <View style={styles.itemBody}>
            <Text style={[styles.itemTitle, task.completed && styles.completedText]}>{task.title}</Text>
            {!!task.description && <Text style={styles.description}>{task.description}</Text>}
            <View style={styles.meta}>
              <Text style={styles.metaText}>{task.category || 'عام'}</Text>
              <Text style={[styles.metaText, isOverdue(task) && styles.overdue]}>
                {task.deadline ? 'الموعد: ' + new Date(task.deadline).toLocaleDateString('ar-IQ') : 'بدون موعد'}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            {!task.completed && task.deadline && <Pressable onPress={() => snooze.mutate(task)} accessibilityLabel="تأجيل المهمة"><Text style={styles.snooze}>+1ي</Text></Pressable>}
            <Pressable onPress={() => beginEdit(task)} accessibilityLabel="تعديل المهمة"><Pencil color={colors.emeraldDark} size={17} /></Pressable>
            <Pressable onPress={() => setPending(task)} accessibilityLabel="حذف المهمة"><Trash2 color={colors.danger} size={17} /></Pressable>
          </View>
        </View>
      ))}
      {!query.isLoading && !query.isError && !tasks.length && <View style={styles.empty}><ListChecks color={colors.gold} size={38} /><Text style={styles.emptyTitle}>ماكو مهام بهالفلاتر</Text><Text style={styles.emptyText}>أضف فكرة أو مهمة حتى تبقى محفوظة وتوصلك تذكيراتها.</Text></View>}
      <ConfirmDialog visible={Boolean(pending)} title="حذف المهمة" message={pending ? 'هل تريد حذف «' + pending.title + '»؟' : ''} confirmLabel="حذف" destructive onCancel={() => setPending(null)} onConfirm={() => pending && remove.mutate(pending.id)} />
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.xl, gap: spacing.md },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
  kicker: { ...typography.label, color: colors.emerald, textAlign: 'right' },
  title: { ...typography.title, color: colors.ink, textAlign: 'right', marginTop: spacing.xs },
  headerIcon: { width: 50, height: 50, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  formTitle: { ...typography.heading, color: colors.ink, textAlign: 'right' },
  label: { ...typography.label, color: colors.ink, textAlign: 'right' },
  choices: { flexDirection: 'row-reverse', gap: spacing.sm },
  choice: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.canvas, alignItems: 'center' },
  choiceActive: { backgroundColor: colors.mint },
  choiceText: { ...typography.label, color: colors.inkMuted },
  choiceActiveText: { ...typography.label, color: colors.emeraldDark, fontWeight: '800' },
  cancel: { alignItems: 'center', padding: spacing.sm, backgroundColor: colors.canvas, borderRadius: radius.sm },
  cancelText: { ...typography.label, color: colors.inkMuted },
  filters: { flexDirection: 'row-reverse', gap: spacing.sm },
  filter: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { ...typography.label, color: colors.inkMuted },
  filterActiveText: { ...typography.label, color: colors.white, fontWeight: '800' },
  item: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  itemDone: { opacity: 0.65 },
  check: { padding: spacing.xs },
  itemBody: { flex: 1 },
  itemTitle: { ...typography.body, color: colors.ink, textAlign: 'right', fontWeight: '800' },
  completedText: { textDecorationLine: 'line-through' },
  description: { ...typography.label, color: colors.inkMuted, textAlign: 'right', marginTop: 2 },
  meta: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing.xs },
  metaText: { ...typography.label, color: colors.inkMuted },
  overdue: { color: colors.danger, fontWeight: '800' },
  actions: { alignItems: 'center', gap: spacing.sm },
  snooze: { ...typography.label, color: colors.gold, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyTitle: { ...typography.heading, color: colors.ink, marginTop: spacing.md },
  emptyText: { ...typography.body, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.sm },
});
