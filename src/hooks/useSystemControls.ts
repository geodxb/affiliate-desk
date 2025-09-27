import { useState, useEffect } from 'react';
import { systemSettingsService, SystemSettings } from '../services/systemSettingsService';

export const useSystemControls = () => {
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up real-time listener for system settings
    console.log('🔄 Setting up real-time listener for system controls...');
    
    const unsubscribe = systemSettingsService.subscribeToSystemSettings((settings) => {
      console.log('🔄 System controls updated:', settings?.systemControls);
      setSystemSettings(settings);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up system controls listener');
      unsubscribe();
    };
  }, []);

  // Helper functions to check specific restrictions
  const isWithdrawalsEnabled = () => {
    return systemSettings?.systemControls?.withdrawalsEnabled === true;
  };

  const isMessagingEnabled = () => {
    return systemSettings?.systemControls?.messagingEnabled === true;
  };

  const isProfileUpdatesEnabled = () => {
    return systemSettings?.systemControls?.profileUpdatesEnabled === true;
  };

  const isLoginEnabled = () => {
    return systemSettings?.systemControls?.loginEnabled === true;
  };

  const isDepositsEnabled = () => {
    return systemSettings?.systemControls?.depositsEnabled === true;
  };

  const isTradingEnabled = () => {
    return systemSettings?.systemControls?.tradingEnabled === true;
  };

  const isAccountCreationEnabled = () => {
    return systemSettings?.systemControls?.accountCreationEnabled === true;
  };

  const isSupportTicketsEnabled = () => {
    return systemSettings?.systemControls?.supportTicketsEnabled === true;
  };

  const isNotificationsEnabled = () => {
    return systemSettings?.systemControls?.notificationsEnabled === true;
  };

  const isApiAccessEnabled = () => {
    return systemSettings?.systemControls?.apiAccessEnabled === true;
  };

  const isDataExportEnabled = () => {
    return systemSettings?.systemControls?.dataExportEnabled === true;
  };

  const isReportingEnabled = () => {
    return systemSettings?.systemControls?.reportingEnabled === true;
  };

  const isWithdrawalsDisabled = () => {
    return systemSettings?.systemControls?.withdrawalsEnabled === false;
  };

  const isPageAllowed = (pagePath: string) => {
    // If restricted mode is not active, allow all pages
    if (!systemSettings?.systemControls?.restrictedMode) {
      return true;
    }
    
    // If restricted mode is active but no specific pages are restricted, allow all pages
    if (!systemSettings.systemControls.allowedPages || systemSettings.systemControls.allowedPages.length === 0) {
      return true;
    }
    
    const allowedPages = systemSettings.systemControls.allowedPages || [];
    return allowedPages.some(allowedPath => pagePath.startsWith(allowedPath));
  };

  const getRestrictionMessage = () => {
    return systemSettings?.systemControls?.restrictionReason || 'This functionality is currently restricted.';
  };

  const getRestrictionLevel = () => {
    return systemSettings?.systemControls?.restrictionLevel || 'none';
  };

  const isMaintenanceMode = () => {
    return systemSettings?.maintenanceMode || false;
  };

  const getMaintenanceMessage = () => {
    return systemSettings?.maintenanceMessage || 'System is currently under maintenance.';
  };

  return {
    systemSettings,
    loading,
    error,
    isWithdrawalsEnabled,
    isMessagingEnabled,
    isProfileUpdatesEnabled,
    isLoginEnabled,
    isDepositsEnabled,
    isTradingEnabled,
    isAccountCreationEnabled,
    isSupportTicketsEnabled,
    isNotificationsEnabled,
    isApiAccessEnabled,
    isDataExportEnabled,
    isReportingEnabled,
    isPageAllowed,
    getRestrictionMessage,
    getRestrictionLevel,
    isMaintenanceMode,
    getMaintenanceMessage
  };
};