import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileText, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Investor, AccountClosureRequest } from '../../types/user';
import { formatDate } from '../../lib/utils';

const AccountClosurePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [investorData, setInvestorData] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (currentUser) {
      setShowLoadingScreen(true);
      loadAccountData();
    }
  }, [currentUser]);

  const loadAccountData = async () => {
    if (!currentUser) return;

    try {
      // Ensure minimum 3 seconds loading time
      const [profile] = await Promise.all([
        firestoreService.getInvestorProfile(currentUser.uid),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
      
      setInvestorData(profile);
    } catch (error) {
      console.error('Failed to load account data:', error);
    } finally {
      setLoading(false);
      setShowLoadingScreen(false);
    }
  };

  // Show loading screen during initial load
  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reason.trim()) return;

    try {
      // Create account closure request
      const closureRequest: AccountClosureRequest = {
        id: Date.now().toString(),
        reason: reason.trim(),
        status: 'pending',
        requestedAt: new Date(),
        expectedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        progress: 10, // Initial progress
      };

      await firestoreService.updateUserProfile(currentUser.uid, {
        accountClosureRequest: closureRequest,
      });

      setShowRequestModal(false);
      setReason('');
      await loadAccountData();
      alert('Account closure request submitted successfully!');
    } catch (error) {
      console.error('Failed to submit closure request:', error);
      alert('Failed to submit request. Please try again.');
    }
  };

  const getProgressSteps = () => [
    { label: 'Request Submitted', completed: true },
    { label: 'Review & Validation', completed: (investorData?.accountClosureRequest?.progress || 0) >= 25 },
    { label: 'Fund Transfer Initiated', completed: (investorData?.accountClosureRequest?.progress || 0) >= 50 },
    { label: 'Final Verification', completed: (investorData?.accountClosureRequest?.progress || 0) >= 75 },
    { label: 'Account Closed', completed: (investorData?.accountClosureRequest?.progress || 0) >= 100 },
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

  const hasActiveRequest = investorData?.accountClosureRequest && 
    investorData.accountClosureRequest.status !== 'completed' && 
    investorData.accountClosureRequest.status !== 'cancelled';

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide mb-2">
          Account Closure
        </h1>
        <p className="text-gray-600">
          Request closure of your investment account and fund transfer.
        </p>
      </motion.div>

      {/* Warning Notice */}
      <Card className="p-6 border-l-4 border-red-500 bg-red-50">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 uppercase tracking-wide mb-2">
              Important Notice
            </h3>
            <div className="text-red-800 space-y-2">
              <p>• Account closure is irreversible and cannot be undone</p>
              <p>• The process typically takes 90 business days to complete</p>
              <p>• All funds will be transferred to your registered bank account</p>
              <p>• Your account will be suspended immediately upon request submission</p>
              <p>• You will not be able to make new deposits or trades after closure request</p>
            </div>
          </div>
        </div>
      </Card>

      {hasActiveRequest ? (
        /* Active Request Status */
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              Closure Request Status
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Request ID</p>
              <p className="font-mono text-sm">{investorData.accountClosureRequest.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Status</p>
              <span className="px-3 py-1 text-sm font-medium rounded-full capitalize bg-blue-100 text-blue-800">
                {investorData.accountClosureRequest.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Requested On</p>
              <p className="font-medium">{formatDate(investorData.accountClosureRequest.requestedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Expected Completion</p>
              <p className="font-medium">
                {investorData.accountClosureRequest.expectedCompletionDate 
                  ? formatDate(investorData.accountClosureRequest.expectedCompletionDate)
                  : 'TBD'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Reason</p>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
              {investorData.accountClosureRequest.reason}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">Progress</h3>
              <span className="text-sm text-gray-600">
                {Math.round(investorData.accountClosureRequest.progress || 0)}% Complete
              </span>
            </div>

            <div className="space-y-4">
              {getProgressSteps().map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {step.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm ${step.completed ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${investorData.accountClosureRequest.progress || 0}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-2 bg-green-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Next Steps:</strong> Our team is processing your request. You will receive email updates 
              at each stage. If you have questions, please contact support.
            </p>
          </div>
        </Card>
      ) : (
        /* Request Form */
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              Account Closure Process
            </h2>
          </div>

          <div className="prose prose-sm max-w-none mb-6 text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-3">
              What happens when you close your account:
            </h3>
            <ol className="space-y-2">
              <li><strong>Immediate Suspension:</strong> Your account will be suspended immediately</li>
              <li><strong>Fund Verification:</strong> We'll verify your current balance and any pending transactions</li>
              <li><strong>Transfer Processing:</strong> Funds will be transferred to your registered bank account</li>
              <li><strong>Final Review:</strong> Our team will conduct a final review before closure</li>
              <li><strong>Confirmation:</strong> You'll receive confirmation once the process is complete</li>
            </ol>

            <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide mb-3 mt-6">
              Current Account Summary:
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg not-prose">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Available Balance:</span>
                  <span className="ml-2 font-semibold">${(investorData?.balance || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Account Type:</span>
                  <span className="ml-2 font-semibold">{investorData?.accountType || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowRequestModal(true)}
              variant="danger"
              className="px-8"
            >
              Request Account Closure
            </Button>
          </div>
        </Card>
      )}

      {/* Closure Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Confirm Account Closure"
        size="lg"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-red-800">
                <p className="font-semibold mb-2">This action cannot be undone!</p>
                <p className="text-sm">
                  By submitting this request, your account will be immediately suspended 
                  and the closure process will begin. This typically takes 90 business days to complete.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Reason for Closure *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              placeholder="Please provide a reason for closing your account..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This information helps us improve our services
            </p>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="confirm"
              className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
              required
            />
            <label htmlFor="confirm" className="ml-3 text-sm text-gray-700">
              I understand that this action is irreversible and my account will be permanently closed
            </label>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button type="submit" variant="danger" className="flex-1">
              Submit Closure Request
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRequestModal(false)}
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

export default AccountClosurePage;