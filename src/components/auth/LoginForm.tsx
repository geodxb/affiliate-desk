import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import LoadingScreen from '../common/LoadingScreen';
import { validateEmail } from '../../lib/utils';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState('');
  const [ipAccessDenied, setIpAccessDenied] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Check if IP access was denied by the Worker
    if (typeof window !== 'undefined' && (window as any).ipAccessDenied) {
      setIpAccessDenied(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log('Login attempt with:', { email, password: '***' });

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      console.log('Login successful');
      
      // Show loading screen for 5 seconds before navigating
      setShowLoadingScreen(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
      // Navigate to dashboard after successful login
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  // Show loading screen if authentication was successful
  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

  // Show IP access denied message
  if (ipAccessDenied) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md my-4"
        >
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Access Denied
              </h1>
              <p className="text-gray-600 mb-4">
                Your IP address is not authorized to access this portal.
              </p>
              <p className="text-sm text-gray-500">
                Please contact your administrator if you believe this is an error.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-600 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md my-4"
      >
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Logo and Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-2"
            >
              <img 
                src="/Interactive_Brokers-Logo.wine.png" 
                alt="Interactive Brokers" 
                className="w-full h-32 mx-auto object-contain"
              />
            </motion.div>
            
            {/* Blue line separator */}
            <div className="w-full h-1 bg-red-600 mb-6"></div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Investor Login
            </h1>
            <p className="text-gray-600">
              Please enter your investor or admin credentials
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-600 text-center">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-base bg-gray-50"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-base bg-gray-50"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Need help link */}
            <div className="text-right">
              <a href="#" className="text-red-600 hover:text-red-700 text-sm font-medium">
                Need help?
              </a>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {loading ? 'Signing In...' : 'Login'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 text-center">
            <p className="text-xs text-gray-500">
              Interactive Brokers LLC | Regulated by SEC, FINRA, CFTC
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;