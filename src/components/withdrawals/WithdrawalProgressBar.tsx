import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Send, CreditCard, X } from 'lucide-react';
import { WithdrawalRequest } from '../../types/withdrawal';
import { cn } from '../../lib/utils';

interface WithdrawalProgressBarProps {
  withdrawal: WithdrawalRequest;
  className?: string;
}

const WithdrawalProgressBar: React.FC<WithdrawalProgressBarProps> = ({ 
  withdrawal, 
  className 
}) => {
  const getProgressBarColor = (status: string, isRejected: boolean): string => {
    if (isRejected) return 'bg-red-500';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
      case 'credited':
      case 'complete':
      case 'completed':
        return 'bg-blue-500';
      case 'refunded':
        return 'bg-purple-500';
      case 'rejected':
        return 'bg-red-500';
      case 'sent_to_blockchain':
      case 'sent':
      case 'processing':
        return 'bg-orange-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const steps = [
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'approved', label: 'Approved', icon: Check },
    ...(withdrawal.type === 'crypto' 
      ? [{ id: 'sent_to_blockchain', label: 'Sent to Blockchain', icon: Send }]
      : []
    ),
    { id: 'credited', label: 'Credited', icon: CreditCard },
  ];

  const getStepIndex = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    return steps.findIndex(step => step.id === normalizedStatus);
  };

  const normalizedStatus = withdrawal.status.toLowerCase();
  const isRejected = ['rejected', 'refunded', 'cancelled', 'canceled'].includes(normalizedStatus);
  
  const currentStepIndex = isRejected ? -1 : getStepIndex(normalizedStatus);

  // Calculate progress percentage based on current step
  const calculateProgress = () => {
    if (isRejected) return 0;
    
    const stepProgress = {
      'pending': 25,
      'approved': 50,
      'processing': 75,
      'sent_to_blockchain': 75,
      'sent': 75,
      'credited': 100,
      'complete': 100,
      'completed': 100
    };
    
    return stepProgress[normalizedStatus] || withdrawal.progress || 0;
  };
  
  const progressPercentage = calculateProgress();

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex || 
            (index === currentStepIndex && withdrawal.status !== 'pending');
          const isCurrent = index === currentStepIndex && !isRejected;
          const isUpcoming = index > currentStepIndex && !isRejected;

          return (
            <div key={step.id} className="flex flex-col items-center relative flex-1">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  'absolute top-5 left-1/2 w-full h-0.5 -z-10',
                  isCompleted || (isCurrent && index < currentStepIndex) 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                )} />
              )}
              
              {/* Step circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2',
                  {
                    'bg-green-500 border-green-500 text-white': isCompleted,
                    'bg-blue-500 border-blue-500 text-white animate-pulse': isCurrent,
                    'bg-white border-gray-300 text-gray-400': isUpcoming,
                    'bg-red-500 border-red-500 text-white': isRejected && isCurrent,
                  }
                )}
              >
                {isRejected && isCurrent ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </motion.div>
              
              {/* Step label */}
              <span className={cn(
                'text-xs font-medium text-center',
                {
                  'text-green-600': isCompleted,
                  'text-blue-600': isCurrent && !isRejected,
                  'text-gray-500': isUpcoming,
                  'text-red-600': isRejected && isCurrent,
                }
              )}>
                {isRejected && isCurrent ? 
                  (withdrawal.status === 'Refunded' || withdrawal.status === 'refunded' ? 'Refunded' : 
                   withdrawal.status === 'cancelled' || withdrawal.status === 'Cancelled' || withdrawal.status === 'canceled' || withdrawal.status === 'Canceled' ? 'Cancelled' : 'Rejected')
                  : step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress percentage */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              getProgressBarColor(withdrawal.status, isRejected)
            )}
          />
        </div>
      </div>

      {/* Notes */}
      {withdrawal.notes && (
        <div className="mt-3">
          <p className="text-xs text-gray-600">{withdrawal.notes}</p>
        </div>
      )}
    </div>
  );
};

export default WithdrawalProgressBar;