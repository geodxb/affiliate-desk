import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Card from '../common/Card';
import { formatCurrency, calculatePercentageChange } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface OverviewCardProps {
  title: string;
  value: number;
  previousValue?: number;
  currency?: string;
  type?: 'currency' | 'percentage' | 'number';
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  previousValue,
  currency = 'USD',
  type = 'currency',
  trend,
  className,
}) => {
  const formatValue = () => {
    switch (type) {
      case 'currency':
        return formatCurrency(value, currency);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const percentageChange = previousValue 
    ? calculatePercentageChange(value, previousValue)
    : null;

  const actualTrend = trend || (percentageChange !== null 
    ? percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral'
    : 'neutral');

  const getTrendColor = () => {
    switch (actualTrend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (actualTrend) {
      case 'up':
        return <TrendingUp className="w-5 h-5" />;
      case 'down':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {formatValue()}
            </p>
            {percentageChange !== null && (
              <p className={cn('text-sm font-medium mt-2 flex items-center space-x-1', getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {Math.abs(percentageChange).toFixed(2)}%
                </span>
                <span className="text-gray-500">
                  vs last period
                </span>
              </p>
            )}
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', {
            'bg-green-100': actualTrend === 'up',
            'bg-red-100': actualTrend === 'down',
            'bg-gray-100': actualTrend === 'neutral',
          })}>
            <div className={getTrendColor()}>
              {getTrendIcon()}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default OverviewCard;