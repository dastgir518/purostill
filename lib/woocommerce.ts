/**
 * WooCommerce API Client
 * Handles authentication and API requests to WooCommerce
 */

const WOOCOMMERCE_URL =
  process.env.WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || '';
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || '';

/**
 * Generate Basic Auth header for WooCommerce API
 */
function getAuthHeader(): string {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Make authenticated request to WooCommerce API
 */
export async function woocommerceRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${WOOCOMMERCE_URL}/wp-json/wc/v3/${endpoint}`;

  const headers = {
    'Authorization': getAuthHeader(),
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WooCommerce API request failed:', error);
    throw error;
  }
}

/**
 * Get products from WooCommerce
 */
export async function getProducts(params?: {
  per_page?: number;
  page?: number;
  status?: string;
  category?: number | string;
  tag?: number | string;
  tag_slug?: string;
  search?: string;
  slug?: string;
  min_price?: string;
  max_price?: string;
  rating?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
  }

  const endpoint = `products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return woocommerceRequest(endpoint);
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: number): Promise<any> {
  return woocommerceRequest(`products/${productId}`);
}

/**
 * Get orders from WooCommerce
 */
export async function getOrders(params?: {
  per_page?: number;
  page?: number;
  status?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const endpoint = `orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return woocommerceRequest(endpoint);
}

/**
 * Get categories from WooCommerce
 */
export async function getCategories(params?: {
  per_page?: number;
  page?: number;
}): Promise<any> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const endpoint = `products/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return woocommerceRequest(endpoint);
}

/**
 * Create a WooCommerce order
 */
export async function createOrder(orderData: any): Promise<any> {
  return woocommerceRequest('orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

/**
 * Get shipping methods (enabled on WooCommerce)
 */
export async function getShippingMethods(): Promise<any> {
  return woocommerceRequest('shipping_methods');
}

/**
 * Get shipping zones
 */
export async function getShippingZones(): Promise<any> {
  return woocommerceRequest('shipping/zones');
}

/**
 * Get shipping methods configured for a specific zone
 */
export async function getZoneShippingMethods(zoneId: number): Promise<any> {
  return woocommerceRequest(`shipping/zones/${zoneId}/methods`);
}

/**
 * Get locations assigned to a shipping zone
 */
export async function getZoneLocations(zoneId: number): Promise<any> {
  return woocommerceRequest(`shipping/zones/${zoneId}/locations`);
}


/**
 * Get products from public Store API (no authentication required)
 */
export async function getPublicProducts(params?: {
  per_page?: number;
  page?: number;
  category?: number | string;
  tag?: number | string;
  tag_slug?: string;
  search?: string;
  slug?: string;
  status?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
  }

  // Use the Store API which is public and handles prices/formatted data well for frontend
  const url = `${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products${queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Public WooCommerce API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Public WooCommerce API request failed:', error);
    return []; // Return empty array on failure to prevent SSR crash
  }
}

/**
 * Get tags from public Store API (no authentication required)
 */
export async function getPublicTags(params?: {
  search?: string;
  per_page?: number;
  page?: number;
}): Promise<any> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
  }

  const url = `${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products/tags${queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Public WooCommerce Tags API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Public WooCommerce Tags API request failed:', error);
    return [];
  }
}
