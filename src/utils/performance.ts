// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure function execution time
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return fn().finally(() => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    });
  }

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    }
  }

  // Record custom metrics
  recordMetric(name: string, value: number) {
    this.metrics.set(name, value);
    
    // Send to analytics
    if (import.meta.env.PROD) {
      this.sendMetricToBackend(name, value);
    } else {
      console.log(`📈 Performance Metric: ${name} = ${value.toFixed(2)}ms`);
    }
  }

  private async sendMetricToBackend(name: string, value: number) {
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: name,
          value,
          timestamp: Date.now(),
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.warn('Failed to send metric to backend:', error);
    }
  }

  // Get Core Web Vitals
  getCoreWebVitals() {
    return new Promise((resolve) => {
      const vitals = {
        FCP: 0, // First Contentful Paint
        LCP: 0, // Largest Contentful Paint
        FID: 0, // First Input Delay
        CLS: 0, // Cumulative Layout Shift
      };

      // Use web-vitals library if available
      if ('web-vitals' in window) {
        // Implementation would use web-vitals library
        resolve(vitals);
      } else {
        // Fallback to Performance API
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        vitals.FCP = navigation.responseStart - navigation.fetchStart;
        resolve(vitals);
      }
    });
  }

  // Monitor resource loading
  monitorResourceLoading() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.recordMetric(`resource_${resource.name}`, resource.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // Image optimization helper
  optimizeImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Lazy loading utility
export function lazyLoad<T>(importFn: () => Promise<{ default: T }>): React.LazyExoticComponent<T> {
  return React.lazy(() => 
    performanceMonitor.measureAsync('lazy_load', importFn)
  );
}

// Image lazy loading hook
export function useImageLazyLoading() {
  React.useEffect(() => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));

    return () => imageObserver.disconnect();
  }, []);
}