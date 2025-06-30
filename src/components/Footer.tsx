import React from 'react';
import { Image, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  const handleSocialClick = (platform: string) => {
    alert(`${platform} profile will be available soon!`);
  };

  const handleLinkClick = (section: string) => {
    alert(`${section} section will be available soon!`);
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Side - Logo & Tagline */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
                <Image className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">SamPixel</span>
            </div>
            <p className="text-gray-400 text-lg mb-6">
              One click, perfect pixels.
            </p>
          </div>

          {/* Right Side - Links & Social */}
          <div className="grid sm:grid-cols-2 gap-8">
            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => handleLinkClick('Tools')}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                  >
                    Tools
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleLinkClick('API')}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                  >
                    API
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleLinkClick('Pricing')}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                  >
                    Pricing
                  </button>
                </li>
              </ul>
            </div>

            {/* Creators & Social */}
            <div>
              <h3 className="text-white font-semibold mb-4">The Creators</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSocialClick('LinkedIn')}
                  className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 group"
                >
                  <Linkedin className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-200" />
                </button>
                <button
                  onClick={() => handleSocialClick('Twitter')}
                  className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 group"
                >
                  <Twitter className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-200" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 SamPixel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;