export interface AnnouncementBanner {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetRoles: ('admin' | 'investor' | 'governor')[];
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemRestriction {
  restrictedMode: boolean;
  restrictionReason: string;
  restrictionLevel: 'none' | 'partial' | 'full';
  withdrawalsEnabled: boolean;
  messagingEnabled: boolean;
  profileUpdatesEnabled: boolean;
  loginEnabled: boolean;
  allowedPages: string[];
}