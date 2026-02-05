/**
 * Cart utility functions
 */

export interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
  slug: string;
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number = 1) {
  if (typeof window === 'undefined') return;

  const savedCart = localStorage.getItem('cart');
  let cartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

  // Check if item already exists in cart
  const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === item.id);

  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    cartItems[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cartItems.push({ ...item, quantity });
  }

  localStorage.setItem('cart', JSON.stringify(cartItems));
  window.dispatchEvent(new Event('cartUpdated'));
  
  // Open the cart sidebar - use setTimeout to ensure it happens after state updates
  setTimeout(() => {
    const openCartEvent = new CustomEvent('openCart');
    window.dispatchEvent(openCartEvent);
  }, 0);
}

export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];

  const savedCart = localStorage.getItem('cart');
  return savedCart ? JSON.parse(savedCart) : [];
}

export function getCartCount(): number {
  const items = getCartItems();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}


export function clearCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('cart');
  window.dispatchEvent(new Event('cartUpdated'));
}
