import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DocumentRequest } from '../types/documentRequest';

export const documentRequestService = {
  subscribeToUserDocumentRequests(
    userId: string,
    callback: (requests: DocumentRequest[]) => void
  ): () => void {
    try {
      console.log('=== SUBSCRIBING TO DOCUMENT REQUESTS ===');
      console.log('User ID:', userId);

      const requestsQuery = query(
        collection(db, 'documentRequests'),
        where('investorId', '==', userId)
      );

      return onSnapshot(
        requestsQuery,
        (snapshot) => {
          console.log('Document requests subscription update - found', snapshot.docs.length, 'documents');

          const requests = snapshot.docs.map((doc) => ({
            id: doc.id,
            investorId: doc.data().investorId || userId,
            investorName: doc.data().investorName || '',
            investorEmail: doc.data().investorEmail || '',
            documentType: doc.data().documentType || '',
            description: doc.data().description || '',
            reason: doc.data().reason || '',
            priority: doc.data().priority || 'medium',
            status: doc.data().status || 'pending',
            requestedAt: doc.data().requestedAt?.toDate() || new Date(),
            requestedBy: doc.data().requestedBy || '',
            dueDate: doc.data().dueDate?.toDate(),
            submittedAt: doc.data().submittedAt?.toDate(),
            completedAt: doc.data().completedAt?.toDate(),
            notes: doc.data().notes || '',
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as DocumentRequest[];

          requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          console.log('Processed document requests:', requests);
          callback(requests);
        },
        (error) => {
          console.error('Error in document requests subscription:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up document requests subscription:', error);
      return () => {};
    }
  },

  getPendingRequestsCount(requests: DocumentRequest[]): number {
    return requests.filter((req) => req.status === 'pending').length;
  },

  getUrgentRequests(requests: DocumentRequest[]): DocumentRequest[] {
    return requests.filter(
      (req) => req.status === 'pending' && (!req.dueDate || req.dueDate <= new Date())
    );
  },
};
