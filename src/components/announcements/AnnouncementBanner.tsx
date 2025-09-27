import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Announcement } from '../../types/common';
import { cn } from '../../lib/utils';

interface AnnouncementBannerProps {
  announcements: Announcement[];
  onDismiss?: (announcementId: string) => void;
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ 
  announcements, 
  onDismiss 
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedIds.has(announcement.id)
  );

  const handleDismiss = (announcementId: string) => {
    setDismissedIds(prev => new Set([...prev, announcementId]));
    onDismiss?.(announcementId);
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getAnnouncementColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {visibleAnnouncements.map((announcement, index) => {
          const Icon = getAnnouncementIcon(announcement.type);
          
          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'border rounded-lg p-4 shadow-sm',
                getAnnouncementColors(announcement.type)
              )}
            >
              <div className="flex items-start space-x-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold uppercase tracking-wide mb-1">
                    {announcement.title}
                  </h4>
                  <p className="text-sm leading-relaxed">
                    {announcement.content}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(announcement.id)}
                  className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
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

export default AnnouncementBanner;