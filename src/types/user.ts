export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country: string;
  location?: string;
  role: 'investor' | 'admin' | 'governor';
  accountType: 'Basic' | 'Pro';
  createdAt: Date;
  updatedAt: Date;
  balance: number;
  initialDeposit: number;
  isActive: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
}

export interface CryptoWallet {
  id: string;
  address: string;
  network: string;
  coinType: string;
  qrCode?: string;
  label?: string;
  isPrimary: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;
  country: string;
  currency: string;
  isPrimary: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Investor extends User {
  bankAccounts: BankAccount[];
  cryptoWallets: CryptoWallet[];
  performanceData: PerformanceData[];
  accountClosureRequest?: AccountClosureRequest;
}

export interface PerformanceData {
  date: Date;
  value: number;
  gainLoss: number;
  percentage: number;
}

export interface AccountClosureRequest {
  id: string;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  requestedAt: Date;
  expectedCompletionDate?: Date;
  progress: number;
}