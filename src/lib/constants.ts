export const APP_CONFIG = {
  name: 'Interactive Brokers Investor Portal',
  version: '1.0.0',
  description: 'Professional investor dashboard and portfolio management',
};

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  WITHDRAWALS: '/withdrawals',
  MESSAGES: '/messages',
  SUPPORT: '/support',
  ACCOUNT_CLOSURE: '/account-closure',
  SYSTEM_SETTINGS: '/system-settings',
};

export const WITHDRAWAL_CONFIG = {
  PLATFORM_FEE_PERCENTAGE: 15,
  MIN_WITHDRAWAL_AMOUNT: 100,
  MAX_WITHDRAWAL_AMOUNT: 50000,
};

export const SUPPORTED_COUNTRIES = {
  MEXICO: {
    code: 'MX',
    name: 'Mexico',
    currency: 'MXN',
    fields: ['accountNumber', 'bankName', 'swiftCode'],
  },
  FRANCE: {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    fields: ['iban', 'bankName', 'swiftCode'],
  },
  SWITZERLAND: {
    code: 'CH',
    name: 'Switzerland',
    currency: 'CHF',
    fields: ['iban', 'bankName', 'swiftCode'],
  },
  SAUDI_ARABIA: {
    code: 'SA',
    name: 'Saudi Arabia',
    currency: 'SAR',
    fields: ['iban', 'bankName', 'swiftCode'],
  },
  UAE: {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    fields: ['iban', 'bankName', 'swiftCode'],
  },
};

export const CRYPTO_NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'binance-smart-chain', name: 'Binance Smart Chain', symbol: 'BSC' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
];

export const TICKET_TYPES = [
  { value: 'account_issue', label: 'Account Issue' },
  { value: 'suspicious_activity', label: 'Suspicious Activity' },
  { value: 'information_modification', label: 'Information Modification' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'other', label: 'Other' },
];

export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
];