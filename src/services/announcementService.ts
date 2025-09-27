import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { getAuth } from 'firebase/auth';
import { Announcement } from '../types/common';

export const announcementService = {
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      // Skip announcements if user is not authenticated
      if (!auth.currentUser) {
        console.log('User not authenticated, skipping announcements');
        return [];
      }

      // Try simple query first to avoid index issues
      try {
        const simpleQuery = query(
          collection(db, 'announcements'),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(simpleQuery);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate(),
        })).filter(announcement => {
          // Filter for investor/admin role and check expiration
          const hasValidRole = announcement.targetRoles?.includes('investor') || 
                              announcement.targetRoles?.includes('admin');
          const isNotExpired = !announcement.expiresAt || announcement.expiresAt > new Date();
          return hasValidRole && isNotExpired;
        }).sort((a, b) => {
          // Sort by priority desc, then createdAt desc
          if (a.priority !== b.priority) {
            return (b.priority || 0) - (a.priority || 0);
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        }) as Announcement[];
      } catch (error) {
        console.error('Simple announcements query failed:', error);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      return [];
    }
  },

  subscribeToAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
    // Skip if user is not authenticated
    if (!auth.currentUser) {
      console.log('User not authenticated, returning empty announcements');
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }

    // Use simple query to avoid index issues
    try {
      const simpleQuery = query(
        collection(db, 'announcements'),
        where('isActive', '==', true)
      );

      return onSnapshot(simpleQuery, (snapshot) => {
        const announcements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate(),
        })).filter(announcement => {
          // Filter for investor/admin role and check expiration
          const hasValidRole = announcement.targetRoles?.includes('investor') || 
                              announcement.targetRoles?.includes('admin');
          const isNotExpired = !announcement.expiresAt || announcement.expiresAt > new Date();
          return hasValidRole && isNotExpired;
        }) as Announcement[];
        
        callback(announcements);
      }, (error) => {
        console.error('Announcements subscription error:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up announcements subscription:', error);
      callback([]);
      return () => {};
    }
  },
};