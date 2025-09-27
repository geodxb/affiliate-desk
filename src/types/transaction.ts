export interface Transaction {
  id: string;
  investorId: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'fee' | 'bonus';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  reference?: string;
  metadata?: Record<string, any>;
}