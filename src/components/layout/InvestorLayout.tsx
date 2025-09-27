import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  CreditCard,
  MessageCircle,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Building2,
  UserX,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSystemControls } from '../../hooks/useSystemControls';
import Button from '../common/Button';
import SystemRestrictionBanner from '../banners/SystemRestrictionBanner';
import { ROUTES } from '../../lib/constants';

interface InvestorLayoutProps {
  children: React.ReactNode;
}

const InvestorLayout: React.FC<InvestorLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { userProfile, logout } = useAuth();
  const { systemSettings } = useSystemControls();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      name: 'Profile',
      href: ROUTES.PROFILE,
      icon: User,
    },
    {
      name: 'Withdrawals',
      href: ROUTES.WITHDRAWALS,
      icon: CreditCard,
    },
    {
      name: 'Messages',
      href: ROUTES.MESSAGES,
      icon: MessageCircle,
    },
    {
      name: 'Support',
      href: ROUTES.SUPPORT,
      icon: HelpCircle,
    },
    {
      name: 'Account Closure',
      href: ROUTES.ACCOUNT_CLOSURE,
      icon: UserX,
    },
    {
      name: 'System Settings',
      href: ROUTES.SYSTEM_SETTINGS,
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActiveRoute = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24 lg:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0 min-w-0">
              <img 
                src="/Interactive_Brokers-Logo.wine.png" 
                alt="Interactive Brokers" 
                className="h-20 lg:h-28 w-auto object-contain flex-shrink-0"
              />
              <div className="flex items-center space-x-2 min-w-0">
                <span className="hidden md:inline-block text-xs lg:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">PortfolioAnalyst</span>
                <span className="hidden md:inline-block text-xs lg:text-sm text-white bg-gray-800 px-2 lg:px-3 py-1 rounded font-medium whitespace-nowrap">AFFILIATE</span>
              </div>
            </div>

            {/* Center Navigation */}
            <div className="hidden lg:flex items-center space-x-8 xl:space-x-10 flex-1 justify-center max-w-5xl mx-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.href);

                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={`text-sm font-medium transition-colors relative whitespace-nowrap px-3 py-2 ${
                      active
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                    {active && (
                      <div className="absolute -bottom-7 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right side - Notifications and User */}
            <div className="flex items-center space-x-4">
              {/* User info */}
              <div className="hidden lg:flex items-center space-x-2 min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate max-w-40">
                  {userProfile?.firstName} {userProfile?.lastName}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <motion.div
          initial={false}
          animate={{
            height: mobileMenuOpen ? 'auto' : 0,
            opacity: mobileMenuOpen ? 1 : 0,
          }}
          className="lg:hidden overflow-hidden bg-white border-t border-gray-200"
        >
          <div className="px-4 py-4 space-y-2 max-h-96 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);

              return (
                <motion.button
                  key={item.name}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigate(item.href);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium uppercase tracking-wide text-xs whitespace-nowrap">
                    {item.name}
                  </span>
                </motion.button>
              );
            })}
            
            {/* Mobile user section */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userProfile?.email}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1">
        <main className="p-6">
          <SystemRestrictionBanner />
          
          {children}
        </main>
      </div>
    </div>
  );
};

export default InvestorLayout;