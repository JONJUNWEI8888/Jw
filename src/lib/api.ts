import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-3f0c09a6`;

// Helper function to make API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = false
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization if required
  if (requiresAuth) {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else {
    // Use public anon key for public endpoints
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }

  return data;
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  async signup(email: string, password: string, name: string) {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  async getMe() {
    return apiRequest('/auth/me', {}, true);
  },
};

// ============================================
// MARKET API
// ============================================

export const marketApi = {
  async getMarkets(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/markets${query}`);
  },

  async getMarket(id: string) {
    return apiRequest(`/markets/${id}`);
  },
};

// ============================================
// BETTING API
// ============================================

export const bettingApi = {
  async placeBet(marketId: string, outcome: 'yes' | 'no', amount: number) {
    return apiRequest('/bets/place', {
      method: 'POST',
      body: JSON.stringify({ marketId, outcome, amount }),
    }, true);
  },

  async getBetHistory() {
    return apiRequest('/bets/history', {}, true);
  },
};

// ============================================
// WALLET API
// ============================================

export const walletApi = {
  async getBalance() {
    return apiRequest('/wallet/balance', {}, true);
  },

  async deposit(amount: number) {
    return apiRequest('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }, true);
  },

  async getTransactions() {
    return apiRequest('/wallet/transactions', {}, true);
  },
};

// ============================================
// USER API
// ============================================

export const userApi = {
  async getPositions() {
    return apiRequest('/user/positions', {}, true);
  },
};
