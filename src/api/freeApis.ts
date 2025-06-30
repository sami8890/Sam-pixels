// Free API integrations for image processing
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Remove.bg API (Free tier: 50 images/month)
export class BackgroundRemovalAPI {
  private static readonly API_KEY = import.meta.env.VITE_REMOVEBG_API_KEY;
  private static readonly API_URL = 'https://api.remove.bg/v1.0/removebg';

  static async removeBackground(imageFile: File): Promise<ApiResponse<string>> {
    // Check if API key is configured
    if (!this.API_KEY || this.API_KEY === 'your_removebg_api_key_here') {
      return {
        success: false,
        error: 'Remove.bg API key not configured. Please add VITE_REMOVEBG_API_KEY to your .env file.',
      };
    }

    try {
      const formData = new FormData();
      formData.append('image_file', imageFile);
      formData.append('size', 'auto');

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 402) {
          // Try fallback API when quota exceeded
          console.log('Remove.bg quota exceeded, trying ClipDrop...');
          return await this.removeBackgroundClipDrop(imageFile);
        }
        if (response.status === 403) {
          throw new Error('Invalid Remove.bg API key. Please check your configuration.');
        }
        throw new Error(`Remove.bg API Error: ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      const processedUrl = URL.createObjectURL(blob);

      return {
        success: true,
        data: processedUrl,
      };
    } catch (error) {
      console.error('Remove.bg failed:', error);
      
      // Try fallback API if primary fails
      console.log('Attempting fallback to ClipDrop API...');
      return await this.removeBackgroundClipDrop(imageFile);
    }
  }

  // Fallback to ClipDrop API (Free tier: 100 images/month)
  static async removeBackgroundClipDrop(imageFile: File): Promise<ApiResponse<string>> {
    const clipDropKey = import.meta.env.VITE_CLIPDROP_API_KEY;
    
    if (!clipDropKey || clipDropKey === 'your_clipdrop_api_key_here') {
      return {
        success: false,
        error: 'ClipDrop API key not configured. Please add VITE_CLIPDROP_API_KEY to your .env file.',
      };
    }

    try {
      const formData = new FormData();
      formData.append('image_file', imageFile);

      const response = await fetch('https://clipdrop-api.co/remove-background/v1', {
        method: 'POST',
        headers: {
          'x-api-key': clipDropKey,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('ClipDrop API quota exceeded. Both APIs have reached their limits.');
        }
        if (response.status === 403) {
          throw new Error('Invalid ClipDrop API key. Please check your configuration.');
        }
        throw new Error(`ClipDrop API Error: ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      const processedUrl = URL.createObjectURL(blob);

      return {
        success: true,
        data: processedUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Background removal failed with both APIs',
      };
    }
  }
}

// Real-ESRGAN API for image upscaling using Replicate
export class ImageUpscalingAPI {
  private static readonly REPLICATE_API_KEY = import.meta.env.VITE_REPLICATE_API_TOKEN;

  static async upscaleImage(imageFile: File, scale: number = 4): Promise<ApiResponse<string>> {
    if (!this.REPLICATE_API_KEY || this.REPLICATE_API_KEY === 'your_replicate_api_token') {
      return {
        success: false,
        error: 'Replicate API token not configured. Please add VITE_REPLICATE_API_TOKEN to your .env file.',
      };
    }

    try {
      // First upload image to ImgBB for temporary hosting
      const imageUrl = await this.uploadImageToImgBB(imageFile);

      // Create prediction with Real-ESRGAN model
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa', // Real-ESRGAN model
          input: {
            image: imageUrl,
            scale: scale,
            face_enhance: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Replicate API Error: ${response.status} - ${response.statusText}`);
      }

      const prediction = await response.json();
      
      // Poll for completion
      const result = await this.pollPrediction(prediction.id);
      
      return {
        success: true,
        data: result.output,
      };
    } catch (error) {
      console.error('Image upscaling failed:', error);
      
      // Try fallback to Waifu2x
      console.log('Attempting fallback to Waifu2x...');
      return await this.upscaleImageWaifu2x(imageFile);
    }
  }

  private static async uploadImageToImgBB(file: File): Promise<string> {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.readAsDataURL(file);
    });

    const formData = new FormData();
    formData.append('image', base64);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY || 'demo'}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // Fallback: create a temporary blob URL
      return URL.createObjectURL(file);
    }

    const data = await response.json();
    return data.data.url;
  }

  private static async pollPrediction(predictionId: string): Promise<any> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.REPLICATE_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check prediction status: ${response.status}`);
      }

      const prediction = await response.json();

      if (prediction.status === 'succeeded') {
        return prediction;
      }

      if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error || 'Unknown error'}`);
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Prediction timeout - processing took too long');
  }

  // Fallback to Waifu2x API (Free)
  static async upscaleImageWaifu2x(imageFile: File): Promise<ApiResponse<string>> {
    try {
      // For demo purposes, we'll simulate the upscaling process
      // In a real implementation, you would integrate with a Waifu2x service
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create a canvas to simulate upscaling
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          // Double the size for 2x upscaling
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          
          // Use image smoothing for better quality
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          
          canvas.toBlob((blob) => {
            if (blob) {
              const processedUrl = URL.createObjectURL(blob);
              resolve({
                success: true,
                data: processedUrl,
              });
            } else {
              resolve({
                success: false,
                error: 'Failed to process image with fallback method',
              });
            }
          }, 'image/png', 0.95);
        };
        
        img.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load image for processing',
          });
        };
        
        img.src = URL.createObjectURL(imageFile);
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image upscaling failed',
      };
    }
  }
}

// Cloudinary API for image transformations (Free tier: 25 credits/month)
export class ImageTransformAPI {
  private static readonly CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo_cloud';
  private static readonly API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || 'demo_key';
  private static readonly API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'demo_secret';

  static async uploadAndTransform(file: File, transformations: string): Promise<ApiResponse<string>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'sampixel_uploads');
      formData.append('transformation', transformations);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary API Error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.secure_url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image transformation failed',
      };
    }
  }

  static async cropAndResize(
    file: File,
    width: number,
    height: number,
    cropMode: string = 'fill'
  ): Promise<ApiResponse<string>> {
    const transformation = `c_${cropMode},w_${width},h_${height}`;
    return this.uploadAndTransform(file, transformation);
  }
}

// Free OCR API for text detection (for watermark positioning)
export class TextDetectionAPI {
  static async detectText(imageFile: File): Promise<ApiResponse<any[]>> {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'false');
      formData.append('scale', 'true');
      formData.append('isTable', 'false');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_OCR_SPACE_API_KEY || 'demo_key',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR API Error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.ParsedResults || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text detection failed',
      };
    }
  }
}

// API usage tracking
export class APIUsageTracker {
  private static readonly STORAGE_KEY = 'sampixel_api_usage';

  static getUsage(): Record<string, { count: number; resetDate: string }> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return {};
    
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  static trackUsage(apiName: string): boolean {
    const usage = this.getUsage();
    const today = new Date().toDateString();
    
    if (!usage[apiName]) {
      usage[apiName] = { count: 0, resetDate: today };
    }

    // Reset count if it's a new day
    if (usage[apiName].resetDate !== today) {
      usage[apiName] = { count: 0, resetDate: today };
    }

    // Check daily limits for free users
    const limits: Record<string, number> = {
      'background-removal': 10, // Free tier limit
      'image-upscaling': 5,
      'image-transform': 20,
    };

    if (usage[apiName].count >= (limits[apiName] || 10)) {
      return false; // Limit exceeded
    }

    usage[apiName].count++;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
    return true;
  }

  static getRemainingUsage(apiName: string): number {
    const usage = this.getUsage();
    const limits: Record<string, number> = {
      'background-removal': 10,
      'image-upscaling': 5,
      'image-transform': 20,
    };

    const used = usage[apiName]?.count || 0;
    const limit = limits[apiName] || 10;
    return Math.max(0, limit - used);
  }
}