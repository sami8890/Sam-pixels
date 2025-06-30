import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, RefreshCw, CheckCircle, AlertCircle, Wand2, Zap, Sparkles } from 'lucide-react';
import ImageUploader from './ImageUploader';
import AuthGuard from './AuthGuard';
import UsageLimits from './UsageLimits';
import { useToast } from './Toast';
import { ImageUpscalingAPI, APIUsageTracker } from '../api/freeApis';
import { analytics } from '../utils/analytics';

interface ImageUpscalerProps {
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
  scale: number;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
}

const ImageUpscaler: React.FC<ImageUpscalerProps> = ({ 
  onBackToTools, 
  isAuthenticated, 
  onLogin, 
  onUpgrade,
  userPlan 
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedScale, setSelectedScale] = useState<number>(4);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isUploading: false,
    isProcessing: false,
    isComplete: false,
    error: null
  });
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const { success, error: showError } = useToast();

  const scaleOptions = [
    { value: 2, label: '2x', description: 'Double size', time: 'Fast', free: true },
    { value: 4, label: '4x', description: 'Quadruple size', time: 'Medium', free: true },
    { value: 8, label: '8x', description: 'Maximum quality', time: 'Slower', free: false }
  ];

  const handleImageUpload = async (file: File) => {
    // Check usage limits for free users
    if (userPlan !== 'pro' && userPlan !== 'enterprise') {
      if (!APIUsageTracker.trackUsage('image-upscaling')) {
        showError('Daily limit reached', 'You\'ve used all your free upscaling credits for today.');
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

      // Get original image dimensions
      const img = new Image();
      img.onload = async () => {
        const originalDimensions = { width: img.width, height: img.height };

        setProcessingState(prev => ({
          ...prev,
          isUploading: false,
          isProcessing: true
        }));

        try {
          // Step 2: Process with real API
          const startTime = Date.now();
          let apiResult;

          if (selectedScale <= 4) {
            // Use Waifu2x for smaller scales (free)
            apiResult = await ImageUpscalingAPI.upscaleImageWaifu2x(file);
          } else {
            // Use Replicate for higher scales (requires API key)
            apiResult = await ImageUpscalingAPI.upscaleImage(file, selectedScale);
          }

          const processingTime = Date.now() - startTime;

          if (!apiResult.success) {
            throw new Error(apiResult.error || 'Image upscaling failed');
          }

          // Calculate new dimensions
          const newDimensions = {
            width: originalDimensions.width * selectedScale,
            height: originalDimensions.height * selectedScale
          };

          setResult({
            originalUrl,
            processedUrl: apiResult.data!,
            fileName: file.name.replace(/\.[^/.]+$/, '') + `_${selectedScale}x.png`,
            scale: selectedScale,
            originalDimensions,
            newDimensions
          });

          setProcessingState({
            isUploading: false,
            isProcessing: false,
            isComplete: true,
            error: null
          });

          analytics.trackToolUsage('image-upscaling', processingTime);
          success('Image upscaled successfully!', `Enhanced to ${selectedScale}x resolution.`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upscale image. Please try again.';
          
          setProcessingState({
            isUploading: false,
            isProcessing: false,
            isComplete: false,
            error: errorMessage
          });

          analytics.trackError(errorMessage, 'image-upscaling');
          showError('Processing failed', errorMessage);
        }
      };
      img.src = originalUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      
      setProcessingState({
        isUploading: false,
        isProcessing: false,
        isComplete: false,
        error: errorMessage
      });

      analytics.trackError(errorMessage, 'image-upscaling');
      showError('Upload failed', errorMessage);
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

      analytics.track('image_download', { tool: 'image-upscaling', scale: result.scale });
      success('Download started!', 'Your upscaled image is being downloaded.');
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
      feature="Image Upscaler"
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
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Image Upscaler</h1>
                <p className="text-gray-600">Enhance image quality and resolution with AI-powered upscaling</p>
              </div>
            </div>

            {/* API Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Powered by Waifu2x & Real-ESRGAN APIs</span>
              </div>
              <p className="text-xs text-blue-700">
                Using advanced AI models for professional image enhancement and upscaling
              </p>
            </div>
          </div>

          {/* Usage Limits */}
          {userPlan !== 'pro' && userPlan !== 'enterprise' && (
            <UsageLimits apiName="image-upscaling" onUpgrade={onUpgrade} />
          )}

          {/* Upload Section */}
          {!uploadedFile && (
            <div className="mb-8">
              <ImageUploader
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                title="Upload Image for Upscaling"
                subtitle="Our AI will enhance the quality and increase the resolution"
                className="mb-8"
              />
            </div>
          )}

          {/* Scale Selection */}
          {uploadedFile && !processingState.isComplete && !processingState.error && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Upscaling Factor</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {scaleOptions.map((option) => {
                  const isDisabled = !option.free && userPlan !== 'pro' && userPlan !== 'enterprise';
                  
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => !isDisabled && setSelectedScale(option.value)}
                      disabled={isProcessingActive || isDisabled}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 relative ${
                        selectedScale === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'
                      } ${isProcessingActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={!isProcessingActive && !isDisabled ? { scale: 1.02 } : {}}
                      whileTap={!isProcessingActive && !isDisabled ? { scale: 0.98 } : {}}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{option.label}</div>
                        <div className="text-sm text-gray-600 mb-1">{option.description}</div>
                        <div className="text-xs text-blue-600 font-medium">{option.time}</div>
                        {!option.free && (
                          <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                            Pro
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
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
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {processingState.isUploading ? 'Uploading image...' : `Upscaling image ${selectedScale}x...`}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {processingState.isUploading 
                      ? 'Preparing your image for processing' 
                      : `Enhancing quality and increasing resolution by ${selectedScale}x`
                    }
                  </p>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upscaling Failed</h3>
                  <p className="text-gray-600 mb-6 max-w-md">{processingState.error}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200"
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
                      <h3 className="text-lg font-semibold text-green-900">Image Upscaled Successfully!</h3>
                      <p className="text-green-700">
                        Enhanced from {result.originalDimensions.width}×{result.originalDimensions.height} to {result.newDimensions.width}×{result.newDimensions.height} pixels
                      </p>
                    </div>
                  </div>
                </div>

                {/* Before & After Comparison */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Before & After</h3>
                    <p className="text-gray-600">Compare your original image with the {result.scale}x upscaled version</p>
                  </div>

                  <div className="p-6">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Original Image */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-700">Original</h4>
                          <span className="text-xs text-gray-500">
                            {result.originalDimensions.width} × {result.originalDimensions.height}px
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <img
                            src={result.originalUrl}
                            alt="Original"
                            className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Upscaled Image */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-700">Upscaled {result.scale}x</h4>
                          <span className="text-xs text-gray-500">
                            {result.newDimensions.width} × {result.newDimensions.height}px
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                          <img
                            src={result.processedUrl}
                            alt="Upscaled"
                            className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg"
                          />
                          {/* Quality indicator */}
                          <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Enhanced
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
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className="h-5 w-5" />
                        Download Upscaled Image
                      </motion.button>
                      <button
                        onClick={handleImageRemove}
                        className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                      >
                        Upscale Another Image
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

export default ImageUpscaler;