import { ReactNode } from 'react';
import { useSystemControls } from '../../hooks/useSystemControls';
import { AlertTriangle, Lock, Shield, MessageSquareOff, CreditCard, UserX } from 'lucide-react';

interface FunctionalityGuardProps {
  children: ReactNode;
  functionality: 'withdrawals' | 'messaging' | 'profileUpdates';
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
      default:
        return true;
    }
  };

  const getFunctionalityLabel = () => {
    switch (functionality) {
      case 'withdrawals':
        return 'WITHDRAWAL FUNCTIONALITY';
      case 'messaging':
        return 'MESSAGING SYSTEM';
      case 'profileUpdates':
        return 'PROFILE UPDATES';
      default:
        return 'FUNCTIONALITY';
    }
  };

  const getFunctionalityIcon = () => {
    switch (functionality) {
      case 'withdrawals':
        return <CreditCard className="w-5 h-5 text-red-600" />;
      case 'messaging':
        return <MessageSquareOff className="w-5 h-5 text-amber-600" />;
      case 'profileUpdates':
        return <UserX className="w-5 h-5 text-purple-600" />;
      default:
        return <Lock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isEnabled()) {
    return <>{children}</>;
  }

  if (!showFallback) {
    return null;
  }

  const restrictionLevel = getRestrictionLevel();
  const message = fallbackMessage || getRestrictionMessage();

  const getBannerStyles = () => {
    switch (restrictionLevel) {
      case 'full':
        return 'bg-red-600 bg-opacity-90 border-red-700 border-opacity-60 text-white';
      case 'partial':
        return 'bg-amber-600 bg-opacity-90 border-amber-700 border-opacity-60 text-white';
      default:
        return 'bg-blue-600 bg-opacity-90 border-blue-700 border-opacity-60 text-white';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'border rounded-lg p-4 shadow-sm relative overflow-hidden mb-6',
        getBannerStyles()
      )}
    >
      {/* Full restriction animation */}
      {restrictionLevel === 'full' && (
        <motion.div
          className="absolute inset-0 bg-red-800 opacity-10"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className="flex items-start space-x-3 relative z-10">
        <div className="flex items-center space-x-3 flex-shrink-0">
          {getFunctionalityIcon()}
          <div className="px-2 py-1 text-xs font-bold rounded uppercase tracking-wider bg-white bg-opacity-20 text-white border border-white border-opacity-30">
            {restrictionLevel.toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-1">
            {getFunctionalityLabel()} RESTRICTED
          </h4>
          
          <p className="text-sm leading-relaxed font-medium text-white opacity-90">
            {message}
          </p>
          
          <div className="mt-3 text-xs opacity-80 font-medium text-white">
            <span>System Administrator</span>
            <span className="ml-2">• Restriction Level: {restrictionLevel.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FunctionalityGuard;