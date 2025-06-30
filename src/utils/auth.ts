// Authentication utilities with secure backend integration
export interface User {
  id: string;
  email: string;
  name: string;
  subscription: {
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt?: string;
    features: string[];
  };
  profile: {
    avatar?: string;
    createdAt: string;
    lastLogin: string;
  };
  permissions: {
    canAccessTool: (toolId: string) => boolean;
    canUploadFile: (fileSize: number) => boolean;
    dailyLimits: Record<string, { used: number; limit: number }>;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class AuthManager {
  private static instance: AuthManager;
  private user: User | null = null;
  private tokens: AuthTokens | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Initialize auth state from secure httpOnly cookies
  async initialize(): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        this.user = this.enhanceUserWithPermissions(userData);
        this.scheduleTokenRefresh();
        return this.user;
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }

    return null;
  }

  // Secure login with email and password
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.user = this.enhanceUserWithPermissions(data.user);
        this.scheduleTokenRefresh();
        
        return {
          success: true,
          user: this.user,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  // Secure registration
  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        this.user = this.enhanceUserWithPermissions(data.user);
        this.scheduleTokenRefresh();
        
        return {
          success: true,
          user: this.user,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Registration failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  // Secure logout
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': this.getCSRFToken(),
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.user = null;
      this.tokens = null;
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.user !== null;
  }

  // Enhanced user object with permission methods
  private enhanceUserWithPermissions(userData: any): User {
    const user: User = {
      ...userData,
      permissions: {
        canAccessTool: (toolId: string) => {
          const toolPermissions = {
            'background-remover': ['free', 'starter', 'pro', 'enterprise'],
            'image-upscaler': ['free', 'starter', 'pro', 'enterprise'],
            'text-watermark': ['starter', 'pro', 'enterprise'],
            'crop-resize': ['starter', 'pro', 'enterprise'],
            'batch-processing': ['pro', 'enterprise'],
            'api-access': ['pro', 'enterprise'],
            'white-label': ['enterprise'],
          };

          const allowedPlans = toolPermissions[toolId as keyof typeof toolPermissions] || [];
          return allowedPlans.includes(userData.subscription.plan);
        },
        canUploadFile: (fileSize: number) => {
          const limits = {
            free: 5 * 1024 * 1024, // 5MB
            starter: 10 * 1024 * 1024, // 10MB
            pro: 50 * 1024 * 1024, // 50MB
            enterprise: 100 * 1024 * 1024, // 100MB
          };

          return fileSize <= limits[userData.subscription.plan];
        },
        dailyLimits: userData.dailyLimits || {},
      },
    };

    return user;
  }

  // Token refresh mechanism
  private async refreshTokens(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        this.scheduleTokenRefresh();
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // If refresh fails, logout user
    await this.logout();
    return false;
  }

  // Schedule automatic token refresh
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token 5 minutes before expiry
    const refreshIn = 25 * 60 * 1000; // 25 minutes
    this.refreshTimer = setTimeout(() => {
      this.refreshTokens();
    }, refreshIn);
  }

  // Get CSRF token from meta tag or cookie
  private getCSRFToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
      return meta.getAttribute('content') || '';
    }

    // Fallback to cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return value;
      }
    }

    return '';
  }

  // Update user subscription
  async updateSubscription(plan: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/subscription', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        const userData = await response.json();
        this.user = this.enhanceUserWithPermissions(userData);
        return true;
      }
    } catch (error) {
      console.error('Subscription update failed:', error);
    }

    return false;
  }
}

export const authManager = AuthManager.getInstance();

// React hook for authentication
export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const initAuth = async () => {
      const currentUser = await authManager.initialize();
      setUser(currentUser);
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authManager.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const register = async (userData: { email: string; password: string; name: string }) => {
    const result = await authManager.register(userData);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await authManager.logout();
    setUser(null);
  };

  const updateSubscription = async (plan: string) => {
    const success = await authManager.updateSubscription(plan);
    if (success) {
      setUser(authManager.getCurrentUser());
    }
    return success;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateSubscription,
  };
}