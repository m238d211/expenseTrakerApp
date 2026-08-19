import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { readToken } from '../auth/storage';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing, typography } from '../design/tokens';

export function IncomeScreen({ navigation }: { navigation: any }) {
  const [amount, setAmount] = useState('');
  const [payDay, setPayDay] = useState('1');
  const [recurring, setRecurring] = useState(true);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => { const token = await readToken(); if (!token) throw new Error('انتهت الجلسة'); return api.createIncome(token, { amount: Number(amount), type: 'salary', payDay: Number(payDay), recurring }); },
    onSuccess: async () => { await client.invalidateQueries(); navigation.goBack(); },
    onError: error => Alert.alert('تعذر الحفظ', error instanceof Error ? error.message : 'حاول مرة أخرى'),
  });
  return <ScrollView contentContainerStyle={styles.screen}>
    <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>→ رجوع</Text></Pressable>
    <Text style={styles.title}>إضافة دخل ثابت</Text><Text style={styles.subtitle}>استخدمه للراتب أو أي دخل متكرر شهرياً.</Text>
    <Field label="المبلغ بالدينار" placeholder="0" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
    <Field label="يوم الاستلام" placeholder="1 - 31" value={payDay} onChangeText={setPayDay} keyboardType="number-pad" />
    <Text style={styles.switchLabel}>دخل متكرر شهرياً <Switch value={recurring} onValueChange={setRecurring} trackColor={{ true: colors.emerald }} /></Text>
    <PrimaryButton title="حفظ الدخل" loading={mutation.isPending} onPress={() => Number(amount) > 0 && Number(payDay) >= 1 && Number(payDay) <= 31 ? mutation.mutate() : Alert.alert('بيانات غير صحيحة', 'تحقق من المبلغ ويوم الاستلام')} />
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.xl, gap: spacing.md }, back: { ...typography.body, color: colors.emeraldDark, fontWeight: '700', textAlign: 'right' }, title: { ...typography.title, color: colors.ink, textAlign: 'right', marginTop: spacing.lg }, subtitle: { ...typography.body, color: colors.inkMuted, textAlign: 'right', marginBottom: spacing.lg }, switchLabel: { ...typography.body, color: colors.ink, textAlign: 'right', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', gap: spacing.sm } });
