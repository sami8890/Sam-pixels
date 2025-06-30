import React, { useState } from 'react';
import { ArrowLeft, Scissors, Wand2, Type, Maximize2 } from 'lucide-react';
import ImageUploader from './ImageUploader';
import BackgroundRemover from './BackgroundRemover';
import ImageUpscaler from './ImageUpscaler';
import TextWatermark from './TextWatermark';
import CropResize from './CropResize';
import LoginModal from './LoginModal';

interface User {
  name: string;
  email: string;
  plan?: string;
}

interface ToolsDemoProps {
  onBackToHome: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onUpgrade?: () => void;
  userPlan?: string;
  user?: User | null;
  onUserUpdate?: (user: User) => void;
}

const ToolsDemo: React.FC<ToolsDemoProps> = ({ 
  onBackToHome, 
  isAuthenticated = false, 
  onLogin = () => {}, 
  onUpgrade = () => {},
  userPlan,
  user,
  onUserUpdate
}) => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const tools = [
    {
      id: 'background-remover',
      name: 'Background Remover',
      description: 'Remove backgrounds instantly with AI',
      icon: Scissors,
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-50 to-pink-50',
      borderColor: 'border-red-200',
      available: true,
      requiresAuth: true,
      apiProvider: 'Remove.bg / ClipDrop'
    },
    {
      id: 'image-upscaler',
      name: 'Image Upscaler',
      description: 'Enhance image quality with AI',
      icon: Wand2,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      available: true,
      requiresAuth: true,
      apiProvider: 'Waifu2x / Real-ESRGAN'
    },
    {
      id: 'text-watermark',
      name: 'Text Watermark',
      description: 'Add custom watermarks to images',
      icon: Type,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50',
      borderColor: 'border-purple-200',
      available: true,
      requiresAuth: true,
      apiProvider: 'Canvas API'
    },
    {
      id: 'crop-resize',
      name: 'Crop & Resize',
      description: 'Perfect sizing for any platform',
      icon: Maximize2,
      color: 'from-teal-500 to-blue-500',
      bgColor: 'from-teal-50 to-blue-50',
      borderColor: 'border-teal-200',
      available: true,
      requiresAuth: true,
      apiProvider: 'Canvas API'
    }
  ];

  const handleToolSelect = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool?.available) {
      if (tool.requiresAuth && !isAuthenticated) {
        setIsLoginModalOpen(true);
        return;
      }
      setSelectedTool(toolId);
      setUploadedFile(null);
    } else {
      alert(`${tool?.name} is coming soon! We're working hard to bring you this feature.`);
    }
  };

  const handleImageUpload = (file: File) => {
    setUploadedFile(file);
    console.log('Image uploaded:', file.name, file.size);
  };

  const handleImageRemove = () => {
    setUploadedFile(null);
  };

  const handleBackToTools = () => {
    setSelectedTool(null);
    setUploadedFile(null);
  };

  const handleLoginSuccess = (userData: User) => {
    onUserUpdate?.(userData);
    setIsLoginModalOpen(false);
  };

  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
  };

  // Render specific tool component
  if (selectedTool === 'background-remover') {
    return (
      <BackgroundRemover 
        onBackToTools={handleBackToTools} 
        isAuthenticated={isAuthenticated}
        onLogin={handleOpenLogin}
        onUpgrade={onUpgrade}
        userPlan={userPlan}
      />
    );
  }

  if (selectedTool === 'image-upscaler') {
    return (
      <ImageUpscaler 
        onBackToTools={handleBackToTools} 
        isAuthenticated={isAuthenticated}
        onLogin={handleOpenLogin}
        onUpgrade={onUpgrade}
        userPlan={userPlan}
      />
    );
  }

  if (selectedTool === 'text-watermark') {
    return (
      <TextWatermark 
        onBackToTools={handleBackToTools} 
        isAuthenticated={isAuthenticated}
        onLogin={handleOpenLogin}
        onUpgrade={onUpgrade}
        userPlan={userPlan}
      />
    );
  }

  if (selectedTool === 'crop-resize') {
    return (
      <CropResize 
        onBackToTools={handleBackToTools} 
        isAuthenticated={isAuthenticated}
        onLogin={handleOpenLogin}
        onUpgrade={onUpgrade}
        userPlan={userPlan}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-8 mx-auto"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </button>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Choose Your AI Tool
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Select from our powerful suite of AI-powered image processing tools
            </p>

            {/* Authentication Status */}
            {!isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-2xl mx-auto mb-8">
                <p className="text-yellow-800 font-medium">
                  🔒 Sign in required to use AI tools • Free daily limits available
                </p>
              </div>
            )}

            {isAuthenticated && userPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto mb-8">
                <p className="text-blue-800 font-medium">
                  ✨ {userPlan === 'pro' ? 'Pro Plan Active' : `${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan Active`} • 
                  {userPlan === 'pro' || userPlan === 'enterprise' ? ' Unlimited processing' : ' Free daily limits apply'}
                </p>
              </div>
            )}
          </div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className={`bg-gradient-to-br ${tool.bgColor} rounded-2xl p-6 border ${tool.borderColor} transition-all duration-300 cursor-pointer group ${
                  tool.available 
                    ? 'hover:shadow-xl hover:scale-105' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center mb-4 ${
                  tool.available ? 'group-hover:scale-110' : ''
                } transition-transform duration-200`}>
                  <tool.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tool.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {tool.description}
                </p>
                
                {/* API Provider */}
                <div className="text-xs text-gray-500 mb-2">
                  Powered by: {tool.apiProvider}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {tool.available && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      ✓ Available
                    </span>
                  )}
                  {tool.requiresAuth && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      🔒 Login Required
                    </span>
                  )}
                  {!tool.available && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Demo Upload Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Try Our Image Uploader</h2>
              <p className="text-gray-600">Experience the smooth upload process used across all our tools</p>
            </div>
            
            <ImageUploader
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              title=""
              subtitle=""
            />

            {uploadedFile && (
              <div className="mt-8 text-center">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Upload Successful!
                  </h3>
                  <p className="text-green-700 mb-4">
                    Your image "{uploadedFile.name}" is ready. {!isAuthenticated ? 'Sign in and select' : 'Select'} a tool above to start processing.
                  </p>
                  
                  {!isAuthenticated && (
                    <div className="mb-4">
                      <button
                        onClick={handleOpenLogin}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Sign In to Process Image
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                    <button
                      onClick={() => handleToolSelect('background-remover')}
                      className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Try Background Remover
                    </button>
                    <button
                      onClick={() => handleToolSelect('image-upscaler')}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Try Image Upscaler
                    </button>
                    <button
                      onClick={() => handleToolSelect('text-watermark')}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Try Text Watermark
                    </button>
                    <button
                      onClick={() => handleToolSelect('crop-resize')}
                      className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Try Crop & Resize
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* API Information */}
          <div className="mt-16 bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Powered by Industry-Leading APIs</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Background Removal</h4>
                <p className="text-sm text-gray-600">Remove.bg & ClipDrop APIs</p>
                <p className="text-xs text-gray-500 mt-1">Free: 10/day • Pro: Unlimited</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Image Upscaling</h4>
                <p className="text-sm text-gray-600">Waifu2x & Real-ESRGAN</p>
                <p className="text-xs text-gray-500 mt-1">Free: 5/day • Pro: Unlimited</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Text Watermark</h4>
                <p className="text-sm text-gray-600">Canvas API Processing</p>
                <p className="text-xs text-gray-500 mt-1">Free: 20/day • Pro: Unlimited</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Crop & Resize</h4>
                <p className="text-sm text-gray-600">Canvas API Processing</p>
                <p className="text-xs text-gray-500 mt-1">Free: 20/day • Pro: Unlimited</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLoginSuccess}
      />
    </>
  );
};

export default ToolsDemo;