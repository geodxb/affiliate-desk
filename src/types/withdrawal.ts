export interface WithdrawalRequest {
  id: string;
  investorId: string;
  investorName: string;
  investorEmail?: string;
  amount: number;
  currency: string;
  type: 'bank' | 'crypto';
  destination: string;
  destinationDetails: BankAccount | CryptoWallet;
  platformFee: number;
  netAmount: number;
  status: 'pending' | 'approved' | 'processing' | 'sent_to_blockchain' | 'credited' | 'rejected' | 'Refunded';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  date: string;
  processedAt?: Date;
  approvalDate?: Date;
  processedBy?: string;
  reason?: string;
  notes?: string;
  transactionHash?: string;
  mt103Generated?: boolean;
  mt103GeneratedAt?: Date;
  mt103DocumentUrl?: string;
  w8benStatus?: 'pending' | 'Approved' | 'rejected';
  w8benSubmittedAt?: Date;
  w8benDocumentUrl?: string;
  requestedBy: string; // Always "investor"
  hashGeneratedAt?: Date;
  hashGeneratedBy?: string;
  hashStatus?: string;
  sentToBlockchainAt?: Date;
  sentToBlockchainBy?: string;
}

interface BankAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  country: string;
  iban?: string;
  swiftCode?: string;
}

interface CryptoWallet {
  address: string;
  network: string;
  coinType: string;
  label?: string;
}