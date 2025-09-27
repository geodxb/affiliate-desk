import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Eye, Download, FileText, Building, Wallet, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { withdrawalService } from '../../services/withdrawalService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import WithdrawalProgressBar from '../../components/withdrawals/WithdrawalProgressBar';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Investor, BankAccount, CryptoWallet } from '../../types/user';
import { WithdrawalRequest } from '../../types/withdrawal';
import { formatCurrency, formatDate } from '../../lib/utils';
import { WITHDRAWAL_CONFIG } from '../../lib/constants';
import { cn } from '../../lib/utils';

const WithdrawalPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [investorData, setInvestorData] = useState<Investor | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewWithdrawal, setShowNewWithdrawal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [generatingMT103, setGeneratingMT103] = useState(false);

  // Form state
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    type: 'bank' as 'bank' | 'crypto',
    destination: '',
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
      subscribeToWithdrawals();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      const profile = await firestoreService.getInvestorProfile(currentUser.uid);

      setInvestorData(profile);
    } catch (error) {
      console.error('Failed to load withdrawal data:', error);
    } finally {
      setLoading(false);
      setShowLoadingScreen(false);
    }
  };

  const subscribeToWithdrawals = () => {
    if (!currentUser) return;

    const unsubscribe = withdrawalService.subscribeToWithdrawals(
      (withdrawalRequests) => {
        setWithdrawals(withdrawalRequests);
      }
    );

    return unsubscribe;
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !investorData) return;

    const amount = parseFloat(withdrawalForm.amount);
    
    // Validate amount
    const validation = withdrawalService.validateWithdrawalAmount(amount, investorData.balance);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Get destination details
    const destination = withdrawalForm.type === 'bank' 
      ? investorData.bankAccounts.find(acc => acc.id === withdrawalForm.destination)
      : investorData.cryptoWallets.find(wallet => wallet.id === withdrawalForm.destination);

    if (!destination) {
      alert('Please select a valid destination');
      return;
    }

    setLoading(true);

    try {
      const withdrawalId = await withdrawalService.createWithdrawalRequest(
        currentUser.uid,
        amount,
        withdrawalForm.type,
        withdrawalForm.destination,
        destination
      );

      if (withdrawalId) {
        setShowNewWithdrawal(false);
        resetForm();
        alert('Withdrawal request submitted successfully!');
      } else {
        alert('Failed to submit withdrawal request. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit withdrawal:', error);
      alert('Failed to submit withdrawal request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen during initial load or withdrawal submission
  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

  const handleGenerateMT103 = async () => {
    if (!selectedWithdrawal) return;

    setGeneratingMT103(true);
    try {
      const success = await withdrawalService.generateMT103(selectedWithdrawal.id);
      if (success) {
        alert('MT103 document generated successfully!');
        // Refresh the withdrawal data
        await loadData();
      } else {
        alert('Failed to generate MT103 document. Please try again.');
      }
    } catch (error) {
      console.error('Failed to generate MT103:', error);
      alert('Failed to generate MT103 document. Please try again.');
    } finally {
      setGeneratingMT103(false);
    }
  };

  const resetForm = () => {
    setWithdrawalForm({
      amount: '',
      type: 'bank',
      destination: '',
    });
  };

  const openTrackingModal = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowTrackingModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'credited':
        return 'bg-blue-100 text-blue-800';
      case 'Refunded':
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      case 'Rejected':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
      case 'sent_to_blockchain':
      case 'sent':
      case 'Sent':
        return 'bg-orange-100 text-orange-800';
      case 'complete':
      case 'Complete':
      case 'completed':
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'Cancelled':
      case 'canceled':
      case 'Canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'crypto' ? <Wallet className="w-4 h-4" /> : <Building className="w-4 h-4" />;
  };

  const availableDestinations = withdrawalForm.type === 'bank' 
    ? investorData?.bankAccounts.filter(acc => acc.status === 'approved') || []
    : investorData?.cryptoWallets.filter(wallet => wallet.status === 'approved') || [];

  const breakdown = withdrawalForm.amount 
    ? withdrawalService.calculateWithdrawalBreakdown(parseFloat(withdrawalForm.amount) || 0)
    : null;

  const tableColumns = [
    {
      key: 'createdAt' as keyof WithdrawalRequest,
      title: 'Date',
      width: '15%',
      align: 'left' as const,
      render: (value: Date) => (
        <div>
          <div className="font-medium text-gray-900">{formatDate(value).split(' ')[0]}</div>
          <div className="text-sm text-gray-500">{formatDate(value).split(' ')[1]}</div>
        </div>
      ),
    },
    {
      key: 'amount' as keyof WithdrawalRequest,
      title: 'Amount',
      width: '15%',
      align: 'left' as const,
      render: (value: number) => (
        <div>
          <div className="font-semibold text-gray-900">{formatCurrency(value)}</div>
          <div className="text-sm text-gray-500">USD</div>
        </div>
      ),
    },
    {
      key: 'type' as keyof WithdrawalRequest,
      title: 'Destination',
      width: '25%',
      align: 'left' as const,
      render: (value: string, withdrawal: WithdrawalRequest) => (
        <div>
          {value === 'bank' ? (
            <div>
              <div className="font-medium text-gray-900">
                {withdrawal.destinationDetails?.bankName || 'Unknown Bank'}
              </div>
              <div className="text-sm text-gray-500">
                Account: {withdrawal.destinationDetails?.accountNumber ? 
                  `****${withdrawal.destinationDetails.accountNumber.slice(-4)}` : 
                  '****0000'}
              </div>
              {withdrawal.destinationDetails?.swiftCode && (
                <div className="text-sm text-gray-500">
                  SWIFT: {withdrawal.destinationDetails.swiftCode}
                </div>
              )}
              {withdrawal.destinationDetails?.iban && (
                <div className="text-sm text-gray-500">
                  IBAN: {withdrawal.destinationDetails.iban.length > 12 ? 
                    `${withdrawal.destinationDetails.iban.slice(0, 8)}...${withdrawal.destinationDetails.iban.slice(-4)}` : 
                    withdrawal.destinationDetails.iban}
                </div>
              )}
              {withdrawal.destinationDetails?.routingNumber && (
                <div className="text-sm text-gray-500">
                  Routing: {withdrawal.destinationDetails.routingNumber}
                </div>
              )}
              <div className="text-sm text-gray-500">
                {withdrawal.destinationDetails?.country || 'International'} • {withdrawal.destinationDetails?.currency || withdrawal.currency || 'USD'}
              </div>
            </div>
          ) : (
            <div>
              <div className="font-medium text-gray-900">
                {withdrawal.destinationDetails?.coinType || 'Unknown Crypto'} Wallet
              </div>
              <div className="text-sm text-gray-500">
                {withdrawal.destinationDetails?.network || withdrawal.destinationDetails?.networkType || 'Unknown Network'}
              </div>
              <div className="text-sm text-gray-500">
                Address: {withdrawal.destinationDetails?.address ? 
                  `${withdrawal.destinationDetails.address.slice(0, 6)}...${withdrawal.destinationDetails.address.slice(-4)}` : 
                  'Not Available'
                }
              </div>
              {withdrawal.destinationDetails?.label && (
                <div className="text-sm text-gray-500">
                  {withdrawal.destinationDetails.label}
                </div>
              )}
              {(withdrawal.transactionHash || (withdrawal.status === 'Sent' || withdrawal.status === 'sent')) && (
                <div className="text-sm text-gray-500">
                  TX: {withdrawal.transactionHash ? 
                    `${withdrawal.transactionHash.slice(0, 8)}...${withdrawal.transactionHash.slice(-6)}` : 
                    'Processing...'}
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'id' as keyof WithdrawalRequest,
      title: 'Priority',
      width: '15%',
      align: 'left' as const,
      render: (value: string, withdrawal: WithdrawalRequest) => (
        <div>
          <div className="font-medium text-gray-900">STANDARD</div>
        </div>
      ),
    },
    {
      key: 'status' as keyof WithdrawalRequest,
      title: 'Status',
      width: '20%',
      align: 'left' as const,
      render: (value: string, withdrawal: WithdrawalRequest) => (
        <div>
          <div className={`inline-block px-2 py-1 text-xs font-medium rounded capitalize ${getStatusColor(value)}`}>
            {value.replace('_', ' ')}
          </div>
          <div className="text-sm text-gray-500 mt-1">{formatDate(withdrawal.updatedAt).split(' ')[0]}</div>
          {value === 'refunded' && <div className="text-sm text-gray-500">Refunded by Governor</div>}
        </div>
      ),
    },
    {
      key: 'id' as keyof WithdrawalRequest,
      title: 'Actions',
      width: '10%',
      align: 'left' as const,
      render: (value: string, withdrawal: WithdrawalRequest) => (
        <div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              openTrackingModal(withdrawal);
            }}
            variant="secondary"
            size="sm"
            className="px-3 py-1 bg-gray-800 text-white hover:bg-gray-700 text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            Track
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-300 rounded w-1/4" />
            <div className="h-32 bg-gray-300 rounded" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide mb-2">
              Withdrawals
            </h1>
            <p className="text-gray-600">
              Request withdrawals to your verified bank accounts or crypto wallets.
            </p>
          </div>
          <Button onClick={() => setShowNewWithdrawal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Withdrawal
          </Button>
        </div>
      </motion.div>

      {/* Account Balance */}
      <Card className="p-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Available Balance</p>
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(investorData?.balance || 0)}
          </p>
        </div>
      </Card>

      {/* Withdrawal History */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-6">
          Withdrawal History
        </h2>
        
        <div className="overflow-x-auto">
          <Table
            data={withdrawals}
            columns={tableColumns}
            loading={loading}
            emptyMessage="No withdrawal requests found"
            className="w-full"
          />
        </div>
      </Card>

      {/* New Withdrawal Modal */}
      <Modal
        isOpen={showNewWithdrawal}
        onClose={() => {
          setShowNewWithdrawal(false);
          resetForm();
        }}
        title="New Withdrawal Request"
        size="lg"
      >
        <form onSubmit={handleSubmitWithdrawal} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Withdrawal Type
              </label>
              <select
                value={withdrawalForm.type}
                onChange={(e) => setWithdrawalForm({ 
                  ...withdrawalForm, 
                  type: e.target.value as 'bank' | 'crypto',
                  destination: '' // Reset destination when type changes
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="bank">Bank Transfer</option>
                {userProfile?.accountType === 'Pro' && (
                  <option value="crypto">Crypto Transfer</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Amount (USD)
              </label>
              <input
                type="number"
                value={withdrawalForm.amount}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min={WITHDRAWAL_CONFIG.MIN_WITHDRAWAL_AMOUNT}
                max={WITHDRAWAL_CONFIG.MAX_WITHDRAWAL_AMOUNT}
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Destination {withdrawalForm.type === 'bank' ? 'Bank Account' : 'Crypto Wallet'}
            </label>
            <select
              value={withdrawalForm.destination}
              onChange={(e) => setWithdrawalForm({ ...withdrawalForm, destination: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select destination</option>
              {availableDestinations.map((dest: any) => (
                <option key={dest.id} value={dest.id}>
                  {withdrawalForm.type === 'bank' 
                    ? `${dest.accountName} - ${dest.bankName} (*${dest.accountNumber?.slice(-4)})`
                    : `${dest.label || dest.coinType} - ${dest.address?.slice(0, 10)}...${dest.address?.slice(-10)}`
                  }
                </option>
              ))}
            </select>
            {availableDestinations.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No approved {withdrawalForm.type === 'bank' ? 'bank accounts' : 'crypto wallets'} found. 
                Please add and verify a {withdrawalForm.type === 'bank' ? 'bank account' : 'crypto wallet'} first.
              </p>
            )}
          </div>

          {/* Withdrawal Breakdown */}
          {breakdown && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 uppercase tracking-wide">Withdrawal Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Withdrawal Amount:</span>
                  <span className="font-medium">{formatCurrency(breakdown.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee ({breakdown.feePercentage}%):</span>
                  <span className="font-medium text-red-600">-{formatCurrency(breakdown.platformFee)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Net Amount:</span>
                  <span className="text-green-600">{formatCurrency(breakdown.netAmount)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!withdrawalForm.amount || !withdrawalForm.destination || availableDestinations.length === 0}
            >
              Submit Withdrawal Request
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewWithdrawal(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enhanced Tracking Modal */}
      <Modal
        isOpen={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          setSelectedWithdrawal(null);
        }}
        title="Withdrawal Tracking Details"
        size="xl"
      >
        {selectedWithdrawal && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Header Section */}
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Request ID</p>
                  <p className="font-mono text-sm font-medium">{selectedWithdrawal.id}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Status</p>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${getStatusColor(selectedWithdrawal.status)}`}>
                    {selectedWithdrawal.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Type</p>
                  <div className="flex items-center justify-center space-x-2">
                    {getTypeIcon(selectedWithdrawal.type)}
                    <span className="capitalize font-medium">{selectedWithdrawal.type}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Progress Tracker
              </h3>
              <WithdrawalProgressBar withdrawal={selectedWithdrawal} />
            </div>

            {/* Financial Breakdown */}
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Financial Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Requested Amount</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Platform Fee (15%)</p>
                  <p className="text-xl font-bold text-gray-700">-{formatCurrency(selectedWithdrawal.platformFee)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Net Transfer</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedWithdrawal.netAmount)}</p>
                </div>
              </div>
            </div>

            {/* Destination Details */}
            {selectedWithdrawal.type === 'bank' ? (
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-gray-700" />
                  Bank Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Account Holder</p>
                    <p className="font-medium">{selectedWithdrawal.destinationDetails?.accountName || selectedWithdrawal.investorName || 'Not Available'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Bank Name</p>
                    <p className="font-medium">{selectedWithdrawal.destinationDetails?.bankName || 'Not Available'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Account Number</p>
                    <p className="font-mono">
                      {selectedWithdrawal.destinationDetails?.accountNumber ? 
                        `****${selectedWithdrawal.destinationDetails.accountNumber.slice(-4)}` : 
                        'Not Available'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Country</p>
                    <p className="font-medium">{selectedWithdrawal.destinationDetails?.country || 'Not Available'}</p>
                  </div>
                  {selectedWithdrawal.destinationDetails?.iban && (
                    <div>
                      <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">IBAN</p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">{selectedWithdrawal.destinationDetails.iban}</p>
                    </div>
                  )}
                  {selectedWithdrawal.destinationDetails?.swiftCode && (
                    <div>
                      <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">SWIFT Code</p>
                      <p className="font-mono">{selectedWithdrawal.destinationDetails.swiftCode}</p>
                    </div>
                  )}
                  {selectedWithdrawal.destinationDetails?.routingNumber && (
                    <div>
                      <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Routing Number</p>
                      <p className="font-mono">{selectedWithdrawal.destinationDetails.routingNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Currency</p>
                    <p className="font-medium">{selectedWithdrawal.destinationDetails?.currency || selectedWithdrawal.currency || 'USD'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-gray-700" />
                  Crypto Wallet Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Wallet Label</p>
                    <p className="font-medium">{selectedWithdrawal.destinationDetails?.label || 'Unnamed Wallet'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Network</p>
                    <p className="font-medium">{selectedWithdrawal.destinationDetails?.network || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Wallet Address</p>
                    <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 break-all">
                      {selectedWithdrawal.destinationDetails?.address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Coin Type</p>
                    <p className="font-medium">{selectedWithdrawal.destinationDetails?.coinType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Network Type</p>
                    <p className="font-medium">{selectedWithdrawal.destinationDetails?.networkType || selectedWithdrawal.destinationDetails?.network || 'Not Available'}</p>
                  </div>
                  {selectedWithdrawal.transactionHash && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Transaction Hash</p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 break-all">
                        {selectedWithdrawal.transactionHash}
                      </p>
                      {selectedWithdrawal.hashGeneratedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Generated: {formatDate(selectedWithdrawal.hashGeneratedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="font-medium">Request Submitted</p>
                    <p className="text-sm text-gray-600">{formatDate(selectedWithdrawal.createdAt)}</p>
                  </div>
                </div>
                {selectedWithdrawal.processedAt && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-700" />
                    <div>
                      <p className="font-medium">Request Processed</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedWithdrawal.processedAt)}</p>
                      {selectedWithdrawal.sentToBlockchainBy && (
                        <p className="text-xs text-gray-500">By: {selectedWithdrawal.sentToBlockchainBy}</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedWithdrawal.hashGeneratedAt && (
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-700" />
                    <div>
                      <p className="font-medium">Transaction Hash Generated</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedWithdrawal.hashGeneratedAt)}</p>
                      {selectedWithdrawal.hashGeneratedBy && (
                        <p className="text-xs text-gray-500">By: {selectedWithdrawal.hashGeneratedBy}</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedWithdrawal.mt103GeneratedAt && (
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-700" />
                    <div>
                      <p className="font-medium">MT103 Document Generated</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedWithdrawal.mt103GeneratedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* MT103 Generation */}
            {selectedWithdrawal.type === 'bank' && selectedWithdrawal.status === 'approved' && !selectedWithdrawal.mt103Generated && (
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-700" />
                  MT103 Document
                </h3>
                <p className="text-gray-700 mb-4">
                  Your withdrawal has been approved. You can now generate the official MT103 SWIFT document 
                  for your bank transfer.
                </p>
                <Button
                  onClick={handleGenerateMT103}
                  loading={generatingMT103}
                  className="bg-gray-800 hover:bg-gray-900 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate MT103 Document
                </Button>
              </div>
            )}

            {/* Hash Generated Section for Crypto */}
            {selectedWithdrawal.type === 'crypto' && (selectedWithdrawal.status.toLowerCase() === 'sent') && (
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-gray-700" />
                  Hash Generated
                </h3>
                {selectedWithdrawal.transactionHash ? (
                  <>
                    <p className="text-gray-700 mb-3">
                      Your crypto withdrawal has been sent to the blockchain.
                    </p>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Transaction Hash</p>
                      <p className="font-mono text-sm break-all">{selectedWithdrawal.transactionHash}</p>
                    </div>
                    {selectedWithdrawal.hashGeneratedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Generated: {formatDate(selectedWithdrawal.hashGeneratedAt)}
                      </p>
                    )}
                    {selectedWithdrawal.sentToBlockchainAt && (
                      <p className="text-xs text-gray-500">
                        Sent to Blockchain: {formatDate(selectedWithdrawal.sentToBlockchainAt)}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-700">
                    Transaction hash is being generated. Please check back in a few moments.
                  </p>
                )}
              </div>
            )}

            {/* MT103 Document Generated Section for Bank */}
            {selectedWithdrawal.type === 'bank' && selectedWithdrawal.mt103Generated && (
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-gray-700" />
                  MT103 Document Generated
                </h3>
                <p className="text-gray-700 mb-3">
                  Your bank withdrawal MT103 document has been generated.
                </p>
                {selectedWithdrawal.mt103GeneratedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Generated: {formatDate(selectedWithdrawal.mt103GeneratedAt)}
                  </p>
                )}
              </div>
            )}
            {selectedWithdrawal.notes && (
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-2">
                  Additional Notes
                </h3>
                <p className="text-gray-700">{selectedWithdrawal.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                onClick={() => {
                  setShowTrackingModal(false);
                  setSelectedWithdrawal(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Close Details
              </Button>
              {selectedWithdrawal.status === 'pending' && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Implement cancel withdrawal functionality
                    alert('Cancel functionality will be implemented');
                  }}
                >
                  Cancel Request
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WithdrawalPage;