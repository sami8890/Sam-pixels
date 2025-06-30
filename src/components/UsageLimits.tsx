import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Crown, RefreshCw } from 'lucide-react';
import { APIUsageTracker } from '../api/freeApis';

interface UsageLimitsProps {
  apiName: string;
  onUpgrade?: () => void;
}

const UsageLimits: React.FC<UsageLimitsProps> = ({ apiName, onUpgrade }) => {
  const remaining = APIUsageTracker.getRemainingUsage(apiName);
  const usage = APIUsageTracker.getUsage();
  const currentUsage = usage[apiName]?.count || 0;
  
  const limits: Record<string, { total: number; name: string }> = {
    'background-removal': { total: 10, name: 'Background Removal' },
    'image-upscaling': { total: 5, name: 'Image Upscaling' },
    'image-transform': { total: 20, name: 'Image Transform' },
  };

  const limit = limits[apiName];
  if (!limit) return null;

  const percentage = (currentUsage / limit.total) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = remaining === 0;

  if (isAtLimit) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900">Daily Limit Reached</h3>
            <p className="text-red-700 text-sm">
              You've used all {limit.total} {limit.name} credits for today
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            onClick={onUpgrade}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Crown className="h-4 w-4" />
            Upgrade for Unlimited
          </motion.button>
          
          <div className="flex items-center gap-2 text-sm text-red-600">
            <RefreshCw className="h-4 w-4" />
            <span>Resets tomorrow</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-blue-900">Daily Usage</h4>
        <span className="text-sm text-blue-700">
          {currentUsage} / {limit.total} used
        </span>
      </div>
      
      <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
        <motion.div
          className={`h-2 rounded-full ${
            isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className={`${isNearLimit ? 'text-yellow-700' : 'text-blue-700'}`}>
          {remaining} credits remaining
        </span>
        
        {isNearLimit && (
          <button
            onClick={onUpgrade}
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Upgrade for unlimited
          </button>
        )}
      </div>
    </div>
  );
};

export default UsageLimits;