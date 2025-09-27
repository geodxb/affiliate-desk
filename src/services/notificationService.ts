import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PushNotification } from '../types/notification';

export const notificationService = {
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  },

  async getNotifications(userId: string): Promise<PushNotification[]> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate(),
      })) as PushNotification[];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },

  subscribeToNotifications(userId: string, callback: (notifications: PushNotification[]) => void): () => void {
    // Use the available index: userId + createdAt
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(notificationsQuery, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate(),
        })) as PushNotification[];
        callback(notifications);
      }, (error) => {
        console.error('Error fetching notifications:', error);
        // Try fallback without orderBy
        try {
          const fallbackQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', userId)
          );
          
          return onSnapshot(fallbackQuery, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              expiresAt: doc.data().expiresAt?.toDate(),
            })) as PushNotification[];
            
            // Sort manually
            notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            callback(notifications);
          });
        } catch (fallbackError) {
          console.error('Notifications fallback query failed:', fallbackError);
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error setting up notifications subscription:', error);
      return () => {};
    }
  }
};