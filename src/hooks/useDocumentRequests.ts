import { useState, useEffect } from 'react';
import { documentRequestService } from '../services/documentRequestService';
import { DocumentRequest } from '../types/documentRequest';
import { useAuth } from '../contexts/AuthContext';

export const useDocumentRequests = () => {
  const { currentUser } = useAuth();
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    console.log('=== SETTING UP DOCUMENT REQUESTS HOOK ===');
    console.log('User ID:', currentUser.uid);

    const unsubscribe = documentRequestService.subscribeToUserDocumentRequests(
      currentUser.uid,
      (requests) => {
        console.log('Document requests updated:', requests);
        setDocumentRequests(requests);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  const dismissDocumentRequest = (requestId: string) => {
    setDocumentRequests((prev) =>
      prev.filter((request) => request.id !== requestId)
    );
  };

  const pendingCount = documentRequestService.getPendingRequestsCount(
    documentRequests
  );
  const urgentRequests = documentRequestService.getUrgentRequests(
    documentRequests
  );

  return {
    documentRequests,
    loading,
    dismissDocumentRequest,
    pendingCount,
    urgentRequests,
  };
};
