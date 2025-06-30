import React, { useState, useEffect } from 'react';
import { Image, ChevronDown, Menu, X } from 'lucide-react';
import LoginModal from './LoginModal';
import UserMenu from './UserMenu';
import StripePayment from './StripePayment';

interface User {
  name: string;
  email: string;
  plan?: string;
}

interface NavbarProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
  user?: User | null;
  onLogin?: (user: User) => void;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onGetStarted, 
  onTryDemo, 
  user, 
  onLogin, 
  onLogout 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tools = [
    { name: 'Background Remover', desc: 'Remove backgrounds instantly', available: true },
    { name: 'Image Upscaler', desc: 'Enhance image quality', available: true },
    { name: 'Text Watermark', desc: 'Add custom watermarks', available: true },
    { name: 'Crop & Resize', desc: 'Perfect sizing for any platform', available: true }
  ];

  const handleLogin = (userData: User) => {
    onLogin?.(userData);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    onLogout?.();
  };

  const handlePricing = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (plan: string) => {
    if (user && onLogin) {
      const updatedUser = { ...user, plan };
      onLogin(updatedUser);
    }
  };

  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
          : 'bg-white/10 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
                <Image className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                SamPixel
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                >
                  <span className="font-medium">Tools</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200/50 overflow-hidden z-50">
                    <div className="p-2">
                      {tools.map((tool, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (tool.available) {
                              onTryDemo();
                            } else {
                              alert(`${tool.name} is coming soon!`);
                            }
                            setIsDropdownOpen(false);
                          }}
                          className={`block w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                            tool.available 
                              ? 'hover:bg-gray-50 cursor-pointer' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-medium text-gray-900">{tool.name}</div>
                          <div className="text-sm text-gray-500">{tool.desc}</div>
                          {tool.available && (
                            <div className="text-xs text-green-600 mt-1">✓ Available</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handlePricing}
                className="font-medium transition-colors duration-200 text-gray-700 hover:text-blue-600"
              >
                Pricing
              </button>

              {/* User Authentication */}
              {user ? (
                <UserMenu 
                  user={user} 
                  onLogout={handleLogout} 
                  onUpgrade={() => setIsPaymentModalOpen(true)} 
                />
              ) : (
                <>
                  <button
                    onClick={handleOpenLogin}
                    className="font-medium transition-colors duration-200 text-gray-700 hover:text-blue-600"
                  >
                    Login
                  </button>
                  <button 
                    onClick={onGetStarted}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Try for Free
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200/50">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-900 mb-2">Tools</div>
                  {tools.map((tool, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (tool.available) {
                          onTryDemo();
                        } else {
                          alert(`${tool.name} is coming soon!`);
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors duration-200 ${
                        tool.available 
                          ? 'text-gray-600 hover:text-gray-900 cursor-pointer' 
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {tool.name}
                      {tool.available && <span className="text-green-600 ml-2">✓</span>}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    handlePricing();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Pricing
                </button>

                {/* Mobile User Menu */}
                {user ? (
                  <div className="px-3 py-2 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        {user.plan && (
                          <div className="text-xs text-blue-600 font-medium">{user.plan} Plan</div>
                        )}
                      </div>
                    </div>
                    {!user.plan && (
                      <button
                        onClick={() => {
                          setIsPaymentModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-blue-600 hover:text-blue-700 mb-2"
                      >
                        Upgrade to Pro
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        handleOpenLogin();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600"
                    >
                      Login
                    </button>
                    <div className="px-3 py-2">
                      <button 
                        onClick={() => {
                          onGetStarted();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg font-medium"
                      >
                        Try for Free
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* Stripe Payment Modal */}
      <StripePayment
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default Navbar;