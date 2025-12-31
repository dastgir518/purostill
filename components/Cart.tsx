'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './Cart.module.css';

interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
  slug: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Listen for cart updates from other components (not from this component)
    const handleCartUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Don't listen to our own updates
      if (customEvent.detail?.source === 'cart') {
        return;
      }
      
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setCartItems(parsed);
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error);
        }
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [isClient]);

  // Save cart to localStorage when cartItems change (but only if client-side)
  useEffect(() => {
    if (!isClient) return;

    const currentCart = localStorage.getItem('cart');
    const currentCartParsed = currentCart ? JSON.parse(currentCart) : [];
    
    // Only update if cart actually changed to prevent infinite loops
    const cartChanged = JSON.stringify(cartItems) !== JSON.stringify(currentCartParsed);
    
    if (cartChanged) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      // Use a custom event to notify other components (Header), but mark it as coming from cart
      const event = new CustomEvent('cartUpdated', { detail: { source: 'cart' } });
      window.dispatchEvent(event);
    }
  }, [cartItems, isClient]);

  const updateQuantity = (id: number, change: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (id: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.price) * item.quantity;
    }, 0);
  };

  const handleProceedToCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      {/* Cart Sidebar */}
      <div className={`${styles.cartSidebar} ${isOpen ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.cartHeader}>
          <h2 className={styles.cartTitle}>Shopping Cart</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className={styles.cartItems}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>Your cart is empty</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  <img
                    src={item.image || '/placeholder-image.png'}
                    alt={item.name}
                    className={styles.productImage}
                  />
                </div>
                <div className={styles.itemDetails}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <div className={styles.itemPrice}>£{item.price}</div>
                  <div className={styles.itemActions}>
                    <div className={styles.quantitySelector}>
                      <button
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={styles.quantityValue}>{item.quantity}</span>
                      <button
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <div className={styles.cartSummary}>
            <div className={styles.cartTotal}>
              <span className={styles.totalLabel}>Total:</span>
              <span className={styles.totalAmount}>£{calculateTotal().toFixed(2)}</span>
            </div>
            <button
              className={styles.checkoutButton}
              onClick={handleProceedToCheckout}
            >
              Proceed to Checkout
            </button>
            <button
              className={styles.continueShoppingButton}
              onClick={onClose}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

