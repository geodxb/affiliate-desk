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

  const getBannerColors = (type: string, priority: string) => {
    if (priority === 'urgent') {
      return 'bg-red-600 bg-opacity-90 border-red-700 border-opacity-60 text-white';
    }
    
    switch (type) {
      case 'critical':
        return 'bg-red-50 bg-opacity-70 border-red-200 border-opacity-50 text-red-700';
      case 'warning':
        return 'bg-amber-50 bg-opacity-60 border-amber-200 border-opacity-40 text-amber-700';
      case 'maintenance':
        return 'bg-purple-50 bg-opacity-60 border-purple-200 border-opacity-40 text-purple-700';
      case 'info':
      default:
        return 'bg-blue-50 bg-opacity-60 border-blue-200 border-opacity-40 text-blue-700';
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
                'border rounded-lg p-4 shadow-sm relative overflow-hidden',
                getBannerColors(banner.type, banner.priority)
              )}
            >
              {/* Urgent banner animation */}
              {isUrgent && (
                <motion.div
                  className="absolute inset-0 bg-red-700 opacity-10"
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              <div className="flex items-start space-x-3 relative z-10">
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <Icon className={cn(
                    'w-5 h-5 mt-0.5',
                    isUrgent ? 'text-white' : ''
                  )} />
                  <div className={cn(
                    'px-2 py-1 text-xs font-bold rounded uppercase tracking-wider',
                    isUrgent 
                      ? 'bg-white bg-opacity-20 text-white border border-white border-opacity-30' 
                      : 'bg-black bg-opacity-10 text-current border border-current border-opacity-20'
                  )}>
                    {getPriorityIndicator(banner.priority)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={cn(
                      'text-sm font-semibold uppercase tracking-wider',
                      isUrgent ? 'text-white' : ''
                    )}>
                      {banner.title}
                    </h4>
                  </div>
                  
                  <p className={cn(
                    'text-sm leading-relaxed font-medium',
                    isUrgent ? 'text-white' : ''
                  )}>
                    {banner.message}
                  </p>
                  
                  {/* Banner metadata */}
                  <div className={cn(
                    'mt-3 text-xs opacity-80 font-medium',
                    isUrgent ? 'text-white' : ''
                  )}>
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
                  className={cn(
                    'flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors',
                    isUrgent ? 'text-white hover:bg-white hover:bg-opacity-20' : ''
                  )}
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