import React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { clearToken, readToken } from '../auth/storage';
import { api } from '../api/client';
import { showError } from '../ui/toast';
import { unregisterForPushNotifications } from '../notifications/push';
import { colors, radius, spacing, typography } from '../design/tokens';
export function SettingsScreen({
  navigation,
  onSignedOut,
}: {
  navigation: { goBack: () => void };
  onSignedOut: () => void;
}) {
  const [telegramLink, setTelegramLink] = React.useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = React.useState(false);

  async function signOut() {
    const token = await readToken();
    if (token) {
      try {
        await unregisterForPushNotifications(token);
      } catch {
        // Logout must continue even if device cleanup cannot reach the server.
      }
    }
    await clearToken();
    onSignedOut();
  }

  async function connectTelegram() {
    setTelegramLoading(true);
    try {
      const token = await readToken();
      if (!token) throw new Error('انتهت جلسة الدخول');
      const result = await api.createTelegramLink(token);
      setTelegramLink(result.link);
      await Linking.openURL(result.link);
    } catch (error) {
      showError('تعذر ربط Telegram', error);
    } finally {
      setTelegramLoading(false);
    }
  }
  return (
    <View style={styles.screen}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>→</Text>
      </Pressable>
      <Text style={styles.title}>الحساب والإعدادات</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>حسابك</Text>
        <Text style={styles.cardText}>
          بياناتك محفوظة بأمان ويمكنك التحكم بها من هنا.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Telegram</Text>
        <Text style={styles.cardText}>
          ولّد رابط الربط وافتحه داخل البوت قبل إرسال المصروف.
        </Text>
        <Pressable
          onPress={connectTelegram}
          style={styles.telegramButton}
          disabled={telegramLoading}
        >
          <Text style={styles.telegramButtonText}>
            {telegramLoading ? 'جارٍ إنشاء الرابط...' : 'ربط Telegram'}
          </Text>
        </Pressable>
        {telegramLink ? (
          <Text selectable style={styles.link}>
            {telegramLink}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={signOut} style={styles.logout}>
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </Pressable>
      <Text style={styles.version}>مصروفاتي • الإصدار 1.0.0</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, padding: spacing.xl },
  back: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 24, color: colors.ink },
  title: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'right',
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.heading, color: colors.ink, textAlign: 'right' },
  cardText: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  logout: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  logoutText: { ...typography.body, color: colors.danger, fontWeight: '700' },
  telegramButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  telegramButtonText: {
    ...typography.body,
    color: colors.primaryText,
    fontWeight: '700',
  },
  link: {
    ...typography.label,
    color: colors.emerald,
    textAlign: 'left',
    marginTop: spacing.md,
  },
  version: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 'auto',
  },
});
