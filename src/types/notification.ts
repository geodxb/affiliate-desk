export interface PushNotification {
  id: string;
  userId: string;
  userRole: 'investor' | 'admin' | 'governor';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'account' | 'withdrawal' | 'message' | 'system' | 'security';
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: Record<string, boolean>;
}