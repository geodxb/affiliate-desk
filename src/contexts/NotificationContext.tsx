import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PushNotification } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: PushNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<PushNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const { currentUser } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<PushNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: PushNotification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      if (currentUser) {
        await notificationService.markAsRead(notificationId);
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (currentUser) {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        await Promise.all(unreadIds.map(id => notificationService.markAsRead(id)));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = async () => {
    try {
      if (currentUser) {
        // Delete all notifications from Firestore
        await notificationService.clearAllNotifications(currentUser.uid);
        // Clear local state
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      throw error;
    }
  };
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = notificationService.subscribeToNotifications(
        currentUser.uid,
        setNotifications
      );
      return unsubscribe;
    }
  }, [currentUser]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};