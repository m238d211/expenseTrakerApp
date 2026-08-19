import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../design/tokens';
export function PrimaryButton({
  title,
  loading,
  onPress,
}: {
  title: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  pressed: { backgroundColor: colors.emeraldDark },
  text: { ...typography.body, fontWeight: '700', color: colors.white },
});
