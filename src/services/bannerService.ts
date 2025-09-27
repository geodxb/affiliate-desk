import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AnnouncementBanner } from '../types/banner';

export const bannerService = {
  async getAnnouncementBanners(userRole: string): Promise<AnnouncementBanner[]> {
    try {
      console.log('=== FETCHING ANNOUNCEMENT BANNERS ===');
      console.log('User role:', userRole);
      
      // Get active announcements
      const bannersQuery = query(
        collection(db, 'announcements'),
        where('isActive', '==', true),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(bannersQuery);
      console.log('Found', snapshot.docs.length, 'active announcements');
      
      const banners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
      })) as AnnouncementBanner[];

      // Filter by user role and date range
      const filteredBanners = banners.filter(banner => {
        // Check if user role is in target roles
        const hasValidRole = banner.targetRoles.includes(userRole as any);
        
        // Check date range
        const now = new Date();
        const isInDateRange = (!banner.startDate || banner.startDate <= now) &&
                             (!banner.endDate || banner.endDate >= now);
        
        console.log(`Banner ${banner.id}:`, {
          title: banner.title,
          targetRoles: banner.targetRoles,
          hasValidRole,
          isInDateRange,
          startDate: banner.startDate,
          endDate: banner.endDate
        });
        
        return hasValidRole && isInDateRange;
      });

      console.log('Filtered banners for user:', filteredBanners.length);
      return filteredBanners;
    } catch (error) {
      console.error('Failed to fetch announcement banners:', error);
      return [];
    }
  },

  subscribeToAnnouncementBanners(
    userRole: string,
    callback: (banners: AnnouncementBanner[]) => void
  ): () => void {
    console.log('=== SUBSCRIBING TO ANNOUNCEMENT BANNERS ===');
    console.log('User role:', userRole);
    
    try {
      // Subscribe to active announcements
      const bannersQuery = query(
        collection(db, 'announcements'),
        where('isActive', '==', true)
      );

      return onSnapshot(bannersQuery, (snapshot) => {
        console.log('Announcement banners subscription update:', snapshot.docs.length, 'documents');
        
        const banners = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          startDate: doc.data().startDate?.toDate(),
          endDate: doc.data().endDate?.toDate(),
        })) as AnnouncementBanner[];

        // Filter by user role and date range
        const filteredBanners = banners.filter(banner => {
          const hasValidRole = banner.targetRoles.includes(userRole as any);
          const now = new Date();
          const isInDateRange = (!banner.startDate || banner.startDate <= now) &&
                               (!banner.endDate || banner.endDate >= now);
          return hasValidRole && isInDateRange;
        });

        // Sort by priority and creation date
        filteredBanners.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 1;
          const bPriority = priorityOrder[b.priority] || 1;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

        console.log('Filtered and sorted banners:', filteredBanners);
        callback(filteredBanners);
      }, (error) => {
        console.error('Announcement banners subscription error:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up announcement banners subscription:', error);
      callback([]);
      return () => {};
    }
  },
};