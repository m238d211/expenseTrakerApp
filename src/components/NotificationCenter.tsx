import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bell, Trash2, X } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../design/tokens';
import { api } from '../api/client';
import { readToken } from '../auth/storage';
import {
  AppNotification,
  markNotificationRead,
  removeNotification,
  useNotifications,
} from '../notifications/store';

const SWIPE_THRESHOLD = 90;

function formatNotificationTime(value: string) {
  return new Date(value).toLocaleString('ar-IQ', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function NotificationRow({ notification }: { notification: AppNotification }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => translateX.setValue(0),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderMove: (_, gesture) => translateX.setValue(gesture.dx),
      onPanResponderRelease: (_, gesture) => {
        handleSwipeRelease(gesture.dx);
      },
      onPanResponderTerminate: (_, gesture) => handleSwipeRelease(gesture.dx),
    }),
  ).current;

  function handleSwipeRelease(distance: number) {
    if (Math.abs(distance) < SWIPE_THRESHOLD) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(translateX, {
      toValue: distance > 0 ? 500 : -500,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      removeNotification(notification.id);
      void readToken().then(token => {
        if (token) void api.deleteNotification(token, notification.id).catch(() => undefined);
      });
    });
  }

  return (
    <View style={styles.rowFrame}>
      <View style={styles.deleteSurface}>
        <Trash2 color={colors.white} size={20} />
        <Text style={styles.deleteHint}>اسحب للحذف</Text>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.row, { transform: [{ translateX }] }]}
      >
        <View style={styles.rowIcon}>
          <Bell color={colors.emeraldDark} size={18} />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{notification.title}</Text>
          <Text style={styles.rowBody}>{notification.body}</Text>
          <Text style={styles.rowTime}>
            {formatNotificationTime(notification.receivedAt)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

export function NotificationCenter({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const notifications = useNotifications();

  useEffect(() => {
    if (!visible) return;
    const persistedNotifications = notifications.filter(
      notification =>
        !notification.readAt &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          notification.id,
        ),
    );
    if (!persistedNotifications.length) return;
    void readToken().then(token => {
      if (!token) return;
      void Promise.all(
        persistedNotifications.map(async notification => {
          try {
            const updated = await api.markNotificationRead(token, notification.id);
            markNotificationRead(notification.id, updated.readAt ?? new Date().toISOString());
          } catch {
            // The notification remains unread locally if the server update fails.
          }
        }),
      );
    });
  }, [notifications, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق الإشعارات"
              onPress={onClose}
              hitSlop={10}
            >
              <X color={colors.ink} size={24} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.panelTitle}>الإشعارات</Text>
              <Text style={styles.panelSubtitle}>
                {notifications.length
                  ? 'اسحب الإشعار يميناً أو يساراً لحذفه'
                  : 'لا توجد إشعارات حالياً'}
              </Text>
            </View>
          </View>
          <View style={styles.list}>
            {notifications.map(notification => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20, 33, 61, 0.38)',
  },
  panel: {
    maxHeight: '82%',
    minHeight: 260,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerCopy: { alignItems: 'flex-end', flex: 1, marginLeft: spacing.md },
  panelTitle: { ...typography.heading, color: colors.ink },
  panelSubtitle: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: 3,
  },
  list: { gap: spacing.sm },
  rowFrame: {
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.danger,
  },
  deleteSurface: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  deleteHint: { ...typography.label, color: colors.white, fontWeight: '700' },
  row: {
    minHeight: 82,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, marginRight: spacing.sm },
  rowTitle: {
    ...typography.body,
    color: colors.ink,
    textAlign: 'right',
    fontWeight: '700',
  },
  rowBody: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  rowTime: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: 4,
    fontSize: 11,
  },
});
