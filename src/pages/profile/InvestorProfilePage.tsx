import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, Wallet, Plus, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Investor, BankAccount, CryptoWallet } from '../../types/user';
import { SUPPORTED_COUNTRIES, CRYPTO_NETWORKS } from '../../lib/constants';

const InvestorProfilePage: React.FC = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [investorData, setInvestorData] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [editingCrypto, setEditingCrypto] = useState<CryptoWallet | null>(null);

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    country: '',
    location: '',
  });

  const [bankForm, setBankForm] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    swiftCode: '',
    iban: '',
    routingNumber: '',
    country: '',
    currency: 'USD',
  });

  const [cryptoForm, setCryptoForm] = useState({
    address: '',
    network: '',
    coinType: '',
    label: '',
  });

  useEffect(() => {
    if (currentUser) {
      loadProfileData();
    }
  }, [currentUser]);

  useEffect(() => {
    // Force reload when investorData changes to ensure UI updates
    if (investorData) {
      console.log('=== INVESTOR DATA LOADED IN PROFILE PAGE ===');
      console.log('Full investor data:', JSON.stringify(investorData, null, 2));
      console.log('Bank accounts:', JSON.stringify(investorData.bankAccounts, null, 2));
      console.log('Crypto wallets:', JSON.stringify(investorData.cryptoWallets, null, 2));
      console.log('Bank accounts length:', investorData.bankAccounts?.length || 0);
      console.log('Crypto wallets length:', investorData.cryptoWallets?.length || 0);
      console.log('=== END INVESTOR DATA ===');
    }
  }, [investorData]);
  useEffect(() => {
    if (userProfile) {
      console.log('Setting personal info from userProfile:', userProfile);
      setPersonalInfo({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        country: userProfile.country || '',
        location: userProfile.location || '',
      });
    }
  }, [userProfile]);

  const loadProfileData = async () => {
    if (!currentUser) return;

    try {
      // Ensure minimum 3 seconds loading time
      const [profile] = await Promise.all([
        firestoreService.getInvestorProfile(currentUser.uid),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
      
      setInvestorData(profile);
      
      // Update personal info form with actual data
      if (profile) {
        console.log('Setting personal info from loaded profile:', profile);
        setPersonalInfo({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          phoneNumber: profile.phoneNumber || '',
          country: profile.country || '',
          location: profile.location || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
      setShowLoadingScreen(false);
    }
  };

  // Show loading screen during initial load
  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

  const subscribeToProfileData = () => {
    if (!currentUser) return;

    const unsubscribe = firestoreService.subscribeToUserProfile(
      currentUser.uid,
      (profile) => {
        setInvestorData(profile);
        if (profile) {
          console.log('Updating personal info from subscribed profile:', profile);
          setPersonalInfo({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: profile.email || '',
            phoneNumber: profile.phoneNumber || '',
            country: profile.country || '',
            location: profile.location || '',
          });
        }
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToProfileData();
      return unsubscribe;
    }
  }, [currentUser]);
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await firestoreService.updateUserProfile(currentUser.uid, personalInfo);
      await refreshUserProfile();
      alert('Personal information updated successfully!');
    } catch (error) {
      console.error('Failed to update personal info:', error);
      alert('Failed to update personal information. Please try again.');
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      if (editingBank) {
        await firestoreService.updateBankAccount(currentUser.uid, editingBank.id, bankForm);
      } else {
        await firestoreService.addBankAccount(currentUser.uid, {
          ...bankForm,
          isPrimary: false,
          status: 'pending' as const,
        });
      }
      
      resetBankForm();
      setShowBankModal(false);
      await loadProfileData();
      alert(editingBank ? 'Bank account updated successfully!' : 'Bank account added successfully!');
    } catch (error) {
      console.error('Failed to save bank account:', error);
      alert('Failed to save bank account. Please try again.');
    }
  };

  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || userProfile?.accountType !== 'Pro') return;

    try {
      if (editingCrypto) {
        await firestoreService.updateCryptoWallet(currentUser.uid, editingCrypto.id, cryptoForm);
      } else {
        await firestoreService.addCryptoWallet(currentUser.uid, {
          ...cryptoForm,
          isPrimary: false,
          status: 'pending' as const,
        });
      }
      
      resetCryptoForm();
      setShowCryptoModal(false);
      await loadProfileData();
      alert(editingCrypto ? 'Crypto wallet updated successfully!' : 'Crypto wallet added successfully!');
    } catch (error) {
      console.error('Failed to save crypto wallet:', error);
      alert('Failed to save crypto wallet. Please try again.');
    }
  };

  const handleDeleteBank = async (accountId: string) => {
    if (!currentUser || !confirm('Are you sure you want to delete this bank account?')) return;

    try {
      await firestoreService.deleteBankAccount(currentUser.uid, accountId);
      await loadProfileData();
      alert('Bank account deleted successfully!');
    } catch (error) {
      console.error('Failed to delete bank account:', error);
      alert('Failed to delete bank account. Please try again.');
    }
  };

  const handleDeleteCrypto = async (walletId: string) => {
    if (!currentUser || !confirm('Are you sure you want to delete this crypto wallet?')) return;

    try {
      console.log('Deleting crypto wallet with ID:', walletId);
      const success = await firestoreService.deleteCryptoWallet(currentUser.uid, walletId);
      
      if (success) {
        console.log('Wallet deletion successful, reloading data...');
        await loadProfileData();
        alert('Crypto wallet deleted successfully!');
      } else {
        console.error('Wallet deletion failed');
        alert('Failed to delete crypto wallet. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete crypto wallet:', error);
      alert('Failed to delete crypto wallet. Please try again.');
    }
  };

  const resetBankForm = () => {
    setBankForm({
      accountName: '',
      accountNumber: '',
      bankName: '',
      swiftCode: '',
      iban: '',
      routingNumber: '',
      country: '',
      currency: 'USD',
    });
    setEditingBank(null);
  };

  const resetCryptoForm = () => {
    setCryptoForm({
      address: '',
      network: '',
      coinType: '',
      label: '',
    });
    setEditingCrypto(null);
  };

  const openEditBank = (bank: BankAccount) => {
    setBankForm({
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      bankName: bank.bankName,
      swiftCode: bank.swiftCode || '',
      iban: bank.iban || '',
      routingNumber: bank.routingNumber || '',
      country: bank.country,
      currency: bank.currency,
    });
    setEditingBank(bank);
    setShowBankModal(true);
  };

  const openEditCrypto = (crypto: CryptoWallet) => {
    setCryptoForm({
      address: crypto.address,
      network: crypto.network,
      coinType: crypto.coinType,
      label: crypto.label || '',
    });
    setEditingCrypto(crypto);
    setShowCryptoModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-300 rounded w-1/4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-full" />
                <div className="h-4 bg-gray-300 rounded w-3/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide mb-2">
          Profile Management
        </h1>
        <p className="text-gray-600">
          Manage your personal information, bank accounts, and crypto wallets.
        </p>
      </motion.div>

      {/* Personal Information */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
            Personal Information
          </h2>
        </div>

        <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                First Name
              </label>
              <input
                type="text"
                value={personalInfo.firstName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Last Name
              </label>
              <input
                type="text"
                value={personalInfo.lastName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Phone Number
              </label>
              <input
                type="tel"
                value={personalInfo.phoneNumber}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Country
              </label>
              <select
                value={personalInfo.country}
                onChange={(e) => setPersonalInfo({ ...personalInfo, country: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Country</option>
                {Object.values(SUPPORTED_COUNTRIES).map(country => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Location
              </label>
              <input
                type="text"
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, State"
              />
            </div>
          </div>
          
          <Button type="submit" className="mt-6">
            Update Personal Information
          </Button>
        </form>
      </Card>

      {/* Bank Accounts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              Bank Accounts
            </h2>
          </div>
          <Button onClick={() => setShowBankModal(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Bank Account
          </Button>
        </div>

        {investorData?.bankAccounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No bank accounts found. Please add a bank account.</p>
            <p className="text-xs mt-2">Debug: {JSON.stringify(investorData?.bankAccounts)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {investorData?.bankAccounts?.map((account) => (
              <div key={account.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="mb-2 text-xs text-gray-500">Account ID: {account.id}</div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {account.accountName || 'Bank Account'}
                    </h3>
                    <p className="text-sm text-gray-600 font-mono">
                      {account.accountNumber ? `**** **** ${account.accountNumber.slice(-4)}` : 'No account number'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {account.bankName || 'Unknown Bank'} - {account.country || 'Mexico'}
                    </p>
                    {account.iban && (
                      <p className="text-xs text-gray-500">IBAN: {account.iban}</p>
                    )}
                    {account.swiftCode && (
                      <p className="text-xs text-gray-500">SWIFT: {account.swiftCode}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(account.status)}`}>
                        {account.status}
                      </span>
                      {account.isPrimary && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-600">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => openEditBank(account)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteBank(account.id)}
                      variant="danger"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Crypto Wallets */}
      {userProfile?.accountType === 'Pro' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Wallet className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                Crypto Wallets
              </h2>
            </div>
            <Button onClick={() => setShowCryptoModal(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Crypto Wallet
            </Button>
          </div>

          {investorData?.cryptoWallets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No crypto wallets found. Please add a crypto wallet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {investorData?.cryptoWallets?.map((wallet) => (
                <div key={wallet.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="mb-2 text-xs text-gray-500">Wallet ID: {wallet.id}</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {wallet.label || `${wallet.coinType || 'Unknown'} Wallet`}
                      </h3>
                      <p className="text-sm text-gray-600 font-mono">
                        {wallet.address ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-10)}` : 'No address'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {wallet.coinType || 'Unknown Coin'} - {wallet.network || 'Unknown Network'}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(wallet.status)}`}>
                          {wallet.status}
                        </span>
                        {wallet.isPrimary && (
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-600">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {wallet.address && wallet.address !== 'No address' && (
                        <Button
                          onClick={() => openEditCrypto(wallet)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteCrypto(wallet.id)}
                        variant="danger"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Bank Account Modal */}
      <Modal
        isOpen={showBankModal}
        onClose={() => {
          setShowBankModal(false);
          resetBankForm();
        }}
        title={editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
        size="lg"
      >
        <form onSubmit={handleBankSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Account Name
              </label>
              <input
                type="text"
                value={bankForm.accountName}
                onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Bank Name
              </label>
              <input
                type="text"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Country
              </label>
              <select
                value={bankForm.country}
                onChange={(e) => setBankForm({ ...bankForm, country: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Country</option>
                {Object.values(SUPPORTED_COUNTRIES).map(country => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Account Number
              </label>
              <input
                type="text"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                IBAN
              </label>
              <input
                type="text"
                value={bankForm.iban}
                onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                SWIFT Code
              </label>
              <input
                type="text"
                value={bankForm.swiftCode}
                onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Currency
              </label>
              <select
                value={bankForm.currency}
                onChange={(e) => setBankForm({ ...bankForm, currency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="CHF">CHF</option>
                <option value="SAR">SAR</option>
                <option value="AED">AED</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button type="submit" className="flex-1">
              {editingBank ? 'Update Account' : 'Add Account'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBankModal(false);
                resetBankForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Crypto Wallet Modal */}
      <Modal
        isOpen={showCryptoModal}
        onClose={() => {
          setShowCryptoModal(false);
          resetCryptoForm();
        }}
        title={editingCrypto ? 'Edit Crypto Wallet' : 'Add Crypto Wallet'}
      >
        <form onSubmit={handleCryptoSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Wallet Address
            </label>
            <input
              type="text"
              value={cryptoForm.address}
              onChange={(e) => setCryptoForm({ ...cryptoForm, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="0x..."
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Network
              </label>
              <select
                value={cryptoForm.network}
                onChange={(e) => setCryptoForm({ ...cryptoForm, network: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Network</option>
                {CRYPTO_NETWORKS.map(network => (
                  <option key={network.id} value={network.name}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Coin Type
              </label>
              <input
                type="text"
                value={cryptoForm.coinType}
                onChange={(e) => setCryptoForm({ ...cryptoForm, coinType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ETH, BTC, USDT..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Label (Optional)
            </label>
            <input
              type="text"
              value={cryptoForm.label}
              onChange={(e) => setCryptoForm({ ...cryptoForm, label: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My ETH Wallet"
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button type="submit" className="flex-1">
              {editingCrypto ? 'Update Wallet' : 'Add Wallet'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCryptoModal(false);
                resetCryptoForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvestorProfilePage;