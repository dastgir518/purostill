'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './product.module.css';
import { SkeletonProductPage, Skeleton, SkeletonText } from '@/components/Skeleton';
import { decodeHtmlEntities } from '@/lib/utils';
import PaymentModal from '@/components/Checkout/PaymentModal';
import InlineCheckout from '@/components/Checkout/InlineCheckout';

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
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
        if (product && activeTab === 'reviews') {
            fetchReviews();
        }
    }, [product, activeTab]);

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
            // Use WooCommerce Store API to get product reviews
            const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products/${product.id}/reviews`);
            const reviews = await response.json();

            if (Array.isArray(reviews)) {
                setReviews(reviews);
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

        const { addToCart } = require('@/lib/cart');
        const mainImage = product.images?.[0]?.src || '';

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price || product.sale_price || product.regular_price || '0.00',
            image: mainImage,
            slug: product.slug,
        }, quantity);
    };

    const handleBuyNow = () => {
        setIsPaymentModalOpen(true);
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

    const mainImage = product.images?.[selectedImageIndex] || product.images?.[0];
    const rating = parseFloat(product.average_rating || '0');
    const discountPercent = product.on_sale && product.regular_price
        ? Math.round(((parseFloat(product.regular_price) - parseFloat(product.price)) / parseFloat(product.regular_price)) * 100)
        : 0;
    const savings = product.on_sale && product.regular_price
        ? (parseFloat(product.regular_price) - parseFloat(product.price)).toFixed(2)
        : '0.00';

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
                        {product.on_sale && discountPercent > 0 && (
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
                        <Link href="#reviews" className={styles.readReviewsLink}>
                            Read Reviews
                        </Link>
                    </div>

                    {/* Pricing */}
                    <div className={styles.pricingSection}>
                        <div className={styles.priceContainer}>
                            <span className={styles.currentPrice}>
                                £{product.price || product.sale_price || product.regular_price || '0.00'}
                            </span>
                            {product.on_sale && product.regular_price && (
                                <span className={styles.originalPrice}>£{product.regular_price}</span>
                            )}
                        </div>
                        {product.on_sale && discountPercent > 0 && (
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
                        >
                            Add to Cart
                        </button>
                        <button
                            className={styles.buyNowButton}
                            onClick={handleBuyNow}
                            style={{
                                backgroundColor: '#000',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                marginLeft: '10px',
                                cursor: 'pointer',
                            }}
                        >
                            Buy Now
                        </button>
                    </div>

                    {/* Inline Express Checkout (Google Pay / Apple Pay) */}
                    <div className={styles.expressCheckoutSection}>
                        <InlineCheckout
                            amount={(parseFloat(product.price || product.sale_price || product.regular_price || '0') * quantity)}
                            currency="GBP"
                        />
                    </div>
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
                                                <div>
                                                    <strong>{review.reviewer}</strong>
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

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                amount={(parseFloat(product.price || product.sale_price || product.regular_price || '0') * quantity)}
                currency="GBP"
            />
        </div>
    );
}

