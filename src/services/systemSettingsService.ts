import {
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SystemControls {
  withdrawalsEnabled: boolean;
  messagingEnabled: boolean;
  profileUpdatesEnabled: boolean;
  loginEnabled: boolean;
  restrictedMode: boolean;
  allowedPages: string[];
  restrictionReason: string;
  restrictionLevel: 'none' | 'partial' | 'full';
}

export interface SystemSettings {
  systemControls: SystemControls;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  minWithdrawal: number;
  maxWithdrawal: number;
  commissionRate: number;
  autoApprovalLimit: number;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAXIMUM';
  requireW8Ben: boolean;
  updatedAt: Date;
  updatedBy: string;
}

export const systemSettingsService = {
  async getSystemSettings(): Promise<SystemSettings | null> {
    try {
      console.log('=== FETCHING SYSTEM SETTINGS ===');
      const settingsDoc = await getDoc(doc(db, 'systemSettings', 'main'));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        console.log('System settings data:', data);
        
        return {
          systemControls: data.systemControls || {
            withdrawalsEnabled: true,
            messagingEnabled: true,
            profileUpdatesEnabled: true,
            loginEnabled: true,
            depositsEnabled: true,
            tradingEnabled: true,
            accountCreationEnabled: true,
            supportTicketsEnabled: true,
            notificationsEnabled: true,
            apiAccessEnabled: true,
            dataExportEnabled: true,
            reportingEnabled: true,
            restrictedMode: false,
            allowedPages: [],
            restrictionReason: '',
            restrictionLevel: 'none',
          },
          maintenanceMode: data.maintenanceMode || false,
          maintenanceMessage: data.maintenanceMessage || '',
          minWithdrawal: data.minWithdrawal || 100,
          maxWithdrawal: data.maxWithdrawal || 50000,
          commissionRate: data.commissionRate || 0.15,
          autoApprovalLimit: data.autoApprovalLimit || 1000,
          securityLevel: data.securityLevel || 'MEDIUM',
          requireW8Ben: data.requireW8Ben || false,
          updatedAt: data.updatedAt?.toDate() || new Date(),
          updatedBy: data.updatedBy || '',
        };
      } else {
        console.log('No system settings document found');
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
      return null;
    }
  },

  subscribeToSystemSettings(callback: (settings: SystemSettings | null) => void): () => void {
    console.log('=== SUBSCRIBING TO SYSTEM SETTINGS ===');
    
    try {
      const settingsDocRef = doc(db, 'systemSettings', 'main');
      
      return onSnapshot(settingsDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log('System settings subscription update:', data);
          
          const settings: SystemSettings = {
            systemControls: data.systemControls || {
              withdrawalsEnabled: true,
              messagingEnabled: true,
              profileUpdatesEnabled: true,
              loginEnabled: true,
              depositsEnabled: true,
              tradingEnabled: true,
              accountCreationEnabled: true,
              supportTicketsEnabled: true,
              notificationsEnabled: true,
              apiAccessEnabled: true,
              dataExportEnabled: true,
              reportingEnabled: true,
              restrictedMode: false,
              allowedPages: [],
              restrictionReason: '',
              restrictionLevel: 'none',
            },
            maintenanceMode: data.maintenanceMode || false,
            maintenanceMessage: data.maintenanceMessage || '',
            minWithdrawal: data.minWithdrawal || 100,
            maxWithdrawal: data.maxWithdrawal || 50000,
            commissionRate: data.commissionRate || 0.15,
            autoApprovalLimit: data.autoApprovalLimit || 1000,
            securityLevel: data.securityLevel || 'MEDIUM',
            requireW8Ben: data.requireW8Ben || false,
            updatedAt: data.updatedAt?.toDate() || new Date(),
            updatedBy: data.updatedBy || '',
          };
          
          callback(settings);
        } else {
          console.log('System settings document does not exist');
          callback(null);
        }
      }, (error) => {
        console.error('System settings subscription error:', error);
        callback(null);
      });
    } catch (error) {
      console.error('Error setting up system settings subscription:', error);
      callback(null);
      return () => {};
    }
  },
};