import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSystemControls } from '../../hooks/useSystemControls';
import { AlertTriangle, Lock, Shield, MessageSquareOff, CreditCard, UserX } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FunctionalityGuardProps {
  children: ReactNode;
  functionality: 'withdrawals' | 'messaging' | 'profileUpdates' | 'deposits' | 'trading' | 'accountCreation' | 'supportTickets' | 'notifications' | 'apiAccess' | 'dataExport' | 'reporting';
  fallbackMessage?: string;
  showFallback?: boolean;
}

const FunctionalityGuard = ({ 
  children, 
  functionality, 
  fallbackMessage,
  showFallback = true 
}: FunctionalityGuardProps) => {
  const { 
    systemSettings,
    isWithdrawalsEnabled, 
    isMessagingEnabled, 
    isProfileUpdatesEnabled,
    isDepositsEnabled,
    isTradingEnabled,
    isAccountCreationEnabled,
    isSupportTicketsEnabled,
    isNotificationsEnabled,
    isApiAccessEnabled,
    isDataExportEnabled,
    isReportingEnabled,
    getRestrictionMessage,
    getRestrictionLevel 
  } = useSystemControls();

  const isEnabled = () => {
    switch (functionality) {
      case 'withdrawals':
        return systemSettings?.systemControls?.withdrawalsEnabled === true;
      case 'messaging':
        return systemSettings?.systemControls?.messagingEnabled === true;
      case 'profileUpdates':
        return systemSettings?.systemControls?.profileUpdatesEnabled === true;
      case 'deposits':
        return systemSettings?.systemControls?.depositsEnabled === true;
      case 'trading':
        return systemSettings?.systemControls?.tradingEnabled === true;
      case 'accountCreation':
        return systemSettings?.systemControls?.accountCreationEnabled === true;
      case 'supportTickets':
        return systemSettings?.systemControls?.supportTicketsEnabled === true;
      case 'notifications':
        return systemSettings?.systemControls?.notificationsEnabled === true;
      case 'apiAccess':
        return systemSettings?.systemControls?.apiAccessEnabled === true;
      case 'dataExport':
        return systemSettings?.systemControls?.dataExportEnabled === true;
      case 'reporting':
        return systemSettings?.systemControls?.reportingEnabled === true;
      default:
        return true;
    }
  };

  const getFunctionalityLabel = () => {
    switch (functionality) {
      case 'withdrawals':
        return 'WITHDRAWAL FUNCTIONALITY RESTRICTED';
      case 'messaging':
        return 'MESSAGING FUNCTIONALITY RESTRICTED';
      case 'profileUpdates':
        return 'PROFILE UPDATE FUNCTIONALITY RESTRICTED';
      case 'deposits':
        return 'DEPOSIT FUNCTIONALITY RESTRICTED';
      case 'trading':
        return 'TRADING FUNCTIONALITY RESTRICTED';
      case 'accountCreation':
        return 'ACCOUNT CREATION FUNCTIONALITY RESTRICTED';
      case 'supportTickets':
        return 'SUPPORT TICKETS FUNCTIONALITY RESTRICTED';
      case 'notifications':
        return 'NOTIFICATIONS FUNCTIONALITY RESTRICTED';
      case 'apiAccess':
        return 'API ACCESS FUNCTIONALITY RESTRICTED';
      case 'dataExport':
        return 'DATA EXPORT FUNCTIONALITY RESTRICTED';
      case 'reporting':
        return 'REPORTING FUNCTIONALITY RESTRICTED';
      default:
        return 'FUNCTIONALITY RESTRICTED';
    }
  };

  const getFunctionalityIcon = () => {
    switch (functionality) {
      case 'withdrawals':
        return <CreditCard className="w-5 h-5 text-red-600" />;
      case 'messaging':
        return <MessageSquareOff className="w-5 h-5 text-red-600" />;
      case 'profileUpdates':
        return <UserX className="w-5 h-5 text-red-600" />;
      case 'deposits':
        return <CreditCard className="w-5 h-5 text-red-600" />;
      case 'trading':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'accountCreation':
        return <UserX className="w-5 h-5 text-red-600" />;
      case 'supportTickets':
        return <MessageSquareOff className="w-5 h-5 text-red-600" />;
      case 'notifications':
        return <MessageSquareOff className="w-5 h-5 text-red-600" />;
      case 'apiAccess':
        return <Lock className="w-5 h-5 text-red-600" />;
      case 'dataExport':
        return <Lock className="w-5 h-5 text-red-600" />;
      case 'reporting':
        return <Shield className="w-5 h-5 text-red-600" />;
      default:
        return <Lock className="w-5 h-5 text-red-600" />;
    }
  };

  const getFunctionalityDescription = () => {
    switch (functionality) {
      case 'withdrawals':
        return 'WITHDRAWAL MANAGEMENT HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR FOR SECURITY REASONS.';
      case 'messaging':
        return 'MESSAGING SYSTEM HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR FOR MAINTENANCE.';
      case 'profileUpdates':
        return 'PROFILE UPDATE FUNCTIONALITY HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR.';
      case 'deposits':
        return 'DEPOSIT FUNCTIONALITY HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR FOR SECURITY REASONS.';
      case 'trading':
        return 'TRADING FUNCTIONALITY HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR FOR MAINTENANCE.';
      case 'accountCreation':
        return 'ACCOUNT CREATION HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR.';
      case 'supportTickets':
        return 'SUPPORT TICKET SYSTEM HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR FOR MAINTENANCE.';
      case 'notifications':
        return 'NOTIFICATION SYSTEM HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR.';
      case 'apiAccess':
        return 'API ACCESS HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR FOR SECURITY REASONS.';
      case 'dataExport':
        return 'DATA EXPORT FUNCTIONALITY HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR.';
      case 'reporting':
        return 'REPORTING FUNCTIONALITY HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR.';
      default:
        return 'THIS FUNCTIONALITY HAS BEEN TEMPORARILY DISABLED BY THE GOVERNOR.';
    }
  };

  if (isEnabled()) {
    return <>{children}</>;
  }

  if (!showFallback) {
    return null;
  }

  const restrictionLevel = getRestrictionLevel();
  const message = fallbackMessage || getFunctionalityDescription();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 relative overflow-hidden"
    >
      <div className="flex items-start space-x-3 relative z-10">
        <div className="flex items-center space-x-3 flex-shrink-0">
          {getFunctionalityIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-red-900 mb-1">
            {getFunctionalityLabel()}
          </h4>
          
          <p className="text-sm leading-relaxed font-medium text-red-800 mb-3">
            {message}
          </p>
          
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-red-600 text-white">
              FULL RESTRICTION
            </span>
            <span className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-gray-600 text-white">
              GOVERNOR CONTROL
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FunctionalityGuard;