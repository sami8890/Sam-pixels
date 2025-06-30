import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, Zap, Shield, ArrowRight, Star, Check } from 'lucide-react';
import { User } from '../utils/auth';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  user: User;
  requiredPlan: 'free' | 'starter' | 'pro' | 'enterprise';
  feature: string;
  onUpgrade: () => void;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  user,
  requiredPlan,
  feature,
  onUpgrade
}) => {
  const planHierarchy = ['free', 'starter', 'pro', 'enterprise'];
  const userPlanIndex = planHierarchy.indexOf(user.subscription.plan);
  const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);

  // Check if user has access
  const hasAccess = userPlanIndex >= requiredPlanIndex && user.subscription.status === 'active';

  if (hasAccess) {
    return <>{children}</>;
  }

  const planFeatures = {
    starter: [
      '100 image processes/month',
      'All AI tools included',
      'HD quality exports',
      'Email support',
      'Basic watermarking'
    ],
    pro: [
      'Unlimited image processing',
      'All AI tools included',
      '4K quality exports',
      'Priority support',
      'Advanced watermarking',
      'Batch processing',
      'API access'
    ],
    enterprise: [
      'Everything in Pro',
      'White-label solution',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Advanced analytics',
      'Team management'
    ]
  };

  const planPrices = {
    starter: 9,
    pro: 19,
    enterprise: 49
  };

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
          {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} Feature
        </h2>
        
        <p className="text-gray-600 mb-6">
          <strong>{feature}</strong> requires a {requiredPlan} subscription or higher. 
          Upgrade to unlock this feature and many more.
        </p>

        {/* Current Plan Status */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Current Plan</span>
            <span className="text-sm text-gray-500 capitalize">{user.subscription.plan}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <span className={`text-sm font-medium ${
              user.subscription.status === 'active' 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {user.subscription.status}
            </span>
          </div>
        </div>

        {/* Upgrade Benefits */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-6 border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            <Star className="h-4 w-4" />
            {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} Benefits:
          </h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            {planFeatures[requiredPlan as keyof typeof planFeatures]?.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-900">
              ${planPrices[requiredPlan as keyof typeof planPrices]}
            </div>
            <div className="text-sm text-blue-700">per month</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Crown className="h-4 w-4" />
            <span>Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}</span>
            <ArrowRight className="h-4 w-4" />
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

        {/* Security Badge */}
        <div className="mt-4 text-xs text-gray-400">
          <div className="flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            <span>Secure payment processing</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionGuard;