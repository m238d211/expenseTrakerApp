import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { colors, radius, spacing, typography } from '../design/tokens';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { saveToken } from '../auth/storage';

export function AuthScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [registering, setRegistering] = useState(false),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const [error, setError] = useState(''),
    [loading, setLoading] = useState(false);
  async function submit() {
    if (
      !email.trim() ||
      password.length < 10 ||
      (registering && !name.trim())
    ) {
      setError(
        'تأكد من إدخال البيانات المطلوبة وكلمة مرور من 10 أحرف على الأقل',
      );
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = registering
        ? await api.register(email.trim(), password, name.trim())
        : await api.login(email.trim(), password);
      await saveToken(result.accessToken);
      onSignedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandMark}>
        <Text style={styles.markText}>↗</Text>
      </View>
      <Text style={styles.kicker}>مصروفاتي</Text>
      <Text style={styles.title}>
        {registering ? 'أنشئ حسابك' : 'أهلاً بعودتك'}
      </Text>
      <Text style={styles.subtitle}>
        إدارة أوضح لأموالك، وقرارات أهدأ كل يوم.
      </Text>
      <View style={styles.form}>
        {registering && (
          <Field
            label="الاسم"
            placeholder="اسمك"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}
        <Field
          label="البريد الإلكتروني"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="كلمة المرور"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <PrimaryButton
          title={registering ? 'إنشاء الحساب' : 'تسجيل الدخول'}
          loading={loading}
          onPress={submit}
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => {
          setRegistering(value => !value);
          setError('');
        }}
      >
        <Text style={styles.switch}>
          {registering ? 'لديك حساب؟ تسجيل الدخول' : 'مستخدم جديد؟ أنشئ حساباً'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.canvas,
  },
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  markText: { color: colors.mint, fontSize: 30, fontWeight: '800' },
  kicker: {
    ...typography.label,
    color: colors.emerald,
    marginBottom: spacing.xs,
  },
  title: { ...typography.title, color: colors.ink },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  form: { gap: spacing.md },
  error: {
    ...typography.label,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
    textAlign: 'right',
  },
  switch: {
    ...typography.body,
    color: colors.emeraldDark,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: spacing.xl,
  },
});
