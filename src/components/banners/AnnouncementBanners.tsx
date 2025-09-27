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
      return 'bg-red-600 border-red-700 text-white';
    }
    
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'maintenance':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📢';
      case 'low':
      default:
        return 'ℹ️';
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
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Icon className={cn(
                    'w-5 h-5 mt-0.5',
                    isUrgent ? 'text-white' : ''
                  )} />
                  <span className="text-lg">{getPriorityIndicator(banner.priority)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={cn(
                      'text-sm font-bold uppercase tracking-wide',
                      isUrgent ? 'text-white' : ''
                    )}>
                      {banner.title}
                    </h4>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium uppercase',
                      isUrgent 
                        ? 'bg-white bg-opacity-20 text-white' 
                        : 'bg-black bg-opacity-10'
                    )}>
                      {banner.priority}
                    </span>
                  </div>
                  
                  <p className={cn(
                    'text-sm leading-relaxed',
                    isUrgent ? 'text-white' : ''
                  )}>
                    {banner.message}
                  </p>
                  
                  {/* Banner metadata */}
                  <div className={cn(
                    'mt-2 text-xs opacity-75',
                    isUrgent ? 'text-white' : ''
                  )}>
                    <span>Created by {banner.createdByName}</span>
                    {banner.endDate && (
                      <span className="ml-2">
                        • Expires: {banner.endDate.toLocaleDateString()}
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