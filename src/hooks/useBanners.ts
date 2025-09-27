import { useState, useEffect } from 'react';
import { bannerService } from '../services/bannerService';
import { systemSettingsService } from '../services/systemSettingsService';
import { AnnouncementBanner, SystemRestriction } from '../types/banner';
import { useAuth } from '../contexts/AuthContext';

export const useBanners = () => {
  const { userProfile } = useAuth();
  const [announcementBanners, setAnnouncementBanners] = useState<AnnouncementBanner[]>([]);
  const [systemRestrictions, setSystemRestrictions] = useState<SystemRestriction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.role) {
      setLoading(false);
      return;
    }

    console.log('=== SETTING UP BANNERS FOR USER ===');
    console.log('User role:', userProfile.role);

    // Subscribe to announcement banners
    const unsubscribeAnnouncements = bannerService.subscribeToAnnouncementBanners(
      userProfile.role,
      (banners) => {
        console.log('Received announcement banners:', banners);
        setAnnouncementBanners(banners);
        setLoading(false);
      }
    );

    // Subscribe to system settings for restrictions
    const unsubscribeSystemSettings = systemSettingsService.subscribeToSystemSettings(
      (settings) => {
        if (settings) {
          console.log('Received system settings for restrictions:', settings.systemControls);
          setSystemRestrictions({
            restrictedMode: settings.systemControls.restrictedMode,
            restrictionReason: settings.systemControls.restrictionReason,
            restrictionLevel: settings.systemControls.restrictionLevel,
            withdrawalsEnabled: settings.systemControls.withdrawalsEnabled,
            messagingEnabled: settings.systemControls.messagingEnabled,
            profileUpdatesEnabled: settings.systemControls.profileUpdatesEnabled,
            loginEnabled: settings.systemControls.loginEnabled,
            allowedPages: settings.systemControls.allowedPages,
          });
        } else {
          // Default to no restrictions if settings not found
          setSystemRestrictions({
            restrictedMode: false,
            restrictionReason: '',
            restrictionLevel: 'none',
            withdrawalsEnabled: true,
            messagingEnabled: true,
            profileUpdatesEnabled: true,
            loginEnabled: true,
            allowedPages: [],
          });
        }
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAnnouncements();
      unsubscribeSystemSettings();
    };
  }, [userProfile?.role]);

  const dismissAnnouncementBanner = (bannerId: string) => {
    setAnnouncementBanners(prev => prev.filter(banner => banner.id !== bannerId));
  };

  return {
    announcementBanners,
    systemRestrictions,
    loading,
    dismissAnnouncementBanner,
  };
};