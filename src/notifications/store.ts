import { useSyncExternalStore } from 'react';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
};

let notifications: AppNotification[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function addNotification(
  notification: Omit<AppNotification, 'id' | 'receivedAt'>,
) {
  notifications = [
    {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      receivedAt: new Date().toISOString(),
    },
    ...notifications,
  ];
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
