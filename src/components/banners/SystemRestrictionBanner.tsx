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
          message: restrictions.restrictionReason || 'System is under full restriction. Most features are disabled.',
          icon: XCircle,
          colors: 'bg-red-600 border-red-700 text-white'
        };
      case 'partial':
        return {
          level: 'partial',
          message: restrictions.restrictionReason || 'System is under partial restriction. Some features may be limited.',
          icon: AlertTriangle,
          colors: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        };
      default:
        return {
          level: 'none',
          message: restrictions.restrictionReason || 'System restrictions are in effect.',
          icon: AlertCircle,
          colors: 'bg-blue-50 border-blue-200 text-blue-800'
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
          className="absolute inset-0 bg-red-700 opacity-10"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className="flex items-start space-x-3 relative z-10">
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Icon className={cn(
            'w-5 h-5 mt-0.5',
            isFullRestriction ? 'text-white' : ''
          )} />
          <Shield className={cn(
            'w-4 h-4',
            isFullRestriction ? 'text-white' : ''
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className={cn(
              'text-sm font-bold uppercase tracking-wide',
              isFullRestriction ? 'text-white' : ''
            )}>
              System Restriction Active
            </h4>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium uppercase',
              isFullRestriction 
                ? 'bg-white bg-opacity-20 text-white' 
                : 'bg-black bg-opacity-10'
            )}>
              {restrictionInfo.level}
            </span>
          </div>
          
          <p className={cn(
            'text-sm leading-relaxed mb-2',
            isFullRestriction ? 'text-white' : ''
          )}>
            {restrictionInfo.message}
          </p>
          
          {/* Show disabled services */}
          {disabledServices.length > 0 && (
            <div className={cn(
              'text-xs',
              isFullRestriction ? 'text-white opacity-90' : 'opacity-75'
            )}>
              <span className="font-medium">Affected Services: </span>
              <span>{disabledServices.join(', ')}</span>
            </div>
          )}
          
          {/* Show allowed pages for full restriction */}
          {restrictions.restrictionLevel === 'full' && restrictions.allowedPages.length > 0 && (
            <div className={cn(
              'mt-2 text-xs',
              isFullRestriction ? 'text-white opacity-90' : 'opacity-75'
            )}>
              <span className="font-medium">Accessible Pages: </span>
              <span>{restrictions.allowedPages.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SystemRestrictionBanner;