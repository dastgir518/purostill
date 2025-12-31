/**
 * Public API Client
 * Handles public API requests (no authentication required)
 */

const WOOCOMMERCE_URL =
  process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';

/**
 * Make public request to WooCommerce REST API (read-only endpoints)
 */
export async function publicRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${WOOCOMMERCE_URL}/wp-json/wc/store/v1/${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Public API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Public API request failed:', error);
    throw error;
  }
}

/**
 * Get products (public endpoint)
 */
export async function getPublicProducts(params?: {
  per_page?: number;
  page?: number;
  category?: number;
  search?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const endpoint = `products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return publicRequest(endpoint);
}

/**
 * Get a single product by ID (public endpoint)
 */
export async function getPublicProduct(productId: number): Promise<any> {
  return publicRequest(`products/${productId}`);
}

/**
 * Get product categories (public endpoint)
 */
export async function getPublicCategories(params?: {
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
  return publicRequest(endpoint);
}

/**
 * Get homepage content (title, excerpt, featured image) from WordPress
 */
export async function getHomepageHero(pageId = 156): Promise<any | null> {
  try {
    const url = `${WOOCOMMERCE_URL}/wp-json/wp/v2/pages/${pageId}?_embed=1`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: Static export doesn't support next.revalidate
      cache: 'default'
    });

    if (!response.ok) {
      throw new Error(`Homepage fetch error: ${response.status} ${response.statusText}`);
    }

    const page = await response.json();
    if (!page || page.data?.status === 404) return null;

    const featuredImage =
      page?._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
      page?.yoast_head_json?.og_image?.[0]?.url ||
      '';

    return {
      title: page?.title?.rendered || '',
      content: page?.content?.rendered || '',
      excerpt: page?.excerpt?.rendered || '',
      featuredImage,
    };
  } catch (error) {
    console.error('Failed to fetch homepage hero:', error);
    return null;
  }
}

