import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, Zap, Shield, ArrowRight } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  onLogin: () => void;
  onUpgrade?: () => void;
  feature: string;
  requiresPro?: boolean;
  userPlan?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  isAuthenticated,
  onLogin,
  onUpgrade,
  feature,
  requiresPro = false,
  userPlan
}) => {
  // Check if user has required access
  const hasAccess = isAuthenticated && (!requiresPro || userPlan === 'pro' || userPlan === 'enterprise');

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show authentication required screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          
          <p className="text-gray-600 mb-6">
            Please sign in to access <strong>{feature}</strong> and start transforming your images with AI.
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What you'll get:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Free daily processing limits</li>
              <li>• Access to all AI tools</li>
              <li>• High-quality exports</li>
              <li>• Processing history</li>
            </ul>
          </div>

          <motion.button
            onClick={onLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>

          <p className="text-xs text-gray-500 mt-4">
            Free account • No credit card required
          </p>
        </motion.div>
      </div>
    );
  }

  // Show upgrade required screen
  if (requiresPro && !['pro', 'enterprise'].includes(userPlan || '')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pro Feature
          </h2>
          
          <p className="text-gray-600 mb-6">
            <strong>{feature}</strong> is available for Pro subscribers. Upgrade to unlock unlimited processing and premium features.
          </p>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-6 border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Pro Benefits:
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Unlimited image processing</li>
              <li>• 4K quality exports</li>
              <li>• Priority processing</li>
              <li>• Advanced features</li>
              <li>• API access</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <motion.button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Crown className="h-4 w-4" />
              <span>Upgrade to Pro</span>
            </motion.button>

            <button
              onClick={() => window.history.back()}
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
            >
              Go Back
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
            <Shield className="h-3 w-3" />
            <span>30-day money-back guarantee</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;