/**
 * Authentication utility functions
 */

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  display_name?: string;
  [key: string]: any;
}

export interface AuthData {
  user: User;
  token?: string;
  cookies?: string;
}

/**
 * Store authentication data in localStorage
 */
export function setAuth(authData: AuthData) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('auth', JSON.stringify(authData));
  window.dispatchEvent(new Event('authUpdated'));
}

/**
 * Get authentication data from localStorage
 */
export function getAuth(): AuthData | null {
  if (typeof window === 'undefined') return null;
  
  const authStr = localStorage.getItem('auth');
  if (!authStr) return null;
  
  try {
    return JSON.parse(authStr);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const auth = getAuth();
  return auth !== null && auth.user !== undefined;
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  const auth = getAuth();
  return auth?.user || null;
}

/**
 * Clear authentication data
 */
export function logout() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('auth');
  window.dispatchEvent(new Event('authUpdated'));
}

/**
 * Sign up a new user
 */
export async function signup(username: string, email: string, password: string) {
  const WOOCOMMERCE_URL =
    process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';
  
  const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/custom/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to sign up');
  }

  return data;
}

/**
 * Login user
 * Uses WordPress JWT Authentication plugin
 */
export async function login(username: string, password: string) {
  const WOOCOMMERCE_URL =
    process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';
  
  const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/jwt-auth/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const jwtData = await response.json();
  
  if (!response.ok || jwtData.code) {
    throw new Error(jwtData.message || 'Failed to login');
  }

  if (jwtData.token) {
    // Construct user object from JWT response
    const userObject = {
      id: 0, // Will be extracted from token if needed
      username: jwtData.user_nicename || username,
      email: jwtData.user_email || '',
      display_name: jwtData.user_display_name || jwtData.user_nicename || username,
      name: jwtData.user_display_name || jwtData.user_nicename || username,
    };

    setAuth({
      token: jwtData.token,
      user: userObject,
    });

    return {
      success: true,
      data: {
        token: jwtData.token,
        user: userObject,
      },
    };
  }

  throw new Error('Invalid response from authentication server');
}

/**
 * Verify email
 */
export async function verifyEmail(userId: string, key: string) {
  const WOOCOMMERCE_URL =
    process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';
  
  const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/custom/v1/verify-email?user=${userId}&key=${key}`, {
    method: 'GET',
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to verify email');
  }

  return data;
}

