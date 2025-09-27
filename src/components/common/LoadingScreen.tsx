import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center z-50">
      {/* Spinning Logo */}
      <div className="mb-12">
        <motion.img 
          src="/interactive-brokers-logo.png" 
          alt="Interactive Brokers" 
          className="w-24 h-24 object-contain drop-shadow-lg"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center max-w-md px-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          We're preparing your dashboard
        </h2>
        <p className="text-gray-600 mb-8 text-lg">
          Please wait while we load your portfolio data
        </p>
        <div className="flex items-center justify-center space-x-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            className="w-3 h-3 bg-blue-600 rounded-full shadow-sm"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            className="w-3 h-3 bg-blue-600 rounded-full shadow-sm"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            className="w-3 h-3 bg-blue-600 rounded-full shadow-sm"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;