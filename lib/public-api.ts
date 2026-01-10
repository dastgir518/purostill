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
 * Make request to Biolec Premium SEO API
 */
export async function getSeoData(
  endpoint: string,
  params: Record<string, any> = {},
  options: RequestInit = {}
): Promise<any> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });

  const url = `${WOOCOMMERCE_URL}/wp-json/premium-seo-api/v1/${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  // Log URL for server-side debugging
  console.log(`[getSeoData] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // IMPORTANT: Use no-store for debugging sessions or critical data to verify
      // Once stable, we can use revalidate. 
      // Changed default to 60s to avoid stale data issues during dev.
      next: { revalidate: 60, ...options.next },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`SEO API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`SEO API request failed for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Get SEO data for a post/page/product
 */
export async function getPostSeo(postType: string, identifier?: string | number, page: number = 1): Promise<any> {
  // Always request a large batch (100) because the API DOES NOT SUPPORT FILTERING.
  // We must fetch all (or many) and filter client-side.
  const params: any = {
    post_type: postType,
    page,
    per_page: 100 // Aggressive per_page to find older pages like Homepage (ID 156)
  };

  const data = await getSeoData('data', params);

  if (identifier && Array.isArray(data)) {
    const found = data.find((item: any) => {
      // 1. ID Match
      if (typeof identifier === 'number' && item.id === identifier) return true;

      if (typeof identifier === 'string') {
        // 2. Direct slug match
        if (item.slug === identifier) return true;

        // 3. Permalink match
        if (item.permalink) {
          const permalink = item.permalink.endsWith('/') ? item.permalink.slice(0, -1) : item.permalink;
          if (permalink.endsWith(`/${identifier}`)) return true;
        }

        // 4. Title match
        if (item.title?.toLowerCase() === identifier.replace(/-/g, ' ').toLowerCase()) return true;
      }

      return false;
    });

    return sanitizeSeoData(found);
  }

  // If we fetched a list but didn't find the identifier, and we are on page 1, 
  // we *could* try page 2, but for now let's return what we found (sanitized)
  // or return null/undefined if we strictly wanted a specific item?
  // Current behavior: if identify provided but not found, returns undefined (implicitly) by find.
  // Wait, my previous code `return sanitizeSeoData(found)` -> if found is undefined, it returns undefined.
  // If identifier NOT provided, returns the list.

  if (identifier && Array.isArray(data)) {
    // Attempt to return the 'first' if logic fails? NO. Precise match only.
    // But if user expects data and gets undefined...
    // Let's stick to precise match.
  }

  return sanitizeSeoData(data);
}

/**
 * Get SEO data for taxonomy terms (categories, tags)
 */
export async function getTermSeo(taxonomy: string, slug?: string): Promise<any> {
  const params: any = {
    taxonomy,
    per_page: 100 // Aggressive fetching here too
  };

  const data = await getSeoData('terms', params);

  if (slug && Array.isArray(data)) {
    const found = data.find((item: any) => item.slug === slug) || data[0];
    return sanitizeSeoData(found);
  }

  return sanitizeSeoData(data);
}

/**
 * Replace backend URLs with frontend URLs in SEO data
 */
function sanitizeSeoData(data: any): any {
  if (!data) return data;

  const backendUrl = WOOCOMMERCE_URL.replace(/\/$/, "");
  const frontendUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://purostill.com').replace(/\/$/, "");

  try {
    const str = JSON.stringify(data);
    if (!str.includes(backendUrl)) return data;

    const escapedBackendUrl = backendUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedBackendUrl, 'g');
    return JSON.parse(str.replace(regex, frontendUrl));
  } catch (e) {
    console.error('Error sanitizing SEO data:', e);
    return data;
  }
}

/**
 * Get Global SEO Settings
 */
export async function getSeoSettings(): Promise<any> {
  return await getSeoData('settings');
}


/**
 * Get products (public endpoint)
 */
export async function getPublicProducts(params?: {
  per_page?: number;
  page?: number;
  category?: number;
  search?: string;
  tag?: number;
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
 * Get product tags (public endpoint)
 */
export async function getPublicTags(params?: {
  per_page?: number;
  page?: number;
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

  const endpoint = `products/tags${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
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
      cache: 'default'
    });

    if (!response.ok) {
      throw new Error(`Homepage fetch error: ${response.status} ${response.statusText}`);
    }

    const page = await response.json();
    if (!page || page.data?.status === 404) return null;

    const featuredImage =
      page?._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
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
