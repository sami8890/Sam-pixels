import React from 'react';
import { Play, ArrowRight } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted, onTryDemo }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-teal-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Your AI Image Toolkit —
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Fast, Free & Stunning
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Remove backgrounds, upscale quality, add watermarks, and crop for social — all in one app.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={onGetStarted}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </button>
              
              <button 
                onClick={onTryDemo}
                className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <Play className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  Try a Demo
                </span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 text-gray-500">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full border-2 border-white shadow-sm"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full border-2 border-white shadow-sm"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <span className="text-sm font-medium">Trusted by 10k+ users</span>
              </div>
              <div className="text-sm font-medium">
                ⭐ 4.9/5 rating
              </div>
            </div>
          </div>

          {/* Right Column - Hero Illustration */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100">
              {/* Mock Dashboard */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="ml-auto text-gray-400 text-sm font-medium">SamPixel Dashboard</div>
                </div>

                {/* Tool Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg mb-3 flex items-center justify-center">
                      <div className="w-5 h-5 bg-white rounded opacity-80"></div>
                    </div>
                    <h3 className="text-gray-800 font-semibold text-sm mb-1">Background Remove</h3>
                    <p className="text-gray-500 text-xs">AI-powered removal</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mb-3 flex items-center justify-center">
                      <div className="w-5 h-5 bg-white rounded opacity-80"></div>
                    </div>
                    <h3 className="text-gray-800 font-semibold text-sm mb-1">Image Upscaler</h3>
                    <p className="text-gray-500 text-xs">AI enhancement</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg mb-3 flex items-center justify-center">
                      <div className="w-5 h-5 bg-white rounded opacity-80"></div>
                    </div>
                    <h3 className="text-gray-800 font-semibold text-sm mb-1">Text Watermark</h3>
                    <p className="text-gray-500 text-xs">Available now</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg mb-3 flex items-center justify-center">
                      <div className="w-5 h-5 bg-white rounded opacity-80"></div>
                    </div>
                    <h3 className="text-gray-800 font-semibold text-sm mb-1">Crop & Resize</h3>
                    <p className="text-gray-500 text-xs">Available now</p>
                  </div>
                </div>

                {/* Sample Image Preview */}
                <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 text-sm font-medium">Processing image...</span>
                  </div>
                  <div className="w-full h-16 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-blue-200/40 to-indigo-200/40 rounded-full blur-xl animate-bounce"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-teal-200/40 to-blue-200/40 rounded-full blur-xl animate-bounce delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;