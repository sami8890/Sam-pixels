import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown, Crown, Image as ImageIcon } from 'lucide-react';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    plan?: string;
  };
  onLogout: () => void;
  onUpgrade: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onUpgrade }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (action: string) => {
    setIsOpen(false);
    
    switch (action) {
      case 'profile':
        alert('Profile settings will be available soon!');
        break;
      case 'settings':
        alert('Account settings will be available soon!');
        break;
      case 'upgrade':
        onUpgrade();
        break;
      case 'logout':
        onLogout();
        break;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanColor = (plan?: string) => {
    switch (plan) {
      case 'pro': return 'text-blue-600';
      case 'enterprise': return 'text-purple-600';
      default: return 'text-gray-500';
    }
  };

  const getPlanBadge = (plan?: string) => {
    if (!plan) return null;
    
    const colors = {
      starter: 'bg-green-100 text-green-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };

    return (
      <div className={`text-xs font-medium px-2 py-1 rounded-full ${colors[plan as keyof typeof colors] || colors.starter}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </div>
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {getInitials(user.name)}
        </div>
        
        {/* User Info */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 truncate max-w-32">
            {user.name}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 truncate max-w-24">
              {user.email}
            </div>
            {user.plan && getPlanBadge(user.plan)}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  {user.plan && (
                    <div className="mt-1">
                      {getPlanBadge(user.plan)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => handleMenuClick('profile')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">Profile Settings</span>
              </button>

              <button
                onClick={() => handleMenuClick('settings')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">Account Settings</span>
              </button>

              {/* Upgrade to Pro */}
              {!user.plan && (
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={() => handleMenuClick('upgrade')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-all duration-200 group"
                  >
                    <Crown className="h-4 w-4 text-yellow-500 group-hover:text-yellow-600" />
                    <div>
                      <div className="text-gray-700 font-medium">Upgrade to Pro</div>
                      <div className="text-xs text-gray-500">Unlimited processing</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Current Plan Info */}
              {user.plan && (
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Current Plan</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 capitalize">{user.plan}</div>
                    <div className="text-xs text-gray-500">Active subscription</div>
                  </div>
                </div>
              )}

              {/* Logout */}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => handleMenuClick('logout')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors duration-200 group"
                >
                  <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                  <span className="text-gray-700 group-hover:text-red-600">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;