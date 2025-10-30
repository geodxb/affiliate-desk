import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Investor, BankAccount, CryptoWallet, User } from '../types/user';
import { Transaction } from '../types/transaction';
import { WithdrawalRequest } from '../types/withdrawal';
import { generateId } from '../lib/utils';

export const firestoreService = {
  async getInvestorProfile(userId: string): Promise<Investor | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Extract bank accounts from bankDetails field
        const bankAccounts: BankAccount[] = [];
        if (userData.bankDetails) {
          bankAccounts.push({
            id: 'bank_main',
            accountName: userData.bankDetails.accountHolderName || userData.name || '',
            accountNumber: userData.bankDetails.accountNumber || '',
            bankName: userData.bankDetails.bankName || '',
            swiftCode: userData.bankDetails.swiftCode || '',
            iban: userData.bankDetails.iban || '',
            routingNumber: userData.bankDetails.routingNumber || '',
            country: userData.country || 'Mexico',
            currency: userData.bankDetails.currency || 'USD',
            isPrimary: true,
            status: userData.bankDetails.verificationStatus || 'pending',
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          });
        }

        // Extract crypto wallets from cryptoWallets array
        const cryptoWallets: CryptoWallet[] = [];
        if (userData.cryptoWallets && Array.isArray(userData.cryptoWallets)) {
          userData.cryptoWallets.forEach((wallet: any) => {
            cryptoWallets.push({
              id: wallet.id || generateId(),
              address: wallet.walletAddress || wallet.address || '',
              network: wallet.networkType || wallet.network || '',
              coinType: wallet.coinType || '',
              qrCode: wallet.qrCodeData || wallet.qrCode,
              label: wallet.label || `${wallet.coinType} Wallet`,
              isPrimary: wallet.isPrimary || false,
              status: wallet.verificationStatus || wallet.status || 'approved',
              createdAt: wallet.createdAt?.toDate() || new Date(),
              updatedAt: wallet.updatedAt?.toDate() || new Date(),
            });
          });
        }

        const investor: Investor = {
          id: userId,
          email: userData.email || '',
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
          phoneNumber: userData.phone || '',
          country: userData.country || '',
          location: userData.location || '',
          role: userData.role || 'investor',
          accountType: userData.accountType || 'Basic',
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          balance: userData.currentBalance || 0,
          initialDeposit: userData.initialDeposit || 0,
          isActive: userData.isActive !== false,
          kycStatus: userData.verification?.status || 'approved',
          bankAccounts,
          cryptoWallets,
          performanceData: [],
          accountClosureRequest: userData.accountClosureRequest,
        };

        return investor;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch investor profile:', error);
      return null;
    }
  },

  async getTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    try {
      const allTransactions: Transaction[] = [];
      
      // Get user profile for cross-referencing
      const userDoc = await getDoc(doc(db, 'users', userId));
      let userProfile = null;
      if (userDoc.exists()) {
        userProfile = userDoc.data();
      }

      // Priority collections for faster loading
      const priorityCollections = [
        'transactions',
        'userTransactions'
      ];

      for (const collectionName of priorityCollections) {
        try {
          // Search by investorId
          let transactionsQuery = query(
            collection(db, collectionName),
            where('investorId', '==', userId),
            orderBy('createdAt', 'desc')
          );
          
          if (limit) {
            transactionsQuery = query(transactionsQuery);
          }

          const snapshot = await getDocs(transactionsQuery);
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            allTransactions.push({
              id: doc.id,
              investorId: data.investorId || userId,
              type: data.type || data.transactionType || 'trade',
              amount: data.amount || data.transactionAmount || 0,
              currency: data.currency || 'USD',
              description: data.description || data.note || data.memo || `${data.type || 'Transaction'}`,
              status: data.status || data.transactionStatus || 'completed',
              createdAt: data.createdAt?.toDate() || data.timestamp?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              reference: data.reference || data.transactionId || doc.id,
              metadata: data.metadata || {}
            });
          });

        } catch (error) {
          // Continue to next collection
        }
      }

      // Sort by date and apply limit
      const sortedTransactions = allTransactions.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      return limit ? sortedTransactions.slice(0, limit) : sortedTransactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  },

  async getWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
    try {
      const withdrawalsQuery = query(
        collection(db, 'withdrawalRequests'),
        where('investorId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(withdrawalsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        processedAt: doc.data().processedAt?.toDate(),
        mt103GeneratedAt: doc.data().mt103GeneratedAt?.toDate(),
      })) as WithdrawalRequest[];
    } catch (error) {
      console.error('Failed to fetch withdrawal requests:', error);
      return [];
    }
  },


  subscribeToUserProfile(userId: string, callback: (profile: Investor | null) => void): () => void {
    const userDocRef = doc(db, 'users', userId);
    
    return onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        
        // Extract bank accounts from bankDetails field
        const bankAccounts: BankAccount[] = [];
        if (userData.bankDetails) {
          bankAccounts.push({
            id: 'bank_main',
            accountName: userData.bankDetails.accountHolderName || userData.name || '',
            accountNumber: userData.bankDetails.accountNumber || '',
            bankName: userData.bankDetails.bankName || '',
            swiftCode: userData.bankDetails.swiftCode || '',
            iban: userData.bankDetails.iban || '',
            routingNumber: userData.bankDetails.routingNumber || '',
            country: userData.country || 'Mexico',
            currency: userData.bankDetails.currency || 'USD',
            isPrimary: true,
            status: userData.bankDetails.verificationStatus || 'pending',
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          });
        }

        // Extract crypto wallets from cryptoWallets array
        const cryptoWallets: CryptoWallet[] = [];
        if (userData.cryptoWallets && Array.isArray(userData.cryptoWallets)) {
          userData.cryptoWallets.forEach((wallet: any) => {
            cryptoWallets.push({
              id: wallet.id || generateId(),
              address: wallet.walletAddress || wallet.address || '',
              network: wallet.networkType || wallet.network || '',
              coinType: wallet.coinType || '',
              qrCode: wallet.qrCodeData || wallet.qrCode,
              label: wallet.label || `${wallet.coinType} Wallet`,
              isPrimary: wallet.isPrimary || false,
              status: wallet.verificationStatus || wallet.status || 'approved',
              createdAt: wallet.createdAt?.toDate() || new Date(),
              updatedAt: wallet.updatedAt?.toDate() || new Date(),
            });
          });
        }

        const investor: Investor = {
          id: userId,
          email: userData.email || '',
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
          phoneNumber: userData.phone || '',
          country: userData.country || '',
          location: userData.location || '',
          role: userData.role || 'investor',
          accountType: userData.accountType || 'Basic',
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          balance: userData.currentBalance || 0,
          initialDeposit: userData.initialDeposit || 0,
          isActive: userData.isActive !== false,
          kycStatus: userData.verification?.status || 'approved',
          bankAccounts,
          cryptoWallets,
          performanceData: [],
          accountClosureRequest: userData.accountClosureRequest,
        };

        callback(investor);
      } else {
        callback(null);
      }
    });
  },

  subscribeToTransactions(userId: string, callback: (transactions: Transaction[]) => void): () => void {
    // Use the available index: investorId + createdAt
    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('investorId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(transactionsQuery, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Transaction[];
        
        callback(transactions);
      }, (error) => {
        console.error('Error in transactions subscription:', error);
        // Try fallback query without orderBy
        try {
          const fallbackQuery = query(
            collection(db, 'transactions'),
            where('investorId', '==', userId)
          );
          
          return onSnapshot(fallbackQuery, (snapshot) => {
            const transactions = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as Transaction[];
            
            // Sort manually since we can't use orderBy
            transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            callback(transactions);
          });
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error setting up transactions subscription:', error);
      return () => {};
    }
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      console.log('=== UPDATING USER PROFILE ===');
      console.log('User ID:', userId);
      console.log('Updates:', updates);
      
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      console.log('Profile update successful');
      return true;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }
  },

  async addBankAccount(userId: string, bankAccount: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      console.log('=== ADDING BANK ACCOUNT ===');
      console.log('User ID:', userId);
      console.log('Bank Account:', bankAccount);
      
      // Update the bankDetails field in the user document
      const updateData = {
        bankDetails: {
          accountHolderName: bankAccount.accountName,
          accountNumber: bankAccount.accountNumber,
          bankName: bankAccount.bankName,
          swiftCode: bankAccount.swiftCode,
          iban: bankAccount.iban,
          routingNumber: bankAccount.routingNumber,
          currency: bankAccount.currency,
          verificationStatus: bankAccount.status,
        },
        country: bankAccount.country,
        updatedAt: Timestamp.now(),
      };
      
      console.log('Update data:', updateData);
      await updateDoc(doc(db, 'users', userId), updateData);
      console.log('Bank account added successfully');
      return true;
    } catch (error) {
      console.error('Failed to add bank account:', error);
      return false;
    }
  },

  async updateBankAccount(userId: string, accountId: string, updates: Partial<BankAccount>): Promise<boolean> {
    try {
      console.log('=== UPDATING BANK ACCOUNT ===');
      console.log('User ID:', userId);
      console.log('Account ID:', accountId);
      console.log('Updates:', updates);
      
      // Update the bankDetails field in the user document
      const updateData = {
        'bankDetails.accountHolderName': updates.accountName,
        'bankDetails.accountNumber': updates.accountNumber,
        'bankDetails.bankName': updates.bankName,
        'bankDetails.swiftCode': updates.swiftCode,
        'bankDetails.iban': updates.iban,
        'bankDetails.routingNumber': updates.routingNumber,
        'bankDetails.currency': updates.currency,
        'bankDetails.verificationStatus': updates.status,
        country: updates.country,
        updatedAt: Timestamp.now(),
      };
      
      console.log('Update data:', updateData);
      await updateDoc(doc(db, 'users', userId), updateData);
      console.log('Bank account updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update bank account:', error);
      return false;
    }
  },

  async deleteBankAccount(userId: string, accountId: string): Promise<boolean> {
    try {
      // Remove the bankDetails field from the user document
      await updateDoc(doc(db, 'users', userId), {
        bankDetails: null,
        updatedAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      console.error('Failed to delete bank account:', error);
      return false;
    }
  },

  async addCryptoWallet(userId: string, wallet: Omit<CryptoWallet, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      console.log('=== ADDING CRYPTO WALLET ===');
      console.log('User ID:', userId);
      console.log('Wallet:', wallet);
      
      const newWallet = {
        id: generateId(),
        walletAddress: wallet.address,
        networkType: wallet.network,
        coinType: wallet.coinType,
        label: wallet.label,
        isPrimary: wallet.isPrimary,
        verificationStatus: wallet.status,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('New wallet object:', newWallet);
      await updateDoc(doc(db, 'users', userId), {
        cryptoWallets: arrayUnion(newWallet),
        updatedAt: Timestamp.now(),
      });
      console.log('Crypto wallet added successfully');
      return true;
    } catch (error) {
      console.error('Failed to add crypto wallet:', error);
      return false;
    }
  },

  async updateCryptoWallet(userId: string, walletId: string, updates: Partial<CryptoWallet>): Promise<boolean> {
    try {
      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data();
      const cryptoWallets = userData.cryptoWallets || [];
      
      // Find and update the specific wallet
      const updatedWallets = cryptoWallets.map((wallet: any) => {
        if (wallet.id === walletId) {
          return {
            ...wallet,
            walletAddress: updates.address || wallet.walletAddress,
            networkType: updates.network || wallet.networkType,
            coinType: updates.coinType || wallet.coinType,
            label: updates.label || wallet.label,
            isPrimary: updates.isPrimary !== undefined ? updates.isPrimary : wallet.isPrimary,
            verificationStatus: updates.status || wallet.verificationStatus,
            updatedAt: Timestamp.now(),
          };
        }
        return wallet;
      });

      await updateDoc(doc(db, 'users', userId), {
        cryptoWallets: updatedWallets,
        updatedAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      console.error('Failed to update crypto wallet:', error);
      return false;
    }
  },

  async deleteCryptoWallet(userId: string, walletId: string): Promise<boolean> {
    try {
      console.log('=== DELETING CRYPTO WALLET ===');
      console.log('User ID:', userId);
      console.log('Wallet ID:', walletId);
      
      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        console.log('User document does not exist');
        return false;
      }

      const userData = userDoc.data();
      const cryptoWallets = userData.cryptoWallets || [];
      
      console.log('Current crypto wallets:', cryptoWallets);
      
      // Remove the specific wallet
      const updatedWallets = cryptoWallets.filter((wallet: any) => wallet.id !== walletId);
      
      console.log('Updated crypto wallets after deletion:', updatedWallets);

      await updateDoc(doc(db, 'users', userId), {
        cryptoWallets: updatedWallets,
        updatedAt: Timestamp.now(),
      });
      
      console.log('Crypto wallet deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete crypto wallet:', error);
      return false;
    }
  },
};