import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Clock } from 'lucide-react';
import { DocumentRequest } from '../../types/documentRequest';
import { formatDate } from '../../lib/utils';

interface DocumentRequestBannerProps {
  requests: DocumentRequest[];
  onDismiss?: (requestId: string) => void;
}

const DocumentRequestBanner: React.FC<DocumentRequestBannerProps> = ({
  requests,
  onDismiss,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleRequests = requests.filter((req) => !dismissedIds.has(req.id));

  const handleDismiss = (requestId: string) => {
    setDismissedIds((prev) => new Set([...prev, requestId]));
    onDismiss?.(requestId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-50 border-orange-200';
      case 'submitted':
        return 'bg-blue-50 border-blue-200';
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-orange-900';
      case 'submitted':
        return 'text-blue-900';
      case 'approved':
        return 'text-green-900';
      case 'rejected':
        return 'text-red-900';
      default:
        return 'text-gray-900';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-600 text-white';
      case 'submitted':
        return 'bg-blue-600 text-white';
      case 'approved':
        return 'bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const isOverdue = (request: DocumentRequest) => {
    return (
      request.dueDate &&
      request.dueDate <= new Date() &&
      request.status === 'pending'
    );
  };

  if (visibleRequests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {visibleRequests.map((request, index) => {
          const overdue = isOverdue(request);

          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-4 mb-4 relative overflow-hidden ${getStatusColor(
                request.status
              )}`}
            >
              <div className="flex items-start space-x-3 relative z-10">
                <div className="flex-shrink-0 pt-1">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-semibold uppercase tracking-wider mb-1 ${getStatusTextColor(
                      request.status
                    )}`}
                  >
                    Document Request: {request.documentType}
                  </h4>

                  <p
                    className={`text-sm leading-relaxed font-medium mb-2 ${getStatusTextColor(
                      request.status
                    )}`}
                  >
                    {request.description}
                  </p>

                  {request.reason && (
                    <p className="text-xs text-gray-600 mb-2">
                      Reason: {request.reason}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded uppercase tracking-wider ${getStatusBadgeColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>

                    {request.priority && (
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded uppercase tracking-wider ${
                          request.priority === 'high'
                            ? 'bg-red-600 text-white'
                            : request.priority === 'medium'
                            ? 'bg-orange-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {request.priority} PRIORITY
                      </span>
                    )}

                    {request.dueDate && (
                      <span
                        className={`flex items-center space-x-1 px-3 py-1 text-xs font-bold rounded uppercase tracking-wider ${
                          overdue
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>
                          Due: {formatDate(request.dueDate).split(' ')[0]}
                        </span>
                      </span>
                    )}

                    {overdue && (
                      <span className="px-3 py-1 text-xs font-bold rounded uppercase tracking-wider bg-red-600 text-white">
                        OVERDUE
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(request.id)}
                  className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                    request.status === 'pending'
                      ? 'hover:bg-orange-100 text-orange-600'
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
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

export default DocumentRequestBanner;
