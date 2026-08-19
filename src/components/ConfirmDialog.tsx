import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../design/tokens';

export function ConfirmDialog({ visible, title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', destructive = false, onConfirm, onCancel }: { visible: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.overlay}><View style={styles.dialog}>
      <View style={[styles.accent, destructive && styles.dangerAccent]} />
      <Text style={styles.title}>{title}</Text><Text style={styles.message}>{message}</Text>
      <View style={styles.actions}><Pressable onPress={onCancel} style={styles.cancel}><Text style={styles.cancelText}>{cancelLabel}</Text></Pressable><Pressable onPress={onConfirm} style={[styles.confirm, destructive && styles.danger]}><Text style={styles.confirmText}>{confirmLabel}</Text></Pressable></View>
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: 'rgba(16,42,67,0.58)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl }, dialog: { width: '100%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden', elevation: 8 }, accent: { height: 5, backgroundColor: colors.emerald, marginHorizontal: -spacing.lg, marginTop: -spacing.lg, marginBottom: spacing.lg }, dangerAccent: { backgroundColor: colors.danger }, title: { ...typography.heading, color: colors.ink, textAlign: 'right' }, message: { ...typography.body, color: colors.inkMuted, textAlign: 'right', marginTop: spacing.sm }, actions: { flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: spacing.sm, marginTop: spacing.lg }, cancel: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.canvas }, cancelText: { ...typography.label, color: colors.inkMuted }, confirm: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.emerald }, danger: { backgroundColor: colors.danger }, confirmText: { ...typography.label, color: colors.white, fontWeight: '800' }, });
