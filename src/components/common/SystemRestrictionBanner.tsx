import { motion } from 'framer-motion';
import { useSystemControls } from '../../hooks/useSystemControls';
import { AlertTriangle, Shield, Lock, MessageSquareOff, CreditCard, UserX, Settings, Info, XCircle } from 'lucide-react';

interface SystemRestrictionBannerProps {
  currentPage?: string;
  className?: string;
}

const SystemRestrictionBanner = ({ currentPage, className }: SystemRestrictionBannerProps) => {
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

  // Check if there are any restrictions in place
  const hasServiceRestrictions = !isWithdrawalsEnabled() || !isMessagingEnabled() || !isProfileUpdatesEnabled();
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
        className={`bg-purple-600 bg-opacity-90 border border-purple-700 border-opacity-60 text-white rounded-lg p-4 mb-6 ${className}`}
      >
        <div className="flex items-start space-x-3">
          <Settings className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">
              SYSTEM MAINTENANCE
            </h3>
            <p className="text-sm font-medium opacity-90">
              {getMaintenanceMessage()}
            </p>
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
        return <AlertTriangle className="w-5 h-5 text-amber-700" />;
      default:
        return <Info className="w-5 h-5 text-blue-700" />;
    }
  };

  const getRestrictionStyles = () => {
    switch (restrictionLevel) {
      case 'full':
        return 'bg-red-600 bg-opacity-85 border-red-700 border-opacity-50 text-white';
      case 'partial':
        return 'bg-amber-50 bg-opacity-60 border-amber-200 border-opacity-40 text-amber-800';
      default:
        return 'bg-blue-50 bg-opacity-60 border-blue-200 border-opacity-40 text-blue-700';
    }
  };

  const getDisabledFunctionalities = () => {
    const disabled = [];
    if (!isWithdrawalsEnabled()) disabled.push({ icon: <CreditCard className="w-3 h-3" />, text: 'Withdrawals' });
    if (!isMessagingEnabled()) disabled.push({ icon: <MessageSquareOff className="w-3 h-3" />, text: 'Messaging' });
    if (!isProfileUpdatesEnabled()) disabled.push({ icon: <UserX className="w-3 h-3" />, text: 'Profile Updates' });
    if (!isLoginEnabled()) disabled.push({ icon: <Lock className="w-3 h-3" />, text: 'User Login' });
    return disabled;
  };

  const disabledFunctionalities = getDisabledFunctionalities();
  const isFullRestriction = restrictionLevel === 'full';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`border rounded-lg p-4 mb-6 relative overflow-hidden ${getRestrictionStyles()} ${className}`}
    >
      {/* Full restriction animation */}
      {isFullRestriction && (
        <motion.div
          className="absolute inset-0 bg-red-800 opacity-5"
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      <div className="flex items-start space-x-3 relative z-10">
        <div className="flex items-center space-x-3 flex-shrink-0">
          {getRestrictionIcon()}
          <div className={`px-2 py-1 text-xs font-bold rounded ${
            isFullRestriction 
              ? 'bg-white bg-opacity-20 text-white border border-white border-opacity-30' 
              : 'bg-black bg-opacity-10 text-current border border-current border-opacity-20'
          }`}>
            {restrictionLevel.toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1">
            Platform Access Restriction
          </h3>
          
          <p className="text-sm font-medium mb-2 opacity-90">
            {restrictionMessage}
          </p>
          
          {/* Show disabled services */}
          {disabledFunctionalities.length > 0 && (
            <div className="text-xs font-medium opacity-80">
              <span className="font-semibold">Affected Services: </span>
              <span>{disabledFunctionalities.map(func => func.text).join(', ')}</span>
            </div>
          )}
          
          {/* Show allowed pages for full restriction */}
          {restrictionLevel === 'full' && systemSettings?.systemControls?.allowedPages && systemSettings.systemControls.allowedPages.length > 0 && (
            <div className="mt-2 text-xs font-medium opacity-80">
              <span className="font-semibold">Available Sections: </span>
              <span>{systemSettings.systemControls.allowedPages.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SystemRestrictionBanner;