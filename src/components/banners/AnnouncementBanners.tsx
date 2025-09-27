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

  const getBannerTitle = (banner: AnnouncementBanner) => {
    return `${banner.title.toUpperCase()}`;
  };

  if (visibleBanners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {visibleBanners.map((banner, index) => {
          const Icon = getBannerIcon(banner.type);
          
          return (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 relative overflow-hidden"
            >
              <div className="flex items-start space-x-3 relative z-10">
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <Icon className="w-5 h-5 text-red-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-red-900 mb-1">
                    {getBannerTitle(banner)}
                  </h4>
                  
                  <p className="text-sm leading-relaxed font-medium text-red-800 mb-3">
                    {banner.message}
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-red-600 text-white">
                      {getPriorityIndicator(banner.priority)} PRIORITY
                    </span>
                    <span className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-gray-600 text-white">
                      SYSTEM ANNOUNCEMENT
                    </span>
                  </div>
                  
                  {banner.endDate && (
                    <div className="mt-2 text-xs text-red-700 font-medium">
                      Valid until: {banner.endDate.toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleDismiss(banner.id)}
                  className="flex-shrink-0 p-1 hover:bg-red-100 rounded-lg transition-colors text-red-600"
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