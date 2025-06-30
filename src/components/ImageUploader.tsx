import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertCircle, Image as ImageIcon, FileImage, Info } from 'lucide-react';

interface ImageUploaderProps {
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  className?: string;
  title?: string;
  subtitle?: string;
}

interface ImagePreview {
  file: File;
  preview: string;
  dimensions?: { width: number; height: number };
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUpload,
  onRemove,
  maxSizeMB = 5,
  className = '',
  title = 'Upload Your Image',
  subtitle = 'Transform your images with AI-powered tools'
}) => {
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload only JPG, JPEG, or PNG files.';
    }

    if (file.size > maxSizeBytes) {
      return `File too large. Max ${maxSizeMB}MB allowed.`;
    }

    return null;
  }, [maxSizeMB]);

  const processFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImagePreview({
          file,
          preview: result,
          dimensions: { width: img.width, height: img.height }
        });
        setIsLoading(false);
        onUpload?.(file);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, [validateFile, onUpload]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false,
    maxSize: maxSizeMB * 1024 * 1024
  });

  const handleReset = () => {
    setImagePreview(null);
    setError('');
    setIsLoading(false);
    onRemove?.();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full max-w-xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Upload Area */}
      <motion.div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
          isDragActive && !isDragReject
            ? 'border-blue-500 bg-blue-50 scale-105'
            : isDragReject
            ? 'border-red-400 bg-red-50'
            : imagePreview
            ? 'border-green-400 bg-green-50'
            : 'border-blue-300 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 hover:scale-102'
        } ${error ? 'border-red-300 bg-red-50/50' : ''}`}
        whileHover={{ scale: imagePreview ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-blue-600 font-semibold text-lg">Processing image...</p>
              <p className="text-gray-500 text-sm mt-1">Please wait while we prepare your image</p>
            </motion.div>
          ) : imagePreview ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                <FileImage className="h-8 w-8 text-white" />
              </div>
              <p className="text-green-600 font-semibold text-lg mb-2">Image uploaded successfully!</p>
              <p className="text-gray-600 text-sm">Ready to process with AI tools</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4"
                whileHover={{ rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Upload className="h-8 w-8 text-white" />
              </motion.div>
              <p className="text-blue-600 font-semibold text-lg mb-2">
                {isDragActive ? 'Drop your image here!' : 'Drag & drop an image here, or click to upload'}
              </p>
              <p className="text-gray-500 text-sm">
                Supports JPG, JPEG, PNG files
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Helper Text */}
      <div className="mt-3 flex items-center justify-center gap-2 text-gray-500 text-sm">
        <Info className="h-4 w-4" />
        <span>Max size: {maxSizeMB}MB</span>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Preview Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                      {imagePreview.file.name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(imagePreview.file.size)}</span>
                      {imagePreview.dimensions && (
                        <span>{imagePreview.dimensions.width} × {imagePreview.dimensions.height}px</span>
                      )}
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-4 w-4" />
                  Reset
                </motion.button>
              </div>

              {/* Image Preview */}
              <div className="p-6">
                <motion.div
                  className="relative bg-gray-50 rounded-xl overflow-hidden"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src={imagePreview.preview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain mx-auto rounded-lg shadow-sm"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageUploader;