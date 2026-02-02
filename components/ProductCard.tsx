'use client';

import Link from 'next/link';
import styles from './ProductCard.module.css';
import { addToCart } from '@/lib/cart';

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  images: Array<{ src: string; alt: string }>;
  average_rating: string;
  rating_count: number;
  categories?: Array<{ id: number; name: string }>;
  attributes?: Array<{ name: string; options: string[] }>;
  meta_data?: Array<{ key: string; value: string }>;
  [key: string]: any;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.src || '/placeholder-product.jpg';

  const discountPercent = product.on_sale && product.regular_price
    ? Math.round(((parseFloat(product.regular_price) - parseFloat(product.price)) / parseFloat(product.regular_price)) * 100)
    : 0;

  // Extract specifications from attributes or meta_data
  const getSpecs = () => {
    const specs: string[] = [];

    // Try to get from attributes
    product.attributes?.forEach((attr: any) => {
      if (attr.name && attr.options && attr.options.length > 0) {
        specs.push(attr.options[0]);
      }
    });

    // Try to get from meta_data
    if (specs.length === 0) {
      product.meta_data?.forEach((meta: any) => {
        if (meta.key && ['capacity', 'power', 'material'].includes(meta.key.toLowerCase())) {
          specs.push(meta.value);
        }
      });
    }

    return specs.slice(0, 3); // Limit to 3 specs
  };

  const specs = getSpecs();



  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const imageUrl = product.images?.[0]?.src || '/placeholder-product.jpg';

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price || product.sale_price || product.regular_price || '0.00',
      image: imageUrl,
      slug: product.slug,
    });
  };

  return (
    <div className={styles.productCard}>
      <Link href={`/product/${product.slug}`} className={styles.productLink}>
        <div className={styles.imageContainer}>
          {product.on_sale && (
            <span className={styles.saleBadge}>Sale</span>
          )}
          <img
            src={imageUrl}
            alt={product.images?.[0]?.alt || product.name}
            className={styles.productImage}
          />
        </div>
        <div className={styles.productInfo}>
          <h3 className={styles.productTitle}>{product.name}</h3>

          {specs.length > 0 && (
            <div className={styles.specs}>
              {specs.map((spec, index) => (
                <span key={index} className={styles.specTag}>{spec}</span>
              ))}
            </div>
          )}



          <div className={styles.priceContainer}>
            {product.on_sale && product.regular_price ? (
              <>
                <span className={styles.currentPrice}>£{product.price}</span>
                <span className={styles.originalPrice}>£{product.regular_price}</span>
                {discountPercent > 0 && (
                  <span className={styles.discountBadge}>{discountPercent}% OFF</span>
                )}
              </>
            ) : (
              <span className={styles.currentPrice}>£{product.price}</span>
            )}
          </div>

          <button
            className={styles.addToCartButton}
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </Link>
    </div>
  );
}

