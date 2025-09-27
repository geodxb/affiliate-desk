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
      // Skip announcements if user is not authenticated (e.g., on login page)
      const auth = getAuth();
      if (!auth.currentUser) {
        console.log('User not authenticated, skipping announcements');
        return [];
      }

      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('isActive', '==', true),
        where('targetRoles', 'array-contains', 'investor'),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(announcementsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate(),
      })).filter(announcement => {
        // Filter out expired announcements
        if (announcement.expiresAt) {
          return announcement.expiresAt > new Date();
        }
        return true;
      }) as Announcement[];
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      // If it's an index error, provide fallback behavior
      if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
        console.warn('Firestore index missing for announcements query or insufficient permissions. Please create the required composite index in Firebase console.');
        // Try a simpler query as fallback
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
            // Filter for investor role and check expiration
            const hasInvestorRole = announcement.targetRoles?.includes('investor');
            const isNotExpired = !announcement.expiresAt || announcement.expiresAt > new Date();
            return hasInvestorRole && isNotExpired;
          }).sort((a, b) => {
            // Sort by priority desc, then createdAt desc
            if (a.priority !== b.priority) {
              return (b.priority || 0) - (a.priority || 0);
            }
            return b.createdAt.getTime() - a.createdAt.getTime();
          }) as Announcement[];
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return [];
        }
      }
      return [];
    }
  },

  subscribeToAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
    // Skip announcements if user is not authenticated
    const auth = getAuth();
    if (!auth.currentUser) {
      console.log('User not authenticated, returning empty announcements');
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }

    try {
      // Use the available composite index: targetRoles + isActive + priority + createdAt
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('targetRoles', 'array-contains', 'investor'),
        where('isActive', '==', true),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(announcementsQuery, (snapshot) => {
        const announcements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate(),
        })).filter(announcement => {
          // Check expiration
          const isNotExpired = !announcement.expiresAt || announcement.expiresAt > new Date();
          return isNotExpired;
        }) as Announcement[];
        
        callback(announcements);
      }, (error) => {
        console.error('Error fetching announcements:', error);
        // Try fallback with just isActive + createdAt
        try {
          const fallbackQuery = query(
            collection(db, 'announcements'),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
          );
          
          return onSnapshot(fallbackQuery, (snapshot) => {
            const announcements = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
              expiresAt: doc.data().expiresAt?.toDate(),
            })).filter(announcement => {
              // Filter for investor role and check expiration
              const hasInvestorRole = announcement.targetRoles?.includes('investor');
              const isNotExpired = !announcement.expiresAt || announcement.expiresAt > new Date();
              return hasInvestorRole && isNotExpired;
            }).sort((a, b) => {
              // Sort by priority desc, then createdAt desc
              if (a.priority !== b.priority) {
                return (b.priority || 0) - (a.priority || 0);
              }
              return b.createdAt.getTime() - a.createdAt.getTime();
            }) as Announcement[];
            
            callback(announcements);
          });
        } catch (fallbackError) {
          console.error('Announcements fallback query failed:', fallbackError);
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error setting up announcements subscription:', error);
      // Try simple query without any orderBy
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
            // Filter for investor role and check expiration
            const hasInvestorRole = announcement.targetRoles?.includes('investor');
            const isNotExpired = !announcement.expiresAt || announcement.expiresAt > new Date();
            return hasInvestorRole && isNotExpired;
          }).sort((a, b) => {
            // Sort by priority desc, then createdAt desc
            if (a.priority !== b.priority) {
              return (b.priority || 0) - (a.priority || 0);
            }
            return b.createdAt.getTime() - a.createdAt.getTime();
          }) as Announcement[];
          
          callback(announcements);
        });
      } catch (simpleError) {
        console.error('Simple announcements query failed:', simpleError);
        return () => {};
      }
    }
  },
};