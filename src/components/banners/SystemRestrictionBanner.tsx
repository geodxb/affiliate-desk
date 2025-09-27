import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Lock, XCircle, AlertCircle, Shield } from 'lucide-react';
import { SystemRestriction } from '../../types/banner';
import { cn } from '../../lib/utils';

interface SystemRestrictionBannerProps {
  restrictions: SystemRestriction;
  className?: string;
}

const SystemRestrictionBanner: React.FC<SystemRestrictionBannerProps> = ({ 
  restrictions, 
  className 
}) => {
  // Don't show banner if no restrictions are active
  if (!restrictions.restrictedMode && 
      restrictions.withdrawalsEnabled && 
      restrictions.messagingEnabled && 
      restrictions.profileUpdatesEnabled &&
      restrictions.loginEnabled) {
    return null;
  }

  const getRestrictionLevel = () => {
    if (!restrictions.restrictedMode) {
      // Check individual service restrictions
      const disabledServices = [];
      if (!restrictions.withdrawalsEnabled) disabledServices.push('Withdrawals');
      if (!restrictions.messagingEnabled) disabledServices.push('Messaging');
      if (!restrictions.profileUpdatesEnabled) disabledServices.push('Profile Updates');
      if (!restrictions.loginEnabled) disabledServices.push('Login');
      
      if (disabledServices.length > 0) {
        return {
          level: 'partial',
          message: `Some services are temporarily disabled: ${disabledServices.join(', ')}`,
          icon: AlertTriangle,
          colors: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        };
      }
    }

    switch (restrictions.restrictionLevel) {
      case 'full':
        return {
          level: 'full',
          message: restrictions.restrictionReason || 'System access is currently restricted. Most platform features are temporarily unavailable.',
          icon: XCircle,
          colors: 'bg-red-700 border-red-800 text-white'
        };
      case 'partial':
        return {
          level: 'partial',
          message: restrictions.restrictionReason || 'Platform access is partially restricted. Some features may be temporarily unavailable.',
          icon: AlertTriangle,
          colors: 'bg-amber-50 border-amber-300 text-amber-900'
        };
      default:
        return {
          level: 'none',
          message: restrictions.restrictionReason || 'Platform restrictions are currently in effect.',
          icon: AlertCircle,
          colors: 'bg-slate-50 border-slate-300 text-slate-800'
        };
    }
  };

  const restrictionInfo = getRestrictionLevel();
  const Icon = restrictionInfo.icon;
  const isFullRestriction = restrictionInfo.level === 'full';

  const getDisabledServices = () => {
    const disabled = [];
    if (!restrictions.withdrawalsEnabled) disabled.push('Withdrawals');
    if (!restrictions.messagingEnabled) disabled.push('Messaging');
    if (!restrictions.profileUpdatesEnabled) disabled.push('Profile Updates');
    if (!restrictions.loginEnabled) disabled.push('User Login');
    return disabled;
  };

  const disabledServices = getDisabledServices();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'border rounded-lg p-4 shadow-sm relative overflow-hidden mb-6',
        restrictionInfo.colors,
        className
      )}
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
          <Icon className={cn(
            'w-5 h-5 mt-0.5',
            isFullRestriction ? 'text-white' : ''
          )} />
          <div className={cn(
            'px-2 py-1 text-xs font-bold rounded uppercase tracking-wider',
            isFullRestriction 
              ? 'bg-white bg-opacity-20 text-white border border-white border-opacity-30' 
              : 'bg-black bg-opacity-10 text-current border border-current border-opacity-20'
          )}>
            {restrictionInfo.level.toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className={cn(
              'text-sm font-semibold uppercase tracking-wider',
              isFullRestriction ? 'text-white' : ''
            )}>
              Platform Access Restriction
            </h4>
          </div>
          
          <p className={cn(
            'text-sm leading-relaxed mb-2 font-medium',
            isFullRestriction ? 'text-white' : ''
          )}>
            {restrictionInfo.message}
          </p>
          
          {/* Show disabled services */}
          {disabledServices.length > 0 && (
            <div className={cn(
              'text-xs font-medium',
              isFullRestriction ? 'text-white opacity-90' : 'opacity-80'
            )}>
              <span className="font-semibold">Affected Services: </span>
              <span>{disabledServices.join(', ')}</span>
            </div>
          )}
          
          {/* Show allowed pages for full restriction */}
          {restrictions.restrictionLevel === 'full' && restrictions.allowedPages.length > 0 && (
            <div className={cn(
              'mt-2 text-xs font-medium',
              isFullRestriction ? 'text-white opacity-90' : 'opacity-80'
            )}>
              <span className="font-semibold">Available Sections: </span>
              <span>{restrictions.allowedPages.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SystemRestrictionBanner;