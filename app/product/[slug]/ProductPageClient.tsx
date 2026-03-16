'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { sendGAEvent } from '@next/third-parties/google';
import styles from './product.module.css';
import { SkeletonProductPage, Skeleton, SkeletonText } from '@/components/Skeleton';
import { decodeHtmlEntities } from '@/lib/utils';

import InlineCheckout from '@/components/Checkout/InlineCheckout';

interface Variation {
    id: number;
    attributes: Array<{ name: string; value: string }>;
    price: string;
    regular_price: string;
    sale_price: string;
    on_sale: boolean;
    stock_status: string;
    image?: { src: string; alt: string; id: number };
}

interface Product {
    id: number;
    name: string;
    slug: string;
    price: string;
    regular_price: string;
    sale_price: string;
    on_sale: boolean;
    images: Array<{ src: string; alt: string; id: number }>;
    average_rating: string;
    rating_count: number;
    short_description: string;
    description: string;
    featured: boolean;
    attributes?: Array<{
        id: number;
        name: string;
        options: string[];
        visible: boolean;
    }>;
    variations?: Variation[];
    [key: string]: any;
}

interface Review {
    id: number;
    date_created: string;
    reviewer: string;
    reviewer_email: string;
    review: string;
    rating: number;
    verified: boolean;
    helpful?: number;
}

/**
 * Extract numeric price value from Store API price (handles formatted strings and pence/cents)
 */
function extractPriceValue(price: any): string {
    if (!price && price !== 0) return '0.00';

    let numericValue: number;

    if (typeof price === 'number') {
        numericValue = price;
    } else {
        // Remove currency symbols and extract number
        const match = price.toString().replace(/[£$€,\s]/g, '').match(/[\d.]+/);
        numericValue = match ? parseFloat(match[0]) : 0;
    }

    // WooCommerce Store API may return prices as integers in smallest currency unit (pence/cents)
    // If it's a whole number and seems large (likely in pence), divide by 100
    // Check if it's a whole number and > 50 (to avoid dividing £0.50 = 50 pence)
    if (Number.isInteger(numericValue) && numericValue > 50 && numericValue < 1000000) {
        // Likely in pence/cents, convert to main currency unit
        numericValue = numericValue / 100;
    }

    // Format to 2 decimal places
    return numericValue.toFixed(2);
}

/**
 * Map WooCommerce Store API product to Product interface
 */
function mapStoreApiProduct(storeProduct: any): Product {
    // Store API uses prices.price instead of price
    const rawPrice = storeProduct.prices?.price || storeProduct.price || '0';
    const rawRegularPrice = storeProduct.prices?.regular_price || storeProduct.regular_price || rawPrice;
    const rawSalePrice = storeProduct.prices?.sale_price || storeProduct.sale_price || '';

    const price = extractPriceValue(rawPrice);
    const regularPrice = extractPriceValue(rawRegularPrice);
    const salePrice = rawSalePrice ? extractPriceValue(rawSalePrice) : '';

    const onSale = price !== regularPrice &&
        regularPrice !== '0.00' &&
        parseFloat(price) < parseFloat(regularPrice);

    // Map attributes - Store API may return them in different format
    // Check multiple possible locations for attributes
    const rawAttributes = storeProduct.attributes || storeProduct.product_attributes || [];

    const mappedAttributes = (Array.isArray(rawAttributes) ? rawAttributes : []).map((attr: any) => {
        // Handle different attribute formats
        const attrName = attr.name || attr.label || attr.slug || '';
        const attrOptions = attr.options || attr.values || attr.terms || [];

        return {
            id: attr.id || attr.attribute_id || attr.term_id || 0,
            name: decodeHtmlEntities(attrName),
            options: Array.isArray(attrOptions)
                ? attrOptions.map((opt: any) => {
                    // Handle different option formats
                    if (typeof opt === 'string') {
                        return decodeHtmlEntities(opt);
                    }
                    return decodeHtmlEntities(opt.name || opt.value || opt.label || opt.slug || '');
                })
                : [],
            visible: attr.visible !== false && attr.visible_on_product !== false && attr.is_visible !== false, // Default to visible if not specified
        };
    }).filter((attr: any) => attr.name && attr.options.length > 0); // Only include attributes with name and options

    // Map variations if present
    const mappedVariations = (Array.isArray(storeProduct.variations) ? storeProduct.variations : [])
        .filter((v: any) => typeof v === 'object')
        .map((v: any) => {
            const vPrice = v.prices?.price || v.price || '0';
            const vRegularPrice = v.prices?.regular_price || v.regular_price || vPrice;
            const vSalePrice = v.prices?.sale_price || v.sale_price || '';

            return {
                id: v.id,
                attributes: Array.isArray(v.attributes) ? v.attributes.map((a: any) => ({
                    name: decodeHtmlEntities(a.name),
                    value: decodeHtmlEntities(a.value || a.option)
                })) : [],
                price: extractPriceValue(vPrice),
                regular_price: extractPriceValue(vRegularPrice),
                sale_price: vSalePrice ? extractPriceValue(vSalePrice) : '',
                on_sale: v.on_sale || false,
                stock_status: v.is_in_stock ? 'instock' : 'outofstock',
                image: v.image ? {
                    src: v.image.src,
                    alt: decodeHtmlEntities(v.image.alt || ''),
                    id: v.image.id
                } : undefined
            };
        });

    return {
        id: storeProduct.id,
        name: decodeHtmlEntities(storeProduct.name || ''),
        slug: storeProduct.slug || '',
        price: price,
        regular_price: regularPrice,
        sale_price: salePrice,
        on_sale: onSale,
        images: storeProduct.images?.map((img: any) => ({
            src: img.src || img.url || '',
            alt: decodeHtmlEntities(img.alt || storeProduct.name || ''),
            id: img.id || 0,
        })) || [],
        average_rating: storeProduct.average_rating?.toString() || '0',
        rating_count: storeProduct.rating_count || 0,
        short_description: decodeHtmlEntities(storeProduct.short_description || storeProduct.excerpt || ''),
        //description: decodeHtmlEntities(storeProduct.description || ''),
        //short_description: storeProduct.short_description || storeProduct.excerpt || '',
        description: storeProduct.description || '',
        featured: storeProduct.featured || false,
        attributes: mappedAttributes,
        variations: mappedVariations,
    };
}

export default function ProductPageClient({ initialProduct, slug: initialSlug }: { initialProduct: any, slug: string }) {
    const params = useParams();
    const pathname = usePathname();

    const [slug, setSlug] = useState<string>(initialSlug);
    const [product, setProduct] = useState<Product | null>(initialProduct ? mapStoreApiProduct(initialProduct) : null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(!initialProduct);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

    // Variation State
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [currentVariation, setCurrentVariation] = useState<Variation | null>(null);

    // Track view_item event
    useEffect(() => {
        if (initialProduct) {
            sendGAEvent('event', 'view_item', {
                currency: 'GBP',
                value: initialProduct.price ? parseFloat(initialProduct.price) : 0,
                items: [{
                    item_id: initialProduct.id,
                    item_name: initialProduct.name,
                    price: initialProduct.price ? parseFloat(initialProduct.price) : 0,
                }]
            });
        }
    }, [initialProduct]);

    // Initialize defaults if only 1 option or auto-select
    useEffect(() => {
        if (product?.variations && product.variations.length > 0 && Object.keys(selectedAttributes).length === 0) {
            // Optional: Pre-select first variation? Or leave empty.
            // Let's leave empty to force user selection unless we want default.
        }
    }, [product]);

    // Fetch detailed variation data (prices) if missing
    useEffect(() => {
        const fetchDetailedVariations = async () => {
            // Only run if we have variations but they look incomplete (e.g. missing price or price is 0)
            if (!product?.variations || product.variations.length === 0) return;

            try {
                // Check if we suspect missing data. If we just mapped from Store API list, prices might be '0'.
                // We'll trust the check inside the map to filter/update.

                const WOOCOMMERCE_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';

                const updatedVariations = await Promise.all(product.variations.map(async (v) => {
                    // Optimized: if we have a seemingly valid price, skip.
                    // If price is '0', '0.00' or empty, we must fetch details.
                    if (v.price && v.price !== '0' && v.price !== '0.00' && v.price !== '') return v;

                    try {
                        const res = await fetch(`${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products/${v.id}`);
                        if (res.ok) {
                            const details = await res.json();
                            const vPrice = details.prices?.price || details.price || '0';
                            const vRegularPrice = details.prices?.regular_price || details.regular_price || vPrice;
                            const vSalePrice = details.prices?.sale_price || details.sale_price || '';

                            return {
                                ...v,
                                price: extractPriceValue(vPrice),
                                regular_price: extractPriceValue(vRegularPrice),
                                sale_price: vSalePrice ? extractPriceValue(vSalePrice) : '',
                                on_sale: details.on_sale || false,
                                stock_status: details.is_in_stock ? 'instock' : 'outofstock',
                                image: details.images?.[0] ? {
                                    src: details.images[0].src,
                                    alt: details.images[0].alt || '',
                                    id: details.images[0].id
                                } : v.image
                            };
                        }
                    } catch (e) {
                        console.error(`Failed to fetch variation ${v.id}`, e);
                    }
                    return v;
                }));

                // Only update if something changed
                // Simple check: compare JSON or just set it. React handles shallow diffs but deep object ref change triggers re-render.
                setProduct(prev => prev ? ({ ...prev, variations: updatedVariations }) : null);

            } catch (e) {
                console.error("Error fetching variation details", e);
            }
        };

        fetchDetailedVariations();

    }, [product?.id]); // Run when product ID changes

    // Update current variation based on selection
    useEffect(() => {
        if (!product?.variations || product.variations.length === 0) {
            setCurrentVariation(null);
            return;
        }

        const match = product.variations.find(v =>
            v.attributes.every(a => selectedAttributes[a.name] === a.value)
        );

        if (match) {
            setCurrentVariation(match);
            // Optionally update main image
            if (match.image) {
                const imgIndex = product.images.findIndex(img => img.src === match.image?.src);
                if (imgIndex !== -1) setSelectedImageIndex(imgIndex);
            }
        } else {
            setCurrentVariation(null);
        }
    }, [selectedAttributes, product]);

    // Update slug and product when pathname changes (if navigating between products)
    useEffect(() => {
        // Extract slug from pathname instead of relying on prop if it's a client-side navigation
        const match = pathname?.match(/^\/product\/([^/]+)/);
        const newSlug = match ? match[1] : initialSlug;

        if (newSlug && newSlug !== slug) {
            setSlug(newSlug);
            setLoading(true);
        }
    }, [pathname, initialSlug]);

    // Fetch product when slug is available and it's not the initial product
    useEffect(() => {
        if (slug && slug !== initialSlug) {
            fetchProduct();
        } else if (initialProduct && slug === initialSlug) {
            setProduct(mapStoreApiProduct(initialProduct));
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    useEffect(() => {
        if (product) {
            fetchReviews();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id]); // Only refetch if product ID changes

    const fetchProduct = async () => {
        if (!slug) {
            console.error('No slug provided');
            setProduct(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const WOOCOMMERCE_URL =
                process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';

            if (!WOOCOMMERCE_URL) {
                console.error('WooCommerce URL is not configured');
                setProduct(null);
                setLoading(false);
                return;
            }

            console.log('Fetching product with slug:', slug);

            // Use WooCommerce Store API to get product by slug
            // Always fetch fresh data to handle new products added after build
            const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`, {
                cache: 'no-store',
            });

            if (!response.ok) {
                // If product not found (404), set product to null
                if (response.status === 404) {
                    setProduct(null);
                    setLoading(false);
                    return;
                }
                throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
            }

            const products = await response.json();

            if (Array.isArray(products) && products.length > 0) {
                // Map Store API product to our Product interface
                const mappedProduct = mapStoreApiProduct(products[0]);
                setProduct(mappedProduct);
            } else {
                // Product not found
                setProduct(null);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            // Set product to null to show "not found" message
            setProduct(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        if (!product) return;

        try {
            setReviewsLoading(true);
            const WOOCOMMERCE_URL =
                process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';
            // Use custom endpoint to get product reviews
            const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/custom/v1/reviews?product_id=${product.id}`);

            if (!response.ok) {
                console.warn(`Custom reviews endpoint failed: ${response.status}`);
                // Fallback to standard endpoint or empty
                setReviews([]);
                return;
            }

            const reviews = await response.json();

            if (Array.isArray(reviews)) {
                setReviews(reviews);

                // Calculate and update product rating/count based on actual reviews
                if (reviews.length > 0) {
                    const totalRating = reviews.reduce((acc: number, review: any) => acc + (parseFloat(review.rating) || 0), 0);
                    const avgRating = (totalRating / reviews.length).toFixed(2);

                    setProduct(prev => prev ? ({
                        ...prev,
                        rating_count: reviews.length,
                        average_rating: avgRating
                    }) : null);
                } else {
                    setProduct(prev => prev ? ({
                        ...prev,
                        rating_count: 0,
                        average_rating: '0'
                    }) : null);
                }

            } else {
                setReviews([]);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleQuantityChange = (change: number) => {
        setQuantity((prev) => Math.max(1, prev + change));
    };

    const handleAddToCart = () => {
        if (!product) return;

        // Validation for variable products
        if (product.variations && product.variations.length > 0 && !currentVariation) {
            // Optional: Shake animation or error message
            return;
        }

        const { addToCart } = require('@/lib/cart');

        // Determine item data based on variation or simple product
        const id = currentVariation ? currentVariation.id : product.id;
        const price = currentVariation
            ? (currentVariation.price || currentVariation.sale_price || currentVariation.regular_price || '0.00')
            : (product.price || product.sale_price || product.regular_price || '0.00');
        const image = currentVariation?.image?.src || product.images?.[0]?.src || '';
        const name = currentVariation
            ? `${product.name} - ${currentVariation.attributes.map(a => a.value).join(', ')}`
            : product.name;

        addToCart({
            id,
            name,
            price,
            image,
            slug: product.slug,
        }, quantity);
    };



    if (loading) {
        return <SkeletonProductPage />;
    }

    if (!product) {
        return (
            <div className={styles.error}>
                <h1>Product not found</h1>
                <Link href="/">Go to Home</Link>
            </div>
        );
    }

    const mainImage = currentVariation?.image
        ? currentVariation.image
        : (product.images?.[selectedImageIndex] || product.images?.[0]);

    const activePrice = currentVariation
        ? (currentVariation.price || currentVariation.sale_price || currentVariation.regular_price || '0.00')
        : (product.price || product.sale_price || product.regular_price || '0.00');

    const activeRegularPrice = currentVariation
        ? (currentVariation.regular_price || activePrice)
        : (product.regular_price || activePrice);

    const isOnSale = currentVariation ? currentVariation.on_sale : product.on_sale;

    const discountPercent = isOnSale && activeRegularPrice
        ? Math.round(((parseFloat(activeRegularPrice) - parseFloat(activePrice)) / parseFloat(activeRegularPrice)) * 100)
        : 0;

    const savings = isOnSale && activeRegularPrice
        ? (parseFloat(activeRegularPrice) - parseFloat(activePrice)).toFixed(2)
        : '0.00';

    const rating = parseFloat(product.average_rating || '0');

    const renderStars = (ratingValue?: number) => {
        const stars = ratingValue !== undefined ? ratingValue : rating;
        const fullStars = Math.floor(stars);
        const hasHalfStar = stars % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <div className={styles.rating}>
                {Array.from({ length: fullStars }).map((_, i) => (
                    <span key={i} className={styles.starFull}>★</span>
                ))}
                {hasHalfStar && <span className={styles.starHalf}>★</span>}
                {Array.from({ length: emptyStars }).map((_, i) => (
                    <span key={i} className={styles.starEmpty}>☆</span>
                ))}
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years} year${years > 1 ? 's' : ''} ago`;
        }
    };

    const getRatingDistribution = () => {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            const rating = review.rating;
            if (rating >= 1 && rating <= 5) {
                distribution[rating as keyof typeof distribution]++;
            }
        });
        return distribution;
    };

    return (
        <div className={styles.productPage}>
            <div className={styles.productContainer}>
                {/* Left Side - Product Images */}
                <div className={styles.imageSection}>
                    <div className={styles.mainImageContainer}>
                        {isOnSale && discountPercent > 0 && (
                            <span className={styles.discountBadge}>{discountPercent}% OFF</span>
                        )}
                        {product.featured && (
                            <span className={styles.bestsellerBadge}>BEST SELLER</span>
                        )}
                        {mainImage && (
                            <img
                                src={mainImage.src}
                                alt={mainImage.alt || product.name}
                                className={styles.mainImage}
                            />
                        )}
                    </div>

                    {/* Thumbnail Images */}
                    {product.images && product.images.length > 1 && (
                        <div className={styles.thumbnailContainer}>
                            {product.images.map((image, index) => (
                                <button
                                    key={image.id || index}
                                    className={`${styles.thumbnail} ${selectedImageIndex === index ? styles.thumbnailActive : ''}`}
                                    onClick={() => setSelectedImageIndex(index)}
                                >
                                    <img
                                        src={image.src}
                                        alt={image.alt || `${product.name} - Image ${index + 1}`}
                                        className={styles.thumbnailImage}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side - Product Details */}
                <div className={styles.detailsSection}>
                    <h1 className={styles.productTitle}>{product.name}</h1>

                    {/* Rating */}
                    <div className={styles.ratingSection}>
                        {renderStars()}
                        <span className={styles.reviewCount}>({product.rating_count || 0} reviews)</span>
                    </div>

                    {/* Pricing */}
                    <div className={styles.pricingSection}>
                        <div className={styles.priceContainer}>
                            <span className={styles.currentPrice}>
                                £{activePrice}
                            </span>
                            {isOnSale && activeRegularPrice && (
                                <span className={styles.originalPrice}>£{activeRegularPrice}</span>
                            )}
                        </div>
                        {isOnSale && discountPercent > 0 && (
                            <div className={styles.savingsContainer}>
                                <span className={styles.savingsBadge}>Save £{savings}</span>
                                <span className={styles.savingsText}>
                                    You save {discountPercent}% with this offer!
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Short Description (includes Key Features) */}
                    {product.short_description && (
                        <div
                            className={styles.shortDescription}
                            dangerouslySetInnerHTML={{ __html: product.short_description }}
                        />
                    )}

                    {/* Variation Selectors */}
                    {product.variations && product.variations.length > 0 && product.attributes && (
                        <div className={styles.variationSection}>
                            {product.attributes
                                .filter(attr => {
                                    if (!attr.visible || attr.options.length === 0) return false;

                                    // Filter based on actual usage in variations
                                    // Check if any variation uses this attribute
                                    const isUsedInVariations = product.variations?.some(v =>
                                        v.attributes.some(a => a.name === attr.name)
                                    );

                                    return isUsedInVariations;
                                })
                                .map((attr, index) => (
                                    <div key={attr.id || index} className={styles.attributeGroup}>
                                        <label htmlFor={`attr-${attr.name}`} className={styles.attributeLabel}>
                                            {attr.name}
                                        </label>
                                        <div className={styles.attributeSelectContainer}>
                                            <select
                                                id={`attr-${attr.name}`}
                                                className={styles.attributeSelect}
                                                value={selectedAttributes[attr.name] || ''}
                                                onChange={(e) => setSelectedAttributes(prev => ({ ...prev, [attr.name]: e.target.value }))}
                                            >
                                                <option value="" disabled>Choose an option</option>
                                                {attr.options.map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    {/* Quantity and Add to Cart */}
                    <div className={styles.addToCartSection}>
                        <div className={styles.quantitySelector}>
                            <button
                                className={styles.quantityButton}
                                onClick={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1}
                            >
                                −
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className={styles.quantityInput}
                            />
                            <button
                                className={styles.quantityButton}
                                onClick={() => handleQuantityChange(1)}
                            >
                                +
                            </button>
                        </div>
                        <button
                            className={styles.addToCartButton}
                            onClick={handleAddToCart}
                            disabled={product.variations && product.variations.length > 0 && !currentVariation}
                            style={{ opacity: (product.variations && product.variations.length > 0 && !currentVariation) ? 0.6 : 1, cursor: (product.variations && product.variations.length > 0 && !currentVariation) ? 'not-allowed' : 'pointer' }}
                        >
                            {product.variations && product.variations.length > 0 && !currentVariation
                                ? 'Select Options'
                                : 'Add to Cart'}
                        </button>

                    </div>

                    {/* Inline Express Checkout (Google Pay / Apple Pay) */}
                    {(parseFloat(activePrice) * quantity) > 0 && (
                        <div className={styles.expressCheckoutSection}>
                            <InlineCheckout
                                amount={(parseFloat(activePrice) * quantity)}
                                currency="GBP"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs Section - Full width below product details */}
            <div className={styles.tabsSection}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'description' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('description')}
                    >
                        Description
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'specifications' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('specifications')}
                    >
                        Technical Specifications
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Reviews ({product.rating_count || 0})
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {/* Description Tab */}
                    {activeTab === 'description' && product.description && (
                        <div
                            className={styles.descriptionContent}
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    )}

                    {/* Specifications Tab */}
                    {activeTab === 'specifications' && (
                        <div className={styles.specificationsContent}>
                            {product.attributes && product.attributes.length > 0 ? (
                                <div className={styles.specificationsGrid}>
                                    {product.attributes
                                        .filter(attr => attr.visible !== false && attr.options && attr.options.length > 0)
                                        .flatMap((attr, attrIndex) =>
                                            attr.options.map((option: string, optIndex: number) => {
                                                // Use attribute name as label and option as value
                                                // If option contains ":", split it; otherwise use attribute name
                                                const hasColon = option.includes(':');
                                                const label = hasColon ? option.split(':')[0]?.trim() : attr.name;
                                                const value = hasColon ? option.split(':').slice(1).join(':').trim() : option;
                                                // Use attrIndex and optIndex to ensure unique keys
                                                return { label, value, key: `attr-${attrIndex}-opt-${optIndex}` };
                                            })
                                        )
                                        .reduce((columns: any[][], item, index) => {
                                            const columnIndex = index % 2;
                                            if (!columns[columnIndex]) {
                                                columns[columnIndex] = [];
                                            }
                                            columns[columnIndex].push(item);
                                            return columns;
                                        }, [])
                                        .map((column, colIndex) => (
                                            <div key={colIndex} className={styles.specificationColumn}>
                                                {column.map((item) => (
                                                    <div key={item.key} className={styles.specificationRow}>
                                                        <span className={styles.specificationLabel}>{item.label}</span>
                                                        <span className={styles.specificationValue}>{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className={styles.noSpecifications}>
                                    <p>No technical specifications available for this product.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div className={styles.reviewsContent}>
                            <div className={styles.reviewsSummary}>
                                <div className={styles.ratingBreakdown}>
                                    <div className={styles.averageRating}>{parseFloat(product.average_rating || '0').toFixed(1)}</div>
                                    <div className={styles.reviewsTotal}>Based on {product.rating_count || 0} reviews</div>
                                    {renderStars()}
                                </div>
                                <div className={styles.ratingDistribution}>
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const distribution = getRatingDistribution();
                                        const count = distribution[star as keyof typeof distribution];
                                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                        return (
                                            <div key={star} className={styles.ratingBar}>
                                                <span>{star} star</span>
                                                <div className={styles.barContainer}>
                                                    <div
                                                        className={styles.barFill}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {reviewsLoading ? (
                                <div className={styles.loadingReviews}>
                                    <SkeletonText lines={3} />
                                </div>
                            ) : reviews.length > 0 ? (
                                <div className={styles.reviewsList}>
                                    {reviews.map((review) => (
                                        <div key={review.id} className={styles.reviewItem}>
                                            <div className={styles.reviewHeader}>
                                                <div className={styles.reviewerInfo}>
                                                    <strong className={styles.reviewerName}>{review.reviewer || 'Anonymous'}</strong>
                                                    {review.verified && (
                                                        <span className={styles.verifiedBadge}>Verified Purchase</span>
                                                    )}
                                                </div>
                                                <div className={styles.reviewMeta}>
                                                    {renderStars(review.rating)}
                                                    <span className={styles.reviewDate}>{formatDate(review.date_created)}</span>
                                                </div>
                                            </div>
                                            <p className={styles.reviewText}>{review.review}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.noReviews}>
                                    <p>No reviews yet. Be the first to review this product!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
}

