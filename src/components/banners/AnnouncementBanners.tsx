import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Megaphone, Settings } from 'lucide-react';
import { AnnouncementBanner } from '../../types/banner';
import { cn } from '../../lib/utils';

interface AnnouncementBannersProps {
  banners: AnnouncementBanner[];
  onDismiss?: (bannerId: string) => void;
}

const AnnouncementBanners: React.FC<AnnouncementBannersProps> = ({ 
  banners, 
  onDismiss 
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  const visibleBanners = banners.filter(
    banner => !dismissedIds.has(banner.id)
  );

  const handleDismiss = (bannerId: string) => {
    setDismissedIds(prev => new Set([...prev, bannerId]));
    onDismiss?.(bannerId);
  };

  const getBannerIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'maintenance':
        return Settings;
      case 'info':
      default:
        return Info;
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'URGENT';
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      case 'low':
      default:
        return 'LOW';
    }
  };

  if (visibleBanners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {visibleBanners.map((banner, index) => {
          const Icon = getBannerIcon(banner.type);
          const isUrgent = banner.priority === 'urgent';
          
          return (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'bg-black border border-gray-800 rounded-lg p-4 mb-6 relative overflow-hidden',
              )}
            >
              {/* Urgent banner animation */}
              {isUrgent && (
                <motion.div
                  className="absolute inset-0 bg-red-800 opacity-10"
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              <div className="flex items-start space-x-3 relative z-10">
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                  <div className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                    {getPriorityIndicator(banner.priority)}
                  </div>
                  <div className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-gray-600 bg-opacity-60 text-white border border-gray-500 border-opacity-40">
                    ANNOUNCEMENT
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-1">
                    {banner.title}
                  </h4>
                  
                  <p className="text-sm leading-relaxed font-medium text-white opacity-90">
                    {banner.message}
                  </p>
                  
                  <div className="mt-2 text-xs text-white opacity-80 font-medium">
                    <span>System Administrator</span>
                    {banner.endDate && (
                      <span className="ml-2">
                        • Valid until: {banner.endDate.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDismiss(banner.id)}
                  className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanners;