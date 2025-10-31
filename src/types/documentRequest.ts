export interface DocumentRequest {
  id: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  documentType: string;
  description: string;
  reason: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  requestedAt: Date;
  requestedBy?: string;
  dueDate?: Date;
  submittedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
