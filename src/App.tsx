import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import InvestorLayout from './components/layout/InvestorLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import InvestorDashboardPage from './pages/dashboard/InvestorDashboardPage';
import InvestorProfilePage from './pages/profile/InvestorProfilePage';
import WithdrawalPage from './pages/withdrawals/WithdrawalPage';
import MessagesPage from './pages/messages/MessagesPage';
import SupportPage from './pages/support/SupportPage';
import AccountClosurePage from './pages/account-closure/AccountClosurePage';
import SystemSettingsPage from './pages/system/SystemSettingsPage';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen font-sans antialiased bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <InvestorLayout>
                      <InvestorDashboardPage />
                    </InvestorLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <InvestorLayout>
                      <InvestorProfilePage />
                    </InvestorLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/withdrawals" 
                element={
                  <ProtectedRoute>
                    <InvestorLayout>
                      <WithdrawalPage />
                    </InvestorLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute>
                    <InvestorLayout>
                      <MessagesPage />
                    </InvestorLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/support" 
                element={
                  <ProtectedRoute>
                    <InvestorLayout>
                      <SupportPage />
                    </InvestorLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/account-closure" 
                element={
                  <ProtectedRoute>
                    <InvestorLayout>
                      <AccountClosurePage />
                    </InvestorLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/system-settings" 
                element={
                  <ProtectedRoute>
                    <InvestorLayout>
                      <SystemSettingsPage />
                    </InvestorLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;