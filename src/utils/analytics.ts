// Analytics and tracking utilities
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

class Analytics {
  private isProduction = import.meta.env.PROD;
  private userId: string | null = null;

  init(userId?: string) {
    this.userId = userId || null;
    
    if (this.isProduction) {
      // Initialize Google Analytics, Mixpanel, etc.
      this.initGoogleAnalytics();
      this.initHotjar();
    }
  }

  private initGoogleAnalytics() {
    // Google Analytics 4 implementation
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  }

  private initHotjar() {
    // Hotjar for user behavior analytics
    (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj = h.hj || function(...args: any[]) { (h.hj.q = h.hj.q || []).push(args); };
      h._hjSettings = { hjid: 'HOTJAR_ID', hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script'); r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
  }

  track(event: string, properties?: Record<string, any>) {
    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      userId: this.userId,
    };

    // Console log for development
    if (!this.isProduction) {
      console.log('📊 Analytics Event:', eventData);
    }

    // Send to analytics services
    if (this.isProduction) {
      this.sendToGoogleAnalytics(eventData);
      this.sendToMixpanel(eventData);
    }

    // Send to your backend for custom analytics
    this.sendToBackend(eventData);
  }

  private sendToGoogleAnalytics(event: AnalyticsEvent) {
    if (typeof gtag !== 'undefined') {
      gtag('event', event.event, event.properties);
    }
  }

  private sendToMixpanel(event: AnalyticsEvent) {
    // Mixpanel implementation
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(event.event, event.properties);
    }
  }

  private async sendToBackend(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.warn('Failed to send analytics to backend:', error);
    }
  }

  // Specific tracking methods
  trackPageView(page: string) {
    this.track('page_view', { page });
  }

  trackImageUpload(fileSize: number, fileType: string) {
    this.track('image_upload', { fileSize, fileType });
  }

  trackToolUsage(tool: string, processingTime?: number) {
    this.track('tool_usage', { tool, processingTime });
  }

  trackSubscription(plan: string, amount: number) {
    this.track('subscription_created', { plan, amount });
  }

  trackError(error: string, context?: string) {
    this.track('error', { error, context });
  }
}

export const analytics = new Analytics();

// Global analytics declaration
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    mixpanel: any;
  }
}