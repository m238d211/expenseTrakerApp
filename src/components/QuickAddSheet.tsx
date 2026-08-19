import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../design/tokens';

export function QuickAddSheet({
  visible,
  onClose,
  onExpense,
  onIncome,
}: {
  visible: boolean;
  onClose: () => void;
  onExpense: () => void;
  onIncome: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={event => event.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>إضافة سريعة</Text>
          <Pressable
            style={[styles.action, styles.expense]}
            onPress={onExpense}
          >
            <Text style={styles.icon}>−</Text>
            <Text style={styles.actionText}>مصروف جديد</Text>
          </Pressable>
          <Pressable style={[styles.action, styles.income]} onPress={onIncome}>
            <Text style={[styles.icon, { color: colors.emeraldDark }]}>+</Text>
            <Text style={styles.actionText}>دخل جديد</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 42,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  action: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  expense: { backgroundColor: colors.expenseSoft },
  income: { backgroundColor: colors.incomeSoft },
  icon: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.danger,
    marginLeft: spacing.md,
  },
  actionText: { ...typography.body, color: colors.ink, fontWeight: '700' },
});
