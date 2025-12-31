'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './checkout.module.css';
import { CartItem, getCartItems } from '@/lib/cart';
import { showToast } from '@/components/Toast';

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

interface AddressFormState {
  firstName: string;
  lastName: string;
  email: string;
  address1: string;
  city: string;
  postcode: string;
  country: string;
}

// Country options will be loaded dynamically from shipping methods API
const COUNTRY_OPTIONS_STATIC = [
  { code: 'GB', label: 'United Kingdom' },
];

const fallbackCountry = 'GB';

const defaultAddress: AddressFormState = {
  firstName: '',
  lastName: '',
  email: '',
  address1: '',
  city: '',
  postcode: '',
  country: fallbackCountry,
};

interface ShippingOption {
  id: string;
  label: string;
  description?: string;
  amount: string;
  zoneName?: string;
  countries?: string[];
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [billing, setBilling] = useState<AddressFormState>(defaultAddress);
  const [shipping, setShipping] = useState<AddressFormState>(defaultAddress);
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [allShippingOptions, setAllShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [selectedShipping, setSelectedShipping] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryOptions, setCountryOptions] = useState<Array<{ code: string; label: string }>>(COUNTRY_OPTIONS_STATIC);

  const activeShippingCountry = useMemo(() => {
    const selected = shippingSameAsBilling ? billing.country : shipping.country;
    return (selected || fallbackCountry).toUpperCase();
  }, [billing.country, shipping.country, shippingSameAsBilling]);

  const activeCountryLabel =
    countryOptions.find((option) => option.code === activeShippingCountry)?.label ||
    activeShippingCountry;

  useEffect(() => {
    setIsClient(true);
    const loadCart = () => {
      const items = getCartItems();
      setCartItems(items);
    };

    loadCart();
    const handleCartUpdate = () => loadCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const fetchShippingOptions = async () => {
    try {
      setShippingLoading(true);
      setShippingError('');

      const WOOCOMMERCE_URL =
        process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';
      
      if (!WOOCOMMERCE_URL) {
        throw new Error('WooCommerce URL is not configured.');
      }
      
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = new Date().getTime();
      const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/custom/v1/shipping-methods?t=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to load shipping methods.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Failed to load shipping methods: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Custom API returns shipping methods with label field
      const options: ShippingOption[] = (Array.isArray(result) ? result : [])
        .filter((method: any) => method.enabled !== false)
        .map((method: any) => {
          // Strip HTML from description
          let cleanDescription = method.description || method.method_description || '';
          if (cleanDescription) {
            cleanDescription = cleanDescription.replace(/<[^>]*>/g, '').trim();
          }
          
          return {
            id: method.id,
            label: method.label || method.title || method.id,
            description: cleanDescription,
            amount: method.amount ?? method.settings?.cost?.value ?? '0',
            zoneName: method.zoneName,
            countries: (method.countries || []).map((code: string) => code.toUpperCase()),
          };
        });

      setAllShippingOptions(options);

      // Extract unique countries from shipping methods
      const countrySet = new Set<string>();
      options.forEach((option) => {
        if (option.countries && option.countries.length > 0) {
          option.countries.forEach((country) => countrySet.add(country.toUpperCase()));
        }
      });

      // Map country codes to labels
      const countryMap: Record<string, string> = {
        'GB': 'United Kingdom',
        'IE': 'Ireland',
        'US': 'United States',
        'CA': 'Canada',
        'AU': 'Australia',
        'NZ': 'New Zealand',
        'FR': 'France',
        'DE': 'Germany',
        'ES': 'Spain',
        'IT': 'Italy',
        'NL': 'Netherlands',
        'BE': 'Belgium',
        'PT': 'Portugal',
        'GR': 'Greece',
        'AT': 'Austria',
        'CH': 'Switzerland',
        'SE': 'Sweden',
        'NO': 'Norway',
        'DK': 'Denmark',
        'FI': 'Finland',
        'PL': 'Poland',
        'CZ': 'Czech Republic',
        'HU': 'Hungary',
        'RO': 'Romania',
        'BG': 'Bulgaria',
        'HR': 'Croatia',
        'SI': 'Slovenia',
        'SK': 'Slovakia',
        'EE': 'Estonia',
        'LV': 'Latvia',
        'LT': 'Lithuania',
      };

      // Create country options from available countries
      const availableCountries = Array.from(countrySet)
        .map((code) => ({
          code,
          label: countryMap[code] || code,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      // If no countries found in shipping methods, use default
      if (availableCountries.length > 0) {
        setCountryOptions(availableCountries);
        // Update default country if current is not available
        if (!availableCountries.some((c) => c.code === billing.country)) {
          setBilling((prev) => ({ ...prev, country: availableCountries[0].code }));
          setShipping((prev) => ({ ...prev, country: availableCountries[0].code }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching shipping methods:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load shipping methods.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
      } else if (err.name === 'AbortError') {
        // Don't show error for aborted requests
        return;
      }
      
      setShippingError(errorMessage);
    } finally {
      setShippingLoading(false);
    }
  };

  // Load all shipping methods on page load
  useEffect(() => {
    fetchShippingOptions();
  }, []); // Run once on mount

  useEffect(() => {
    if (!allShippingOptions || allShippingOptions.length === 0) {
      setShippingOptions([]);
      setSelectedShipping('');
      return;
    }

    const filtered = filterShippingOptions(allShippingOptions, activeShippingCountry);
    setShippingOptions(filtered);

    if (filtered.length > 0) {
      setSelectedShipping((prev) =>
        filtered.some((option) => option.id === prev) ? prev : filtered[0].id
      );
    } else {
      setSelectedShipping('');
    }
  }, [allShippingOptions, activeShippingCountry]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price || '0');
      return sum + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const shippingOption = useMemo(() => {
    if (!shippingOptions || shippingOptions.length === 0) return undefined;
    return shippingOptions.find((option) => option.id === selectedShipping) || shippingOptions[0];
  }, [selectedShipping, shippingOptions]);

  const shippingCost = shippingOption ? parseFloat(shippingOption.amount || '0') : 0;
  const grandTotal = subtotal + shippingCost;

  const handleInputChange = (
    form: 'billing' | 'shipping',
    field: keyof AddressFormState,
    value: string
  ) => {
    if (form === 'billing') {
      setBilling((prev) => ({ ...prev, [field]: value }));
    } else {
      setShipping((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleShippingCountryChange = (countryCode: string) => {
    if (shippingSameAsBilling) {
      setBilling((prev) => ({ ...prev, country: countryCode }));
      setShipping((prev) => ({ ...prev, country: countryCode }));
    } else {
      setShipping((prev) => ({ ...prev, country: countryCode }));
    }
  };

  const filterShippingOptions = (options: ShippingOption[], countryCode: string) => {
    const normalized = (countryCode || '').toUpperCase();
    return options.filter((option) => {
      if (!option.countries || option.countries.length === 0) {
        return true;
      }
      return option.countries.some((country) => country.toUpperCase() === normalized);
    });
  };

  const validateForm = () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return false;
    }

    if (!billing.firstName || !billing.lastName || !billing.email) {
      setError('First name, last name, and email are required.');
      return false;
    }

    if (!billing.address1 || !billing.city || !billing.postcode || !billing.country) {
      setError('Please complete your billing address.');
      return false;
    }

    if (!shippingSameAsBilling) {
      if (
        !shipping.firstName ||
        !shipping.lastName ||
        !shipping.address1 ||
        !shipping.city ||
        !shipping.postcode ||
        !shipping.country
      ) {
        setError('Please complete your shipping address.');
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        cartItems: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        billing,
        shipping: shippingSameAsBilling ? billing : shipping,
        shippingSameAsBilling,
        shippingOption,
      };

      const WOOCOMMERCE_URL =
        process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';
      
      let response;
      let result;
      
      try {
        console.log('Sending checkout request to:', `${WOOCOMMERCE_URL}/wp-json/custom/v1/checkout`);
        console.log('Payload:', payload);
        
        response = await fetch(`${WOOCOMMERCE_URL}/wp-json/custom/v1/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Check if response is ok before parsing JSON
        const text = await response.text();
        console.log('Response text:', text.substring(0, 500));
        
        try {
          result = JSON.parse(text);
          console.log('Parsed result:', result);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`Server returned invalid JSON: ${text.substring(0, 200)}`);
        }
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        // Network error or CORS error
        if (fetchError.message.includes('Failed to fetch') || 
            fetchError.message.includes('CORS') ||
            fetchError.message.includes('NetworkError') ||
            fetchError.name === 'TypeError') {
          throw new Error('Network error: Unable to connect to server. Please check your connection and try again. If the problem persists, check browser console for details.');
        }
        throw fetchError;
      }

      if (!response.ok) {
        // Handle WordPress REST API error format
        if (result.code && result.message) {
          throw new Error(result.message);
        }
        if (result.error) {
          throw new Error(result.error);
        }
        throw new Error('Failed to place order. Please try again.');
      }

      if (!result.success) {
        throw new Error(result.data?.message || result.error || 'Failed to place order. Please try again.');
      }

      if (!result.data || !result.data.paymentUrl) {
        throw new Error('Invalid response from server. Please try again.');
      }

      showToast('Redirecting to secure payment...');
      window.location.href = result.data.paymentUrl;
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return null;
  }

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h1>Your cart is empty</h1>
        <p>Add some products before heading to checkout.</p>
        <Link href="/product-category" className={styles.primaryButton}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.checkoutContainer}>
        <h1 className={styles.pageTitle}>Checkout</h1>
        <p className={styles.pageSubtitle}>
          Secure checkout powered by PurOstil. Review your details below.
        </p>

        <div className={styles.checkoutGrid}>
          <form className={styles.formColumn} onSubmit={handlePlaceOrder}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Billing Details</h2>
                <p>We use this information to generate your order receipt.</p>
              </div>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>First Name *</span>
                  <input
                    type="text"
                    value={billing.firstName}
                    onChange={(e) => handleInputChange('billing', 'firstName', e.target.value)}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>Last Name *</span>
                  <input
                    type="text"
                    value={billing.lastName}
                    onChange={(e) => handleInputChange('billing', 'lastName', e.target.value)}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>Email *</span>
                  <input
                    type="email"
                    value={billing.email}
                    onChange={(e) => handleInputChange('billing', 'email', e.target.value)}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>Address Line 1 *</span>
                  <input
                    type="text"
                    value={billing.address1}
                    onChange={(e) => handleInputChange('billing', 'address1', e.target.value)}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>City *</span>
                  <input
                    type="text"
                    value={billing.city}
                    onChange={(e) => handleInputChange('billing', 'city', e.target.value)}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>Postcode *</span>
                  <input
                    type="text"
                    value={billing.postcode}
                    onChange={(e) => handleInputChange('billing', 'postcode', e.target.value)}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>Country *</span>
                  <select
                    value={billing.country}
                    onChange={(e) => handleInputChange('billing', 'country', e.target.value)}
                    required
                  >
                    {countryOptions.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Shipping Details</h2>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={shippingSameAsBilling}
                    onChange={(e) => setShippingSameAsBilling(e.target.checked)}
                  />
                  Ship to the billing address
                </label>
              </div>

              {!shippingSameAsBilling && (
                <div className={styles.fieldGrid}>
                  <label className={styles.field}>
                    <span>First Name *</span>
                    <input
                      type="text"
                      value={shipping.firstName}
                      onChange={(e) => handleInputChange('shipping', 'firstName', e.target.value)}
                      required
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Last Name *</span>
                    <input
                      type="text"
                      value={shipping.lastName}
                      onChange={(e) => handleInputChange('shipping', 'lastName', e.target.value)}
                      required
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Address Line 1 *</span>
                    <input
                      type="text"
                      value={shipping.address1}
                      onChange={(e) => handleInputChange('shipping', 'address1', e.target.value)}
                      required
                    />
                  </label>
                  <label className={styles.field}>
                    <span>City *</span>
                    <input
                      type="text"
                      value={shipping.city}
                      onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                      required
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Postcode *</span>
                    <input
                      type="text"
                      value={shipping.postcode}
                      onChange={(e) => handleInputChange('shipping', 'postcode', e.target.value)}
                      required
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Country *</span>
                    <select
                      value={shipping.country}
                      onChange={(e) => handleInputChange('shipping', 'country', e.target.value)}
                      required
                    >
                      {countryOptions.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Delivery Method</h2>
                  <p>Select the shipping speed configured in WooCommerce.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchShippingOptions}
                  disabled={shippingLoading}
                  className={styles.refreshButton}
                  title="Refresh shipping methods"
                >
                  {shippingLoading ? 'Refreshing...' : '↻ Refresh'}
                </button>
              </div>

              <div className={styles.shippingCountryRow}>
                <label className={styles.field}>
                  <span>Ship to country</span>
                  <select
                    value={activeShippingCountry}
                    onChange={(e) => {
                      handleShippingCountryChange(e.target.value);
                      // Refetch shipping methods when country changes to get fresh data
                      fetchShippingOptions();
                    }}
                  >
                    {countryOptions.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className={styles.countryHint}>Rates shown for {activeCountryLabel}.</p>
              </div>

              {shippingLoading && (
                <div className={styles.loadingText}>Loading shipping methods...</div>
              )}

              {shippingError && (
                <div className={styles.errorBanner}>{shippingError}</div>
              )}

              {!shippingLoading && !shippingError && shippingOptions.length === 0 && (
                <p className={styles.emptyShipping}>
                  No shipping methods are enabled for {activeCountryLabel}. Choose a different country
                  or update your WooCommerce zones.
                </p>
              )}

              <div className={styles.shippingOptions}>
                {shippingOptions.map((option) => (
                  <label key={option.id} className={styles.shippingOption}>
                    <input
                      type="radio"
                      name="shipping-option"
                      value={option.id}
                      checked={selectedShipping === option.id}
                      onChange={() => setSelectedShipping(option.id)}
                    />
                    <div>
                      <div className={styles.optionHeader}>
                        <span>
                          {option.label}
                          {option.zoneName ? ` · ${option.zoneName}` : ''}
                        </span>
                        <strong>&nbsp;{currencyFormatter.format(parseFloat(option.amount || '0'))}</strong>
                      </div>
            
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <button type="submit" className={styles.primaryButton} disabled={loading}>
              {loading ? 'Processing...' : `Place Order (${currencyFormatter.format(grandTotal)})`}
            </button>
          </form>

          <aside className={styles.summaryColumn}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Order Summary</h2>
                <p>Review items before continuing to payment.</p>
              </div>
              <div className={styles.cartList}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.cartItemInfo}>
                      <p className={styles.cartItemName}>{item.name}</p>
                      <span className={styles.cartItemQuantity}>Qty: {item.quantity}</span>
                    </div>
                    <div className={styles.cartItemPrice}>
                      {currencyFormatter.format(parseFloat(item.price || '0') * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.summaryTotals}>
                <div>
                  <span>Subtotal</span>
                  <strong>{currencyFormatter.format(subtotal)}</strong>
                </div>
                <div>
                  <span>
                    Shipping
                    {shippingOption ? ` (${shippingOption.label})` : ''}
                    {activeCountryLabel ? ` · ${activeCountryLabel}` : ''}
                  </span>
                  <strong>{currencyFormatter.format(shippingCost)}</strong>
                </div>
                <div className={styles.summaryGrandTotal}>
                  <span>Total</span>
                  <strong>{currencyFormatter.format(grandTotal)}</strong>
                </div>
              </div>
              <div className={styles.paymentNote}>
                <p>
                  Once you place the order you will be redirected to our secure Payment payment
                  page to complete the transaction.
                </p>
              </div>
            </div>

            <div className={styles.helpCard}>
              <h3>Need help?</h3>
              <p>Questions about your order? Our team is ready to help.</p>
              <a href="mailto:contact@purostill.com">contact@purostill.com</a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}


