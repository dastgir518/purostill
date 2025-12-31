/**
 * Menu API Client
 * Fetches menu data from custom WordPress endpoint
 */

const WOOCOMMERCE_URL =
  process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';

/**
 * Get menu by ID
 */
export async function getMenu(menuId: number): Promise<any> {
  const url = `${WOOCOMMERCE_URL}/wp-json/custom/v1/menu/${menuId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: Static export doesn't support next.revalidate
      // Consider implementing client-side caching
      cache: 'default'
    });

    if (!response.ok) {
      const error = new Error(`Menu API error: ${response.status} ${response.statusText}`);
      (error as any).status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error: any) {
    // Only log non-404 errors (404s are expected during fallback)
    if (error.status !== 404) {
      console.error('Menu API request failed:', error);
    }
    throw error;
  }
}

/**
 * Transform flat menu items into hierarchical structure
 */
export function buildMenuTree(items: any[]): any[] {
  const itemMap = new Map();
  const rootItems: any[] = [];

  // First pass: create map of all items
  items.forEach(item => {
    itemMap.set(item.id.toString(), { ...item, children: [] });
  });

  // Second pass: build tree structure
  items.forEach(item => {
    const menuItem = itemMap.get(item.id.toString());
    const parentId = item.parent;
    // Convert parentId to string for comparison and lookup
    const parentIdStr = parentId ? parentId.toString() : '0';

    if (parentIdStr === '0' || parentId === 0 || !parentId) {
      // Root level item
      rootItems.push(menuItem);
    } else {
      // Child item - lookup parent using string ID
      const parent = itemMap.get(parentIdStr);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(menuItem);
      }
    }
  });

  // Sort items by order
  const sortByOrder = (items: any[]) => {
    items.sort((a, b) => a.order - b.order);
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        sortByOrder(item.children);
      }
    });
  };

  sortByOrder(rootItems);
  return rootItems;
}

