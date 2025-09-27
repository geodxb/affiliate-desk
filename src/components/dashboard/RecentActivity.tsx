import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import Card from '../common/Card';
import { Transaction } from '../../types/transaction';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface RecentActivityProps {
  transactions: Transaction[];
  loading?: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ transactions, loading }) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                  <div className="h-3 bg-gray-300 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bonus':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'withdrawal':
      case 'fee':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bonus':
        return 'bg-green-100';
      case 'withdrawal':
      case 'fee':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bonus':
        return 'text-green-600';
      case 'withdrawal':
      case 'fee':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = ['withdrawal', 'fee'].includes(type) ? '-' : '+';
    return `${prefix}${formatCurrency(Math.abs(amount))}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-6">
          Recent Activity
        </h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getTransactionColor(transaction.type))}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate capitalize">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-semibold', getAmountColor(transaction.type))}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {transaction.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default RecentActivity;