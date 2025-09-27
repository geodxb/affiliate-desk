import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { announcementService } from '../../services/announcementService';
import OverviewCard from '../../components/dashboard/OverviewCard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import RecentActivity from '../../components/dashboard/RecentActivity';
import AnnouncementBanner from '../../components/announcements/AnnouncementBanner';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Investor, PerformanceData } from '../../types/user';
import { Transaction } from '../../types/transaction';
import { Announcement } from '../../types/common';

const InvestorDashboardPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [investorData, setInvestorData] = useState<Investor | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && userProfile) {
      loadDashboardData();
      subscribeToAnnouncements();
    }
  }, [currentUser, userProfile]);

  useEffect(() => {
    if (currentUser && userProfile) {
      const unsubscribe = subscribeToRealTimeData();
      return unsubscribe;
    }
  }, [currentUser, userProfile]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      const [profile, recentTransactions] = await Promise.all([
        firestoreService.getInvestorProfile(currentUser.uid),
        firestoreService.getTransactions(currentUser.uid, 10),
      ]);

      setInvestorData(profile);
      setTransactions(recentTransactions);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setShowLoadingScreen(false);
    }
  };

  const subscribeToRealTimeData = () => {
    if (!currentUser) return;

    const unsubscribeProfile = firestoreService.subscribeToUserProfile(
      currentUser.uid,
      setInvestorData
    );

    const unsubscribeTransactions = firestoreService.subscribeToTransactions(
      currentUser.uid,
      (transactions) => setTransactions(transactions.slice(0, 10))
    );

    return () => {
      unsubscribeProfile();
      unsubscribeTransactions();
    };
  };

  const subscribeToAnnouncements = () => {
    try {
      const unsubscribe = announcementService.subscribeToAnnouncements(setAnnouncements);
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to announcements:', error);
    }
  };

  // Generate mock performance data for demo
  const generatePerformanceData = (): PerformanceData[] => {
    if (!investorData?.balance && !investorData?.initialDeposit) {
      return [];
    }
    
    const data: PerformanceData[] = [];
    const startValue = investorData.initialDeposit || 0;
    const currentValue = investorData.balance || 0;
    const days = 30;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Generate realistic fluctuation
      const progress = i / (days - 1);
      const baseValue = startValue > 0 ? startValue : 1000;
      const targetValue = currentValue > 0 ? currentValue : baseValue;
      const randomVariation = (Math.random() - 0.5) * 0.02; // ±2% daily variation
      const value = baseValue + (targetValue - baseValue) * progress + (baseValue * randomVariation);
      
      data.push({
        date,
        value: Math.max(value, baseValue * 0.8), // Minimum 80% of initial deposit
        gainLoss: value - baseValue,
        percentage: baseValue > 0 ? ((value - baseValue) / baseValue) * 100 : 0,
      });
    }

    return data;
  };

  const performanceData = investorData?.performanceData?.length > 0 
    ? investorData.performanceData 
    : generatePerformanceData();
  
  // Use actual Firestore data
  const currentBalance = investorData?.balance || 0;
  const initialDeposit = investorData?.initialDeposit || 0;
  
  // Calculate gain/loss properly
  const gainLoss = currentBalance - initialDeposit;
  const gainLossPercentage = initialDeposit > 0 ? (gainLoss / initialDeposit) * 100 : 0;
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white rounded-xl p-6">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-4" />
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-300 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white"
      >
        <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">
          Welcome back, {userProfile?.firstName}
        </h1>
        <p className="text-blue-100">
          Here's an overview of your investment portfolio and recent activity.
        </p>
      </motion.div>

      {/* Announcements */}
      <AnnouncementBanner announcements={announcements} />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title="Current Balance"
          value={currentBalance}
          currency="USD"
        />
        <OverviewCard
          title="Initial Deposit"
          value={initialDeposit}
          currency="USD"
        />
        <OverviewCard
          title="Gain/Loss"
          value={gainLoss}
          currency="USD"
          trend={gainLoss >= 0 ? 'up' : 'down'}
        />
        <OverviewCard
          title="Performance"
          value={gainLossPercentage}
          type="percentage"
          trend={gainLossPercentage >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Performance Chart and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <PerformanceChart data={performanceData} loading={false} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <RecentActivity transactions={transactions} loading={false} />
        </div>
      </div>

      {/* Account Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">
          Account Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Account Type</p>
            <p className="text-lg font-bold text-green-600">{userProfile?.accountType}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">KYC Status</p>
            <p className="text-lg font-bold text-green-600 capitalize">
              {userProfile?.isActive || userProfile?.accountStatus === 'active' ? 'approved' : (userProfile?.kycStatus || 'pending')}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Country</p>
            <p className="text-lg font-bold text-gray-600">{userProfile?.country}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InvestorDashboardPage;