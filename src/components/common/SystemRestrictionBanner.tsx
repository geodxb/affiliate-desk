import React from 'react';
import { motion } from 'framer-motion';
import { useSystemControls } from '../../hooks/useSystemControls';
import { AlertTriangle, Shield, Lock, MessageSquareOff, CreditCard, UserX, Settings, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SystemRestrictionBannerProps {
  className?: string;
}

const SystemRestrictionBanner: React.FC<SystemRestrictionBannerProps> = ({ className }) => {
  const { 
    systemSettings,
    isWithdrawalsEnabled, 
    isMessagingEnabled, 
    isProfileUpdatesEnabled,
    isLoginEnabled,
    getRestrictionMessage,
    getRestrictionLevel,
    isMaintenanceMode,
    getMaintenanceMessage
  } = useSystemControls();

  // Check if there are any restrictions in place based on exact boolean values
  const hasServiceRestrictions = !isWithdrawalsEnabled() || !isMessagingEnabled() || !isProfileUpdatesEnabled() || !isLoginEnabled();
  const hasGeneralRestrictions = systemSettings?.systemControls?.restrictedMode;
  const hasMaintenanceMode = isMaintenanceMode();
  
  // Don't show banner if no restrictions are active
  if (!hasServiceRestrictions && !hasGeneralRestrictions && !hasMaintenanceMode) {
    return null;
  }

  // Maintenance mode takes priority
  if (hasMaintenanceMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'bg-black border border-gray-800 rounded-lg p-4 mb-6 relative overflow-hidden',
          className
        )}
      >
        <motion.div
          className="absolute inset-0 bg-purple-800 opacity-10"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="flex items-start space-x-3 relative z-10">
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Settings className="w-5 h-5 text-white" />
            <div className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-white bg-opacity-20 text-white border border-white border-opacity-30">
              MAINTENANCE
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">
              SYSTEM MAINTENANCE
            </h3>
            <p className="text-sm text-white opacity-90 font-medium">
              {getMaintenanceMessage()}
            </p>
            <div className="mt-2 text-xs text-white opacity-80 font-medium">
              <span>System Administrator</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const restrictionLevel = getRestrictionLevel();
  const restrictionMessage = getRestrictionMessage();

  const getRestrictionIcon = () => {
    switch (restrictionLevel) {
      case 'full':
        return <XCircle className="w-5 h-5 text-white" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-white" />;
      default:
        return <Info className="w-5 h-5 text-white" />;
    }
  };

  const getDisabledFunctionalities = () => {
    const disabled = [];
    if (systemSettings?.systemControls?.withdrawalsEnabled === false) disabled.push('Withdrawals');
    if (systemSettings?.systemControls?.messagingEnabled === false) disabled.push('Messaging');
    if (systemSettings?.systemControls?.profileUpdatesEnabled === false) disabled.push('Profile Updates');
    if (systemSettings?.systemControls?.loginEnabled === false) disabled.push('User Login');
    return disabled;
  };

  const disabledFunctionalities = getDisabledFunctionalities();
  const isFullRestriction = restrictionLevel === 'full';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'bg-black border border-gray-800 rounded-lg p-4 mb-6 relative overflow-hidden',
        className
      )}
    >
      {/* Full restriction animation */}
      {isFullRestriction && (
        <motion.div
          className="absolute inset-0 bg-red-800 opacity-10"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      <div className="flex items-start space-x-3 relative z-10">
        <div className="flex items-center space-x-3 flex-shrink-0">
          {getRestrictionIcon()}
          <div className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-white bg-opacity-20 text-white border border-white border-opacity-30">
            {restrictionLevel.toUpperCase()}
          </div>
          <div className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-gray-600 bg-opacity-60 text-white border border-gray-500 border-opacity-40">
            SYSTEM
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-1">
            PLATFORM ACCESS RESTRICTION
          </h4>
          
          <p className="text-sm leading-relaxed font-medium text-white opacity-90">
            {restrictionMessage}
          </p>
          
          {/* Show disabled services */}
          {disabledFunctionalities.length > 0 && (
            <div className="mt-2 text-xs font-medium text-white opacity-80">
              <span className="font-semibold">Affected Services: </span>
              <span>{disabledFunctionalities.join(', ')}</span>
            </div>
          )}
          
          {/* Show allowed pages for full restriction */}
          {restrictionLevel === 'full' && systemSettings?.systemControls?.allowedPages && systemSettings.systemControls.allowedPages.length > 0 && (
            <div className="mt-1 text-xs font-medium text-white opacity-80">
              <span className="font-semibold">Available Sections: </span>
              <span>{systemSettings.systemControls.allowedPages.join(', ')}</span>
            </div>
          )}
          
          <div className="mt-2 text-xs text-white opacity-80 font-medium">
            <span>System Administrator</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SystemRestrictionBanner;