export interface SystemControls {
  withdrawalsEnabled: boolean;
  messagingEnabled: boolean;
  profileUpdatesEnabled: boolean;
  loginEnabled: boolean;
  depositsEnabled: boolean;
  tradingEnabled: boolean;
  accountCreationEnabled: boolean;
  supportTicketsEnabled: boolean;
  notificationsEnabled: boolean;
  apiAccessEnabled: boolean;
  dataExportEnabled: boolean;
  reportingEnabled: boolean;
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