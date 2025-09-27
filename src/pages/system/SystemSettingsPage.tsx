import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, AlertTriangle, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { systemSettingsService, SystemSettings } from '../../services/systemSettingsService';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    const unsubscribe = subscribeToSettings();
    return unsubscribe;
  }, []);

  const loadSettings = async () => {
    try {
      const systemSettings = await systemSettingsService.getSystemSettings();
      setSettings(systemSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to load system settings:', err);
      setError('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToSettings = () => {
    return systemSettingsService.subscribeToSystemSettings((systemSettings) => {
      setSettings(systemSettings);
      setLoading(false);
      if (!systemSettings) {
        setError('System settings not found');
      } else {
        setError(null);
      }
    });
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-600' : 'text-red-600';
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-green-600 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'HIGH':
        return 'text-orange-600 bg-orange-100';
      case 'MAXIMUM':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRestrictionLevelColor = (level: string) => {
    switch (level) {
      case 'none':
        return 'text-green-600 bg-green-100';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100';
      case 'full':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Settings</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Settings Found</h2>
          <p className="text-gray-600">System settings document not found in database</p>
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
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide mb-2">
          System Settings
        </h1>
        <p className="text-gray-600">
          Current system configuration and restrictions
        </p>
      </motion.div>

      {/* System Status Overview */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
            System Status Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              {settings.maintenanceMode ? (
                <Clock className="w-6 h-6 text-yellow-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">System Status</p>
            <p className={cn('font-bold', settings.maintenanceMode ? 'text-yellow-600' : 'text-green-600')}>
              {settings.maintenanceMode ? 'Maintenance' : 'Operational'}
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Security Level</p>
            <span className={cn('px-2 py-1 text-xs font-bold rounded-full', getSecurityLevelColor(settings.securityLevel))}>
              {settings.securityLevel}
            </span>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Restriction Level</p>
            <span className={cn('px-2 py-1 text-xs font-bold rounded-full capitalize', getRestrictionLevelColor(settings.systemControls.restrictionLevel))}>
              {settings.systemControls.restrictionLevel}
            </span>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Login Status</p>
            <p className={cn('font-bold', getStatusColor(settings.systemControls.loginEnabled))}>
              {settings.systemControls.loginEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>

        {settings.maintenanceMode && settings.maintenanceMessage && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">Maintenance Message:</p>
            <p className="text-yellow-700">{settings.maintenanceMessage}</p>
          </div>
        )}
      </Card>

      {/* System Controls */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
            System Controls
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(settings.systemControls.withdrawalsEnabled)}
                <span className="font-medium">Withdrawals</span>
              </div>
              <span className={cn('font-bold', getStatusColor(settings.systemControls.withdrawalsEnabled))}>
                {settings.systemControls.withdrawalsEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(settings.systemControls.messagingEnabled)}
                <span className="font-medium">Messaging</span>
              </div>
              <span className={cn('font-bold', getStatusColor(settings.systemControls.messagingEnabled))}>
                {settings.systemControls.messagingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(settings.systemControls.profileUpdatesEnabled)}
                <span className="font-medium">Profile Updates</span>
              </div>
              <span className={cn('font-bold', getStatusColor(settings.systemControls.profileUpdatesEnabled))}>
                {settings.systemControls.profileUpdatesEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(settings.systemControls.loginEnabled)}
                <span className="font-medium">User Login</span>
              </div>
              <span className={cn('font-bold', getStatusColor(settings.systemControls.loginEnabled))}>
                {settings.systemControls.loginEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(!settings.systemControls.restrictedMode)}
                <span className="font-medium">Restricted Mode</span>
              </div>
              <span className={cn('font-bold', settings.systemControls.restrictedMode ? 'text-red-600' : 'text-green-600')}>
                {settings.systemControls.restrictedMode ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(settings.requireW8Ben)}
                <span className="font-medium">W-8 BEN Required</span>
              </div>
              <span className={cn('font-bold', getStatusColor(settings.requireW8Ben))}>
                {settings.requireW8Ben ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {settings.systemControls.restrictedMode && settings.systemControls.restrictionReason && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium mb-2">Restriction Reason:</p>
            <p className="text-red-700">{settings.systemControls.restrictionReason}</p>
          </div>
        )}

        {settings.systemControls.allowedPages.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Allowed Pages During Restriction:</p>
            <div className="flex flex-wrap gap-2">
              {settings.systemControls.allowedPages.map((page, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {page}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Financial Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
            Financial Settings
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Min Withdrawal</p>
            <p className="text-xl font-bold text-gray-900">${settings.minWithdrawal.toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Max Withdrawal</p>
            <p className="text-xl font-bold text-gray-900">${settings.maxWithdrawal.toLocaleString()}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Commission Rate</p>
            <p className="text-xl font-bold text-gray-900">{(settings.commissionRate * 100).toFixed(1)}%</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Auto Approval Limit</p>
            <p className="text-xl font-bold text-gray-900">${settings.autoApprovalLimit.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Last Updated */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Last Updated</p>
            <p className="font-medium text-gray-900">{formatDate(settings.updatedAt)}</p>
          </div>
          {settings.updatedBy && (
            <div className="text-right">
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Updated By</p>
              <p className="font-medium text-gray-900">{settings.updatedBy}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SystemSettingsPage;