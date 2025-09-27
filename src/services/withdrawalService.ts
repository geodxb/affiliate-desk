import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WithdrawalRequest } from '../types/withdrawal';
import { WITHDRAWAL_CONFIG } from '../lib/constants';

export const withdrawalService = {
  async createWithdrawalRequest(
    userId: string,
    amount: number,
    type: 'bank' | 'crypto',
    destinationId: string,
    destinationDetails: any
  ): Promise<string | null> {
    try {
      console.log('=== CREATING WITHDRAWAL REQUEST ===');
      console.log('User ID:', userId);
      console.log('Amount:', amount);
      console.log('Type:', type);
      console.log('Destination ID:', destinationId);
      console.log('Destination Details:', destinationDetails);
      
      const platformFee = amount * (WITHDRAWAL_CONFIG.PLATFORM_FEE_PERCENTAGE / 100);
      const netAmount = amount - platformFee;

      const withdrawalRequest: Omit<WithdrawalRequest, 'id'> = {
        investorId: userId,
        investorName: '',
        investorEmail: '',
        amount,
        currency: 'USD',
        type,
        destination: destinationId,
        destinationDetails,
        platformFee,
        netAmount,
        status: 'pending',
        progress: 0,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        createdAt: new Date(),
        updatedAt: new Date(),
        requestedBy: 'investor',
      };

      // Get user profile to populate investor details
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          withdrawalRequest.investorName = userData.name || '';
          withdrawalRequest.investorEmail = userData.email || '';
        }
      } catch (error) {
        console.log('Could not fetch user details for withdrawal request');
      }

      console.log('Withdrawal request object:', withdrawalRequest);
      
      const docRef = await addDoc(collection(db, 'withdrawalRequests'), {
        ...withdrawalRequest,
        date: withdrawalRequest.date,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log('Withdrawal request created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create withdrawal request:', error);
      return null;
    }
  },

  async getWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
    try {
      console.log('=== FETCHING WITHDRAWALS FOR USER ===');
      console.log('User ID:', userId);
      
      const withdrawalsQuery = query(
        collection(db, 'withdrawalRequests'),
        where('investorId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(withdrawalsQuery);
      console.log('Found', snapshot.docs.length, 'withdrawal documents');
      
      const withdrawals = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing withdrawal document:', doc.id);
        console.log('Raw data:', data);
        
        return {
          id: doc.id,
          investorId: data.investorId || userId,
          investorName: data.investorName || '',
          investorEmail: data.investorEmail || '',
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          type: data.type || 'bank',
          destination: data.destination || '',
          destinationDetails: data.destinationDetails || {},
          platformFee: data.platformFee || 0,
          netAmount: data.netAmount || 0,
          status: data.status || 'pending',
          progress: data.progress || 0,
          date: data.date || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
          approvalDate: data.approvalDate?.toDate(),
          processedBy: data.processedBy || '',
          reason: data.reason || '',
          notes: data.notes || '',
          transactionHash: data.transactionHash || '',
          mt103Generated: data.mt103Generated || false,
          mt103GeneratedAt: data.mt103GeneratedAt?.toDate(),
          mt103DocumentUrl: data.mt103DocumentUrl || '',
          w8benStatus: data.w8benStatus || '',
          w8benSubmittedAt: data.w8benSubmittedAt?.toDate(),
          w8benDocumentUrl: data.w8benDocumentUrl || '',
          requestedBy: data.requestedBy || 'investor',
          hashGeneratedAt: data.hashGeneratedAt?.toDate(),
          hashGeneratedBy: data.hashGeneratedBy || '',
          hashStatus: data.hashStatus || '',
          sentToBlockchainAt: data.sentToBlockchainAt?.toDate(),
          sentToBlockchainBy: data.sentToBlockchainBy || '',
        };
      }) as WithdrawalRequest[];
      
      console.log('Processed withdrawals:', withdrawals);
      return withdrawals;
    } catch (error) {
      console.error('Failed to fetch withdrawal requests:', error);
      return [];
    }
  },

  async searchByField(
    collectionName: string, 
    fieldName: string, 
    fieldValue: string, 
    allWithdrawals: WithdrawalRequest[], 
    userProfile: any
  ): Promise<void> {
    try {
      const searchQuery = query(
        collection(db, collectionName),
        where(fieldName, '==', fieldValue)
      );
    } catch (error) {
      console.error('Failed to search by field:', error);
    }
  },

  subscribeToWithdrawals(userId: string, callback: (withdrawals: WithdrawalRequest[]) => void): () => void {
    // Use the available index: investorId + createdAt
    try {
      console.log('=== SUBSCRIBING TO WITHDRAWALS ===');
      console.log('User ID:', userId);
      
      const withdrawalsQuery = query(
        collection(db, 'withdrawalRequests'),
        where('investorId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(withdrawalsQuery, (snapshot) => {
        console.log('Withdrawal subscription update - found', snapshot.docs.length, 'documents');
        
        const withdrawals = snapshot.docs.map(doc => ({
          id: doc.id,
          investorId: doc.data().investorId || userId,
          investorName: doc.data().investorName || '',
          investorEmail: doc.data().investorEmail || '',
          amount: doc.data().amount || 0,
          currency: doc.data().currency || 'USD',
          type: doc.data().type || 'bank',
          destination: doc.data().destination || '',
          destinationDetails: doc.data().destinationDetails || {},
          platformFee: doc.data().platformFee || 0,
          netAmount: doc.data().netAmount || 0,
          status: doc.data().status || 'pending',
          progress: doc.data().progress || 0,
          date: doc.data().date || '',
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          processedAt: doc.data().processedAt?.toDate(),
          approvalDate: doc.data().approvalDate?.toDate(),
          processedBy: doc.data().processedBy || '',
          reason: doc.data().reason || '',
          notes: doc.data().notes || '',
          transactionHash: doc.data().transactionHash || '',
          mt103Generated: doc.data().mt103Generated || false,
          mt103GeneratedAt: doc.data().mt103GeneratedAt?.toDate(),
          mt103DocumentUrl: doc.data().mt103DocumentUrl || '',
          w8benStatus: doc.data().w8benStatus || '',
          w8benSubmittedAt: doc.data().w8benSubmittedAt?.toDate(),
          w8benDocumentUrl: doc.data().w8benDocumentUrl || '',
          requestedBy: doc.data().requestedBy || 'investor',
          hashGeneratedAt: doc.data().hashGeneratedAt?.toDate(),
          hashGeneratedBy: doc.data().hashGeneratedBy || '',
          hashStatus: doc.data().hashStatus || '',
          sentToBlockchainAt: doc.data().sentToBlockchainAt?.toDate(),
          sentToBlockchainBy: doc.data().sentToBlockchainBy || '',
        })) as WithdrawalRequest[];
        
        console.log('Processed withdrawal data:', withdrawals);
        callback(withdrawals);
      }, (error) => {
        console.error('Error in withdrawals subscription:', error);
        // Try fallback with date index
        try {
          const fallbackQuery = query(
            collection(db, 'withdrawalRequests'),
            where('investorId', '==', userId),
            orderBy('date', 'desc')
          );
          
          return onSnapshot(fallbackQuery, (snapshot) => {
            console.log('Fallback query - found', snapshot.docs.length, 'documents');
            const withdrawals = snapshot.docs.map(doc => ({
              id: doc.id,
              investorId: doc.data().investorId || userId,
              investorName: doc.data().investorName || '',
              investorEmail: doc.data().investorEmail || '',
              amount: doc.data().amount || 0,
              currency: doc.data().currency || 'USD',
              type: doc.data().type || 'bank',
              destination: doc.data().destination || '',
              destinationDetails: doc.data().destinationDetails || {},
              platformFee: doc.data().platformFee || 0,
              netAmount: doc.data().netAmount || 0,
              status: doc.data().status || 'pending',
              progress: doc.data().progress || 0,
              date: doc.data().date || '',
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
              processedAt: doc.data().processedAt?.toDate(),
              approvalDate: doc.data().approvalDate?.toDate(),
              processedBy: doc.data().processedBy || '',
              reason: doc.data().reason || '',
              notes: doc.data().notes || '',
              transactionHash: doc.data().transactionHash || '',
              mt103Generated: doc.data().mt103Generated || false,
              mt103GeneratedAt: doc.data().mt103GeneratedAt?.toDate(),
              mt103DocumentUrl: doc.data().mt103DocumentUrl || '',
              w8benStatus: doc.data().w8benStatus || '',
              w8benSubmittedAt: doc.data().w8benSubmittedAt?.toDate(),
              w8benDocumentUrl: doc.data().w8benDocumentUrl || '',
              requestedBy: doc.data().requestedBy || 'investor',
              hashGeneratedAt: doc.data().hashGeneratedAt?.toDate(),
              hashGeneratedBy: doc.data().hashGeneratedBy || '',
              hashStatus: doc.data().hashStatus || '',
              sentToBlockchainAt: doc.data().sentToBlockchainAt?.toDate(),
              sentToBlockchainBy: doc.data().sentToBlockchainBy || '',
            })) as WithdrawalRequest[];
            
            callback(withdrawals);
          });
        } catch (fallbackError) {
          console.error('Fallback withdrawal query failed:', fallbackError);
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error setting up withdrawals subscription:', error);
      // Return empty unsubscribe function
      return () => {};
    }
  },

  async generateMT103(withdrawalId: string): Promise<boolean> {
    try {
      // Create MT103 document record
      const mt103Data = {
        withdrawalId,
        documentType: 'MT103',
        generatedAt: Timestamp.now(),
        status: 'generated',
        documentUrl: '', // This would be populated by a backend service
        swiftMessageType: 'MT103',
        messageReference: `MT103-${withdrawalId}-${Date.now()}`,
      };

      // Add to mt103Documents collection
      await addDoc(collection(db, 'mt103Documents'), mt103Data);

      // Update withdrawal request to indicate MT103 was generated
      await updateDoc(doc(db, 'withdrawalRequests', withdrawalId), {
        mt103Generated: true,
        mt103GeneratedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error('Failed to generate MT103:', error);
      return false;
    }
  },

  calculateWithdrawalBreakdown(amount: number) {
    const platformFee = amount * (WITHDRAWAL_CONFIG.PLATFORM_FEE_PERCENTAGE / 100);
    const netAmount = amount - platformFee;
    
    return {
      amount,
      platformFee,
      netAmount,
      feePercentage: WITHDRAWAL_CONFIG.PLATFORM_FEE_PERCENTAGE,
    };
  },

  validateWithdrawalAmount(amount: number, availableBalance: number): { valid: boolean; error?: string } {
    if (amount < WITHDRAWAL_CONFIG.MIN_WITHDRAWAL_AMOUNT) {
      return {
        valid: false,
        error: `Minimum withdrawal amount is $${WITHDRAWAL_CONFIG.MIN_WITHDRAWAL_AMOUNT}`,
      };
    }

    if (amount > WITHDRAWAL_CONFIG.MAX_WITHDRAWAL_AMOUNT) {
      return {
        valid: false,
        error: `Maximum withdrawal amount is $${WITHDRAWAL_CONFIG.MAX_WITHDRAWAL_AMOUNT}`,
      };
    }

    if (amount > availableBalance) {
      return {
        valid: false,
        error: 'Insufficient balance',
      };
    }

    return { valid: true };
  },
};