/**
 * Client-side API utility functions
 * Direct calls to WordPress REST API
 */

const WOOCOMMERCE_URL =
  process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';

/**
 * Generic WordPress API fetch function
 */
async function wpApiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${WOOCOMMERCE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || 'API request failed');
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('API fetch error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch data',
    };
  }
}

/**
 * Public API functions (no authentication)
 * Uses WooCommerce Store API (public, read-only)
 */
export const publicApi = {
  /**
   * Get all products
   */
  getProducts: async (params?: {
    per_page?: number;
    page?: number;
    category?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return wpApiFetch(`/wp-json/wc/store/v1/products${query}`);
  },

  /**
   * Get a single product by ID
   */
  getProduct: async (id: number) => {
    return wpApiFetch(`/wp-json/wc/store/v1/products/${id}`);
  },

  /**
   * Get categories
   */
  getCategories: async (params?: {
    per_page?: number;
    page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return wpApiFetch(`/wp-json/wc/store/v1/products/categories${query}`);
  },
};

/**
 * WooCommerce Store API functions (public, read-only)
 * Note: For authenticated operations, use WordPress custom endpoints
 */
export const woocommerceApi = {
  /**
   * Get all products (using public Store API)
   */
  getProducts: async (params?: {
    per_page?: number;
    page?: number;
    category?: number;
    search?: string;
  }) => {
    return publicApi.getProducts(params);
  },

  /**
   * Get a single product by ID (using public Store API)
   */
  getProduct: async (id: number) => {
    return publicApi.getProduct(id);
  },

  /**
   * Get categories (using public Store API)
   */
  getCategories: async (params?: {
    per_page?: number;
    page?: number;
  }) => {
    return publicApi.getCategories(params);
  },
};

