// Security utilities and helpers
export class SecurityManager {
  private static instance: SecurityManager;
  
  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Content Security Policy
  initCSP() {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' data: https://js.stripe.com https://www.googletagmanager.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.stripe.com https://api.cloudinary.com https://api.remove.bg https://clipdrop-api.co https://api.replicate.com https://api.imgbb.com https://api.ocr.space;
      frame-src https://js.stripe.com;
    `.replace(/\s+/g, ' ').trim();
    
    document.head.appendChild(meta);
  }

  // Input sanitization
  sanitizeInput(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // File validation
  validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): { valid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
      };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension ${extension} is not allowed`
      };
    }

    // Check for malicious content (basic check)
    if (this.containsSuspiciousContent(file.name)) {
      return {
        valid: false,
        error: 'File contains suspicious content'
      };
    }

    return { valid: true };
  }

  private containsSuspiciousContent(filename: string): boolean {
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /<script/i,
      /javascript:/i,
      /data:text\/html/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(filename));
  }

  // Rate limiting
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(key: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  }

  // Generate secure tokens
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash sensitive data
  async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Validate URLs
  isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Prevent XSS
  escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // CSRF protection
  getCSRFToken(): string {
    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
      token = this.generateSecureToken();
      sessionStorage.setItem('csrf_token', token);
    }
    return token;
  }

  // Secure local storage
  secureSetItem(key: string, value: any): void {
    try {
      const encrypted = btoa(JSON.stringify(value));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to securely store item:', error);
    }
  }

  secureGetItem(key: string): any {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error('Failed to securely retrieve item:', error);
      return null;
    }
  }
}

export const security = SecurityManager.getInstance();

// React hook for security
export function useSecurity() {
  const [csrfToken] = React.useState(() => security.getCSRFToken());

  const validateAndUpload = React.useCallback(async (file: File) => {
    const validation = security.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Additional security checks could go here
    return file;
  }, []);

  return {
    csrfToken,
    validateAndUpload,
    sanitizeInput: security.sanitizeInput,
    escapeHTML: security.escapeHTML,
  };
}