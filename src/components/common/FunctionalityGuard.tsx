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
    isWithdrawalsEnabled, 
    isMessagingEnabled, 
    isProfileUpdatesEnabled,
    getRestrictionMessage,
    getRestrictionLevel 
  } = useSystemControls();

  const isEnabled = () => {
    switch (functionality) {
      case 'withdrawals':
        return isWithdrawalsEnabled();
      case 'messaging':
        return isMessagingEnabled();
      case 'profileUpdates':
        return isProfileUpdatesEnabled();
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

  return (
    <div className={`rounded-lg border-l-4 p-6 ${
      restrictionLevel === 'full' ? 'bg-red-50 border-red-500 border border-red-200' :
      restrictionLevel === 'partial' ? 'bg-amber-50 border-amber-500 border border-amber-200' :
      'bg-blue-50 border-blue-500 border border-blue-200'
    }`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 mt-1">
          {getFunctionalityIcon()}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold text-gray-900 mb-2 ${
            restrictionLevel === 'full' ? 'text-red-800' :
            restrictionLevel === 'partial' ? 'text-amber-800' :
            'text-blue-800'
          }`}>
            {getFunctionalityLabel()} RESTRICTED
          </h3>
          <p className={`text-sm leading-relaxed font-medium mb-3 ${
            restrictionLevel === 'full' ? 'text-red-700' :
            restrictionLevel === 'partial' ? 'text-amber-700' :
            'text-blue-700'
          }`}>
            {message}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              restrictionLevel === 'full' ? 'bg-red-100 text-red-800' :
              restrictionLevel === 'partial' ? 'bg-amber-100 text-amber-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {restrictionLevel.toUpperCase()} RESTRICTION
            </span>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">
              <Shield className="w-3 h-3 mr-1 inline" />
              SYSTEM CONTROL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionalityGuard;