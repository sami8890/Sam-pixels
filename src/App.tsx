import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ToolsDemo from './components/ToolsDemo';
import ErrorBoundary from './utils/errorBoundary';
import { ToastProvider } from './components/Toast';
import { SEO, HomePageSEO } from './utils/seo';
import { analytics } from './utils/analytics';
import { performanceMonitor } from './utils/performance';
import { security } from './utils/security';

interface User {
  name: string;
  email: string;
  plan?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'tools'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // Initialize analytics
    analytics.init();
    
    // Initialize security
    security.initCSP();
    
    // Monitor performance
    performanceMonitor.monitorResourceLoading();
    
    // Track page view
    analytics.trackPageView(currentPage);
    
    // Monitor Core Web Vitals
    performanceMonitor.getCoreWebVitals().then(vitals => {
      console.log('Core Web Vitals:', vitals);
    });

    // Check for saved user session
    const savedUser = localStorage.getItem('sampixel_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('sampixel_user');
      }
    }
  }, [currentPage]);

  const handleGetStarted = () => {
    analytics.track('get_started_clicked', { source: 'hero' });
    setCurrentPage('tools');
  };

  const handleTryDemo = () => {
    analytics.track('try_demo_clicked', { source: 'navbar' });
    setCurrentPage('tools');
  };

  const handleBackToHome = () => {
    analytics.track('back_to_home_clicked');
    setCurrentPage('home');
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('sampixel_user', JSON.stringify(userData));
    setIsLoginModalOpen(false);
    analytics.track('user_login', { email: userData.email });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sampixel_user');
    analytics.track('user_logout');
  };

  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleUpgrade = () => {
    // This will be handled by the Navbar component
  };

  if (currentPage === 'tools') {
    return (
      <HelmetProvider>
        <ErrorBoundary>
          <ToastProvider>
            <SEO
              title="AI Image Tools - SamPixel"
              description="Access our complete suite of AI-powered image processing tools"
              url="/tools"
            />
            <ToolsDemo 
              onBackToHome={handleBackToHome}
              isAuthenticated={!!user}
              onLogin={handleOpenLogin}
              onUpgrade={handleUpgrade}
              userPlan={user?.plan}
              user={user}
              onUserUpdate={setUser}
            />
          </ToastProvider>
        </ErrorBoundary>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ToastProvider>
          <HomePageSEO />
          <div className="font-inter">
            <Navbar 
              onGetStarted={handleGetStarted} 
              onTryDemo={handleTryDemo}
              user={user}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
            <Hero onGetStarted={handleGetStarted} onTryDemo={handleTryDemo} />
            <div className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <button
                  onClick={() => {
                    analytics.track('demo_button_clicked', { location: 'middle_section' });
                    setCurrentPage('tools');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Try Image Upload Demo
                </button>
              </div>
            </div>
            <Footer />
          </div>
        </ToastProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;