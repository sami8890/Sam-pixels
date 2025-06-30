import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload?: (file: File) => void;
  onImageRemove?: () => void;
  maxSizeMB?: number;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onImageRemove,
  maxSizeMB = 5,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload only JPG, JPEG, or PNG files.';
    }

    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB.`;
    }

    return null;
  };

  const handleFile = useCallback((file: File) => {
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
      setUploadedImage(result);
      setFileName(file.name);
      setIsLoading(false);
      onImageUpload?.(file);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload, maxSizeMB]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setUploadedImage(null);
    setFileName('');
    setError('');
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove?.();
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : uploadedImage
            ? 'border-green-300 bg-green-50'
            : 'border-blue-300 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-400'
        } ${error ? 'border-red-300 bg-red-50/30' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-blue-600 font-medium">Processing image...</p>
          </div>
        ) : uploadedImage ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-green-600 font-semibold text-lg mb-2">Image uploaded successfully!</p>
            <p className="text-gray-600 text-sm">Ready to process with AI tools</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <p className="text-blue-600 font-semibold text-lg mb-2">
              Drag & drop an image here, or click to upload
            </p>
            <p className="text-gray-500 text-sm">
              Supports JPG, JPEG, PNG files
            </p>
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="mt-3 text-center">
        <p className="text-gray-500 text-sm">Max size: {maxSizeMB}MB</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Image Preview */}
      {uploadedImage && (
        <div className="mt-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Preview Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                  {fileName}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                <X className="h-4 w-4" />
                Reset
              </button>
            </div>

            {/* Image Preview */}
            <div className="p-4">
              <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={uploadedImage}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;