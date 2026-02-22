import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'upcoming' | 'new' | 'updated';
  partyId: string;
  partyName?: string;
  paymentId?: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  isDismissed: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>) => void;
  markAsRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  getUnreadCount: () => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'app_notifications';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      isRead: false,
      isDismissed: false,
    };

    setNotifications((prev) => {
      // Check for duplicates (same type, partyId, and within 1 hour)
      const isDuplicate = prev.some(
        (n) =>
          n.type === newNotification.type &&
          n.partyId === newNotification.partyId &&
          !n.isDismissed &&
          Date.now() - n.timestamp < 3600000
      );

      if (isDuplicate) return prev;
      return [newNotification, ...prev];
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isDismissed: true } : n))
    );
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isDismissed: true })));
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter((n) => !n.isRead && !n.isDismissed).length;
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications.filter((n) => !n.isDismissed),
        addNotification,
        markAsRead,
        dismissNotification,
        dismissAll,
        getUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
