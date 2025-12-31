/**
 * Settings API Client
 * Fetches site settings from custom WordPress endpoint
 */

const WOOCOMMERCE_URL =
  process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';

/**
 * Get site settings
 */
export async function getSettings(): Promise<any> {
  const url = `${WOOCOMMERCE_URL}/wp-json/custom/v1/settings`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Settings API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Settings API request failed:', error);
    throw error;
  }
}

