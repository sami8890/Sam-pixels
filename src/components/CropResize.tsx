import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, RefreshCw, CheckCircle, AlertCircle, Maximize2, Crop, RotateCw, Move } from 'lucide-react';
import ImageUploader from './ImageUploader';
import AuthGuard from './AuthGuard';
import UsageLimits from './UsageLimits';
import { useToast } from './Toast';
import { APIUsageTracker } from '../api/freeApis';
import { analytics } from '../utils/analytics';

interface CropResizeProps {
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

interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: string;
  outputWidth: number;
  outputHeight: number;
  rotation: number;
}

interface ProcessedResult {
  originalUrl: string;
  processedUrl: string;
  fileName: string;
  settings: CropSettings;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
}

const CropResize: React.FC<CropResizeProps> = ({ 
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
  const [cropSettings, setCropSettings] = useState<CropSettings>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    aspectRatio: 'free',
    outputWidth: 1920,
    outputHeight: 1080,
    rotation: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { success, error: showError } = useToast();

  const aspectRatios = [
    { label: 'Free', value: 'free' },
    { label: 'Square (1:1)', value: '1:1' },
    { label: 'Instagram Post (1:1)', value: '1:1' },
    { label: 'Instagram Story (9:16)', value: '9:16' },
    { label: 'Facebook Cover (16:9)', value: '16:9' },
    { label: 'Twitter Header (3:1)', value: '3:1' },
    { label: 'YouTube Thumbnail (16:9)', value: '16:9' },
    { label: 'LinkedIn Post (1.91:1)', value: '1.91:1' },
    { label: 'Pinterest Pin (2:3)', value: '2:3' }
  ];

  const presetSizes = [
    { label: 'Instagram Post', width: 1080, height: 1080 },
    { label: 'Instagram Story', width: 1080, height: 1920 },
    { label: 'Facebook Cover', width: 1200, height: 630 },
    { label: 'Twitter Header', width: 1500, height: 500 },
    { label: 'YouTube Thumbnail', width: 1280, height: 720 },
    { label: 'LinkedIn Post', width: 1200, height: 628 },
    { label: 'Pinterest Pin', width: 1000, height: 1500 },
    { label: 'HD (1920x1080)', width: 1920, height: 1080 },
    { label: '4K (3840x2160)', width: 3840, height: 2160 }
  ];

  const handleImageUpload = async (file: File) => {
    // Check usage limits for free users
    if (userPlan !== 'pro' && userPlan !== 'enterprise') {
      if (!APIUsageTracker.trackUsage('image-transform')) {
        showError('Daily limit reached', 'You\'ve used all your free crop & resize credits for today.');
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
      
      // Get original image dimensions
      const img = new Image();
      img.onload = () => {
        const dimensions = { width: img.width, height: img.height };
        setOriginalImageDimensions(dimensions);
        
        // Set initial crop settings based on image dimensions
        setCropSettings(prev => ({
          ...prev,
          outputWidth: dimensions.width,
          outputHeight: dimensions.height
        }));

        setProcessingState(prev => ({
          ...prev,
          isUploading: false
        }));
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

      analytics.trackError(errorMessage, 'crop-resize');
      showError('Upload failed', errorMessage);
    }
  };

  const applyCropAndResize = async () => {
    if (!uploadedFile || !imageRef.current) return;

    setProcessingState(prev => ({
      ...prev,
      isProcessing: true
    }));

    try {
      const startTime = Date.now();
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const img = imageRef.current;
      
      // Set canvas size to output dimensions
      canvas.width = cropSettings.outputWidth;
      canvas.height = cropSettings.outputHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate crop dimensions in actual pixels
      const cropX = (cropSettings.x / 100) * originalImageDimensions.width;
      const cropY = (cropSettings.y / 100) * originalImageDimensions.height;
      const cropWidth = (cropSettings.width / 100) * originalImageDimensions.width;
      const cropHeight = (cropSettings.height / 100) * originalImageDimensions.height;

      // Apply rotation if needed
      if (cropSettings.rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((cropSettings.rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // Draw cropped and resized image
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight, // Source rectangle
        0, 0, canvas.width, canvas.height // Destination rectangle
      );

      if (cropSettings.rotation !== 0) {
        ctx.restore();
      }

      // Get processed image URL
      const processedUrl = canvas.toDataURL('image/png', 0.95);
      const processingTime = Date.now() - startTime;

      setResult({
        originalUrl: URL.createObjectURL(uploadedFile),
        processedUrl,
        fileName: uploadedFile.name.replace(/\.[^/.]+$/, '') + '_cropped_resized.png',
        settings: { ...cropSettings },
        originalDimensions: originalImageDimensions,
        newDimensions: { width: cropSettings.outputWidth, height: cropSettings.outputHeight }
      });

      setProcessingState({
        isUploading: false,
        isProcessing: false,
        isComplete: true,
        error: null
      });

      analytics.trackToolUsage('crop-resize', processingTime);
      success('Image processed successfully!', 'Your cropped and resized image is ready.');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image. Please try again.';
      
      setProcessingState({
        isUploading: false,
        isProcessing: false,
        isComplete: false,
        error: errorMessage
      });

      analytics.trackError(errorMessage, 'crop-resize');
      showError('Processing failed', errorMessage);
    }
  };

  const handleSettingChange = (key: keyof CropSettings, value: any) => {
    setCropSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Handle aspect ratio changes
      if (key === 'aspectRatio' && value !== 'free') {
        const [widthRatio, heightRatio] = value.split(':').map(Number);
        const ratio = widthRatio / heightRatio;
        
        // Adjust crop dimensions to maintain aspect ratio
        const currentWidth = prev.width;
        const newHeight = currentWidth / ratio;
        
        if (newHeight <= 100 - prev.y) {
          newSettings.height = newHeight;
        } else {
          const maxHeight = 100 - prev.y;
          newSettings.height = maxHeight;
          newSettings.width = maxHeight * ratio;
        }
      }
      
      return newSettings;
    });
  };

  const handlePresetSize = (preset: { width: number; height: number }) => {
    setCropSettings(prev => ({
      ...prev,
      outputWidth: preset.width,
      outputHeight: preset.height
    }));
  };

  const handleCropDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCropSettings(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, x - dragStart.x)),
      y: Math.max(0, Math.min(100 - prev.height, y - dragStart.y))
    }));
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDragStart({ x: x - cropSettings.x, y: y - cropSettings.y });
    setIsDragging(true);
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
    setCropSettings({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      aspectRatio: 'free',
      outputWidth: 1920,
      outputHeight: 1080,
      rotation: 0
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

      analytics.track('image_download', { tool: 'crop-resize' });
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
      feature="Crop & Resize"
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
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Maximize2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Crop & Resize</h1>
                <p className="text-gray-600">Perfect sizing for any platform with smart cropping</p>
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
                  subtitle="Crop and resize for any platform"
                />
              )}

              {/* Crop & Resize Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Crop className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Crop & Resize Settings</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Aspect Ratio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aspect Ratio
                      </label>
                      <select
                        value={cropSettings.aspectRatio}
                        onChange={(e) => handleSettingChange('aspectRatio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        {aspectRatios.map(ratio => (
                          <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Preset Sizes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Presets
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {presetSizes.slice(0, 4).map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => handlePresetSize(preset)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
                          >
                            <div className="font-medium">{preset.label}</div>
                            <div className="text-xs text-gray-500">{preset.width} × {preset.height}px</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Output Dimensions */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          value={cropSettings.outputWidth}
                          onChange={(e) => handleSettingChange('outputWidth', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          min="1"
                          max="4000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          value={cropSettings.outputHeight}
                          onChange={(e) => handleSettingChange('outputHeight', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          min="1"
                          max="4000"
                        />
                      </div>
                    </div>

                    {/* Rotation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rotation: {cropSettings.rotation}°
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="90"
                          value={cropSettings.rotation}
                          onChange={(e) => handleSettingChange('rotation', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <button
                          onClick={() => handleSettingChange('rotation', (cropSettings.rotation + 90) % 360)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <motion.button
                      onClick={applyCropAndResize}
                      disabled={isProcessingActive}
                      className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      whileHover={!isProcessingActive ? { scale: 1.02 } : {}}
                      whileTap={!isProcessingActive ? { scale: 0.98 } : {}}
                    >
                      {isProcessingActive ? 'Processing...' : 'Apply Crop & Resize'}
                    </motion.button>
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
                      <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {processingState.isUploading ? 'Uploading image...' : 'Processing image...'}
                      </h3>
                      <p className="text-gray-600">
                        {processingState.isUploading 
                          ? 'Preparing your image for editing' 
                          : 'Applying crop and resize settings'
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Failed</h3>
                      <p className="text-gray-600 mb-6">{processingState.error}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleRetry}
                          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-all duration-200"
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

              {/* Interactive Preview */}
              {uploadedFile && !processingState.isComplete && !processingState.error && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden mb-8">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Interactive Preview</h3>
                    <p className="text-gray-600">Drag the crop area to adjust position</p>
                  </div>

                  <div className="p-6">
                    <div
                      ref={previewRef}
                      className="relative bg-gray-50 rounded-xl overflow-hidden cursor-move"
                      onMouseMove={handleCropDrag}
                      onMouseDown={handleMouseDown}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                    >
                      <img
                        ref={imageRef}
                        src={URL.createObjectURL(uploadedFile)}
                        alt="Preview"
                        className="w-full h-auto max-h-96 object-contain mx-auto"
                        style={{
                          transform: `rotate(${cropSettings.rotation}deg)`
                        }}
                      />
                      
                      {/* Crop Overlay */}
                      <div
                        className="absolute border-2 border-teal-500 bg-teal-500/20 cursor-move"
                        style={{
                          left: `${cropSettings.x}%`,
                          top: `${cropSettings.y}%`,
                          width: `${cropSettings.width}%`,
                          height: `${cropSettings.height}%`
                        }}
                      >
                        {/* Corner handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-teal-500 rounded-full"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-teal-500 rounded-full"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-teal-500 rounded-full"></div>
                        
                        {/* Move icon */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <Move className="h-6 w-6 text-teal-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                          <h3 className="text-lg font-semibold text-green-900">Image Processed Successfully!</h3>
                          <p className="text-green-700">
                            Resized from {result.originalDimensions.width}×{result.originalDimensions.height} to {result.newDimensions.width}×{result.newDimensions.height} pixels
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Before & After Comparison */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Before & After</h3>
                        <p className="text-gray-600">Compare your original image with the cropped and resized version</p>
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

                          {/* Processed Image */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-700">Cropped & Resized</h4>
                              <span className="text-xs text-gray-500">
                                {result.newDimensions.width} × {result.newDimensions.height}px
                              </span>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                              <img
                                src={result.processedUrl}
                                alt="Processed"
                                className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg"
                              />
                              {/* Quality indicator */}
                              <div className="absolute top-2 left-2 bg-teal-100 text-teal-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                <Crop className="h-3 w-3" />
                                Optimized
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
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Download className="h-5 w-5" />
                            Download Processed Image
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

          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </AuthGuard>
  );
};

export default CropResize;