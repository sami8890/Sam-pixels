import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, RefreshCw, CheckCircle, AlertCircle, Type, Settings } from 'lucide-react';
import ImageUploader from './ImageUploader';
import AuthGuard from './AuthGuard';
import UsageLimits from './UsageLimits';
import { useToast } from './Toast';
import { APIUsageTracker } from '../api/freeApis';
import { analytics } from '../utils/analytics';

interface TextWatermarkProps {
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

interface WatermarkSettings {
  text: string;
  fontSize: number;
  opacity: number;
  color: string;
  position: { x: number; y: number };
  fontFamily: string;
  fontWeight: string;
}

interface ProcessedResult {
  originalUrl: string;
  processedUrl: string;
  fileName: string;
  settings: WatermarkSettings;
}

const TextWatermark: React.FC<TextWatermarkProps> = ({ 
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
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    text: 'SamPixel',
    fontSize: 48,
    opacity: 0.7,
    color: '#ffffff',
    position: { x: 50, y: 50 },
    fontFamily: 'Inter',
    fontWeight: 'bold'
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { success, error: showError } = useToast();

  const fontOptions = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier New', label: 'Courier New' }
  ];

  const fontWeightOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Bold' },
    { value: '300', label: 'Light' },
    { value: '600', label: 'Semi Bold' },
    { value: '900', label: 'Black' }
  ];

  const presetPositions = [
    { label: 'Top Left', x: 10, y: 10 },
    { label: 'Top Right', x: 90, y: 10 },
    { label: 'Center', x: 50, y: 50 },
    { label: 'Bottom Left', x: 10, y: 90 },
    { label: 'Bottom Right', x: 90, y: 90 }
  ];

  const handleImageUpload = async (file: File) => {
    // Check usage limits for free users
    if (userPlan !== 'pro' && userPlan !== 'enterprise') {
      if (!APIUsageTracker.trackUsage('image-transform')) {
        showError('Daily limit reached', 'You\'ve used all your free watermarking credits for today.');
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
      // Step 1: Mock upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const originalUrl = URL.createObjectURL(file);
      
      setProcessingState(prev => ({
        ...prev,
        isUploading: false
      }));

      // Auto-generate watermarked image
      generateWatermarkedImage(originalUrl, file);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      
      setProcessingState({
        isUploading: false,
        isProcessing: false,
        isComplete: false,
        error: errorMessage
      });

      analytics.trackError(errorMessage, 'text-watermark');
      showError('Upload failed', errorMessage);
    }
  };

  const generateWatermarkedImage = async (originalUrl: string, file: File) => {
    setProcessingState(prev => ({
      ...prev,
      isProcessing: true
    }));

    try {
      const startTime = Date.now();
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create canvas and apply watermark
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const img = new Image();
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Apply watermark
        ctx.font = `${watermarkSettings.fontWeight} ${watermarkSettings.fontSize}px ${watermarkSettings.fontFamily}`;
        ctx.fillStyle = watermarkSettings.color;
        ctx.globalAlpha = watermarkSettings.opacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate position
        const x = (watermarkSettings.position.x / 100) * canvas.width;
        const y = (watermarkSettings.position.y / 100) * canvas.height;

        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText(watermarkSettings.text, x, y);

        // Get processed image URL
        const processedUrl = canvas.toDataURL('image/png');
        const processingTime = Date.now() - startTime;

        setResult({
          originalUrl,
          processedUrl,
          fileName: file.name.replace(/\.[^/.]+$/, '') + '_watermarked.png',
          settings: { ...watermarkSettings }
        });

        setProcessingState({
          isUploading: false,
          isProcessing: false,
          isComplete: true,
          error: null
        });

        analytics.trackToolUsage('text-watermark', processingTime);
        success('Watermark applied successfully!', 'Your image is ready for download.');
      };

      img.onerror = () => {
        throw new Error('Failed to load image');
      };

      img.src = originalUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply watermark. Please try again.';
      
      setProcessingState({
        isUploading: false,
        isProcessing: false,
        isComplete: false,
        error: errorMessage
      });

      analytics.trackError(errorMessage, 'text-watermark');
      showError('Processing failed', errorMessage);
    }
  };

  const handleSettingChange = (key: keyof WatermarkSettings, value: any) => {
    setWatermarkSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Re-generate watermarked image if we have an uploaded file
    if (uploadedFile && result) {
      const newSettings = { ...watermarkSettings, [key]: value };
      setWatermarkSettings(newSettings);
      
      // Debounce the regeneration
      setTimeout(() => {
        generateWatermarkedImage(result.originalUrl, uploadedFile);
      }, 300);
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

      analytics.track('image_download', { tool: 'text-watermark' });
      success('Download started!', 'Your watermarked image is being downloaded.');
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
      feature="Text Watermark"
      userPlan={userPlan}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Type className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Text Watermark</h1>
                <p className="text-gray-600">Add custom text watermarks to protect your images</p>
              </div>
            </div>
          </div>

          {/* Usage Limits */}
          {userPlan !== 'pro' && userPlan !== 'enterprise' && (
            <UsageLimits apiName="image-transform" onUpgrade={onUpgrade} />
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Upload & Settings */}
            <div className="lg:col-span-1 space-y-6">
              {/* Upload Section */}
              {!uploadedFile && (
                <ImageUploader
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                  title="Upload Image"
                  subtitle="Add watermarks to protect your content"
                />
              )}

              {/* Watermark Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Watermark Settings</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Text Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={watermarkSettings.text}
                        onChange={(e) => handleSettingChange('text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter watermark text"
                      />
                    </div>

                    {/* Font Family */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Family
                      </label>
                      <select
                        value={watermarkSettings.fontFamily}
                        onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {fontOptions.map(font => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Weight
                      </label>
                      <select
                        value={watermarkSettings.fontWeight}
                        onChange={(e) => handleSettingChange('fontWeight', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {fontWeightOptions.map(weight => (
                          <option key={weight.value} value={weight.value}>{weight.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size: {watermarkSettings.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="120"
                        value={watermarkSettings.fontSize}
                        onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Opacity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opacity: {Math.round(watermarkSettings.opacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={watermarkSettings.opacity}
                        onChange={(e) => handleSettingChange('opacity', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={watermarkSettings.color}
                          onChange={(e) => handleSettingChange('color', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={watermarkSettings.color}
                          onChange={(e) => handleSettingChange('color', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Position Presets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Positions
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {presetPositions.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => handleSettingChange('position', { x: preset.x, y: preset.y })}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Preview & Results */}
            <div className="lg:col-span-2">
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
                      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {processingState.isUploading ? 'Uploading image...' : 'Applying watermark...'}
                      </h3>
                      <p className="text-gray-600">
                        {processingState.isUploading 
                          ? 'Preparing your image for watermarking' 
                          : 'Adding your custom text watermark'
                        }
                      </p>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Watermarking Failed</h3>
                      <p className="text-gray-600 mb-6">{processingState.error}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleRetry}
                          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200"
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

              {/* Success State - Preview & Download */}
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
                          <h3 className="text-lg font-semibold text-green-900">Watermark Applied Successfully!</h3>
                          <p className="text-green-700">Your image is ready for download</p>
                        </div>
                      </div>
                    </div>

                    {/* Before & After Comparison */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Before & After</h3>
                        <p className="text-gray-600">Compare your original image with the watermarked version</p>
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

                          {/* Watermarked Image */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 text-center">With Watermark</h4>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                              <img
                                src={result.processedUrl}
                                alt="Watermarked"
                                className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <motion.button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Download className="h-5 w-5" />
                            Download Watermarked Image
                          </motion.button>
                          <button
                            onClick={handleImageRemove}
                            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                          >
                            Watermark Another Image
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </AuthGuard>
  );
};

export default TextWatermark;