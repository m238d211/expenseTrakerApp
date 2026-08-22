import { useSyncExternalStore } from 'react';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
  readAt: string | null;
};

let notifications: AppNotification[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function addNotification(
  notification: Pick<AppNotification, 'title' | 'body'> &
    Partial<Pick<AppNotification, 'id' | 'receivedAt' | 'readAt'>>,
) {
  const id = notification.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (notifications.some(item => item.id === id)) return;
  notifications = [
    {
      title: notification.title,
      body: notification.body,
      id,
      receivedAt: notification.receivedAt ?? new Date().toISOString(),
      readAt: notification.readAt ?? null,
    },
    ...notifications,
  ];
  notifyListeners();
}

export function hydrateNotifications(serverNotifications: AppNotification[]) {
  const serverIds = new Set(serverNotifications.map(notification => notification.id));
  const localOnly = notifications.filter(notification => !serverIds.has(notification.id));
  notifications = [...serverNotifications, ...localOnly].sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
  );
  notifyListeners();
}

export function markNotificationRead(id: string, readAt = new Date().toISOString()) {
  notifications = notifications.map(notification =>
    notification.id === id ? { ...notification, readAt } : notification,
  );
  notifyListeners();
}

export function removeNotification(id: string) {
  notifications = notifications.filter(notification => notification.id !== id);
  notifyListeners();
}

export function clearNotifications() {
  notifications = [];
  notifyListeners();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getNotifications() {
  return notifications;
}

export function useNotifications() {
  return useSyncExternalStore(subscribe, getNotifications, getNotifications);
}
