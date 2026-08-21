import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../design/tokens';

export function DataError({
  onRetry,
  message = 'تعذر تحميل البيانات',
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      <Text style={styles.hint}>تحقق من الاتصال ثم حاول مرة أخرى.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="إعادة تحميل البيانات"
        onPress={onRetry}
        style={styles.button}
      >
        <RefreshCw color={colors.primaryText} size={17} />
        <Text style={styles.buttonText}>إعادة المحاولة</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  title: { ...typography.body, color: colors.ink, fontWeight: '700' },
  hint: { ...typography.label, color: colors.inkMuted, marginTop: spacing.xs },
  button: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    marginTop: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  buttonText: { ...typography.label, color: colors.primaryText, fontWeight: '700' },
});
