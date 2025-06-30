import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, RefreshCw, CheckCircle, AlertCircle, Scissors, Zap, Sparkles } from 'lucide-react';
import ImageUploader from './ImageUploader';
import AuthGuard from './AuthGuard';
import UsageLimits from './UsageLimits';
import { useToast } from './Toast';
import { BackgroundRemovalAPI, APIUsageTracker } from '../api/freeApis';
import { analytics } from '../utils/analytics';

interface BackgroundRemoverProps {
  onBackToTools: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onUpgrade?: () => void;
  userPlan?: string;
}

interface ProcessingState {
  isUploading: boolean;
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
}

interface ProcessedResult {
  originalUrl: string;
  processedUrl: string;
  fileName: string;
}

const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({ 
  onBackToTools, 
  isAuthenticated, 
  onLogin, 
  onUpgrade,
  userPlan 
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isUploading: false,
    isProcessing: false,
    isComplete: false,
    error: null
  });
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const { success, error: showError } = useToast();

  const handleImageUpload = async (file: File) => {
    // Check usage limits for free users
    if (userPlan !== 'pro' && userPlan !== 'enterprise') {
      if (!APIUsageTracker.trackUsage('background-removal')) {
        showError('Daily limit reached', 'You\'ve used all your free background removal credits for today.');
        return;
      }
    }

    setUploadedFile(file);
    setProcessingState({
      isUploading: true,
      isProcessing: false,
      isComplete: false,
      error: null
    });

    analytics.trackImageUpload(file.size, file.type);

    try {
      // Step 1: Upload simulation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const originalUrl = URL.createObjectURL(file);

      setProcessingState(prev => ({
        ...prev,
        isUploading: false,
        isProcessing: true
      }));

      // Step 2: Process with real API
      const startTime = Date.now();
      const apiResult = await BackgroundRemovalAPI.removeBackground(file);
      const processingTime = Date.now() - startTime;

      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Background removal failed');
      }

      setResult({
        originalUrl,
        processedUrl: apiResult.data!,
        fileName: file.name.replace(/\.[^/.]+$/, '') + '_no_bg.png'
      });

      setProcessingState({
        isUploading: false,
        isProcessing: false,
        isComplete: true,
        error: null
      });

      analytics.trackToolUsage('background-removal', processingTime);
      success('Background removed successfully!', 'Your image is ready for download.');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      
      setProcessingState({
        isUploading: false,
        isProcessing: false,
        isComplete: false,
        error: errorMessage
      });

      analytics.trackError(errorMessage, 'background-removal');
      showError('Processing failed', errorMessage);
    }
  };

  const handleImageRemove = () => {
    setUploadedFile(null);
    setResult(null);
    setProcessingState({
      isUploading: false,
      isProcessing: false,
      isComplete: false,
      error: null
    });
  };

  const handleRetry = () => {
    if (uploadedFile) {
      handleImageUpload(uploadedFile);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    try {
      const link = document.createElement('a');
      link.href = result.processedUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      analytics.track('image_download', { tool: 'background-removal' });
      success('Download started!', 'Your processed image is being downloaded.');
    } catch (error) {
      console.error('Download failed:', error);
      showError('Download failed', 'Please try again.');
    }
  };

  const isProcessingActive = processingState.isUploading || processingState.isProcessing;

  return (
    <AuthGuard
      isAuthenticated={isAuthenticated}
      onLogin={onLogin}
      onUpgrade={onUpgrade}
      feature="Background Remover"
      userPlan={userPlan}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={onBackToTools}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-6"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Tools
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Background Remover</h1>
                <p className="text-gray-600">Remove backgrounds instantly with AI-powered precision</p>
              </div>
            </div>

            {/* API Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Powered by Remove.bg & ClipDrop APIs</span>
              </div>
              <p className="text-xs text-blue-700">
                Using industry-leading AI models for professional background removal
              </p>
            </div>
          </div>

          {/* Usage Limits */}
          {userPlan !== 'pro' && userPlan !== 'enterprise' && (
            <UsageLimits apiName="background-removal" onUpgrade={onUpgrade} />
          )}

          {/* Upload Section */}
          {!uploadedFile && (
            <ImageUploader
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              title="Upload Image for Background Removal"
              subtitle="Our AI will automatically detect and remove the background"
              className="mb-8"
            />
          )}

          {/* Processing State */}
          <AnimatePresence>
            {isProcessingActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 mb-8"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-red-600 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {processingState.isUploading ? 'Uploading image...' : 'Removing background...'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {processingState.isUploading 
                      ? 'Preparing your image for processing' 
                      : 'Our AI is analyzing and removing the background'
                    }
                  </p>
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <Zap className="h-4 w-4" />
                    <span>AI processing in progress...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {processingState.error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl border border-red-200 shadow-lg p-8 mb-8"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Failed</h3>
                  <p className="text-gray-600 mb-6 max-w-md">{processingState.error}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                    <button
                      onClick={handleImageRemove}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                    >
                      Upload New Image
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success State - Before & After */}
          <AnimatePresence>
            {processingState.isComplete && result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">Background Removed Successfully!</h3>
                      <p className="text-green-700">Your image is ready for download with transparent background</p>
                    </div>
                  </div>
                </div>

                {/* Before & After Comparison */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Before & After</h3>
                    <p className="text-gray-600">Compare your original image with the background-removed version</p>
                  </div>

                  <div className="p-6">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Original Image */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700 text-center">Original</h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <img
                            src={result.originalUrl}
                            alt="Original"
                            className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Processed Image */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700 text-center">Background Removed</h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                          {/* Checkered background to show transparency */}
                          <div 
                            className="absolute inset-4 rounded-lg opacity-20"
                            style={{
                              backgroundImage: `
                                linear-gradient(45deg, #ccc 25%, transparent 25%), 
                                linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                                linear-gradient(45deg, transparent 75%, #ccc 75%), 
                                linear-gradient(-45deg, transparent 75%, #ccc 75%)
                              `,
                              backgroundSize: '20px 20px',
                              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                            }}
                          />
                          <img
                            src={result.processedUrl}
                            alt="Background Removed"
                            className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg relative z-10"
                          />
                          {/* Quality indicator */}
                          <div className="absolute top-2 left-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Processed
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className="h-5 w-5" />
                        Download PNG
                      </motion.button>
                      <button
                        onClick={handleImageRemove}
                        className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                      >
                        Process Another Image
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthGuard>
  );
};

export default BackgroundRemover;