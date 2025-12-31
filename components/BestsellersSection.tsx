'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { decodeHtmlEntities, stripHtml } from '@/lib/utils';
import AddToCartButton from '@/components/AddToCartButton';
import styles from '@/app/page.module.css';

const BESTSELLER_TAG_SLUG = 'bestsellers';

type Product = {
  id: number;
  name: string;
  slug: string;
  price?: string;
  sale_price?: string;
  regular_price?: string;
  images?: Array<{ src: string; alt?: string }>;
  average_rating?: string;
  rating_count?: number;
  tags?: Array<{ slug?: string }>;
  prices?: { price?: string | number };
  price_html?: string;
};

type CardProduct = {
  id: number;
  title: string;
  price: { amount: string; currency: string };
  rating: number;
  reviews: string;
  image: string;
  imageAlt?: string;
  href: string;
  slug: string;
  rawPrice: string;
};

const currencyMap = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  '$': '$',
  '£': '£',
  '€': '€',
};

function normalizePrice(product: Product) {
  // Store API uses prices.price, fallback to price or price_html
  let rawPrice: any = product.prices?.price || product.price;

  // If we have price_html, use that (it's already formatted)
  const html = product.price_html ? stripHtml(product.price_html) : '';
  const raw = html || (rawPrice ? rawPrice.toString() : '');

  if (!raw) {
    return null;
  }

  // Handle numeric prices (may be in pence/cents)
  let numericValue: number | null = null;
  if (typeof rawPrice === 'number') {
    numericValue = rawPrice;
  } else {
    // Try to extract number from string
    const match = raw.replace(/[£$€,\s]/g, '').match(/[\d.]+/);
    numericValue = match ? parseFloat(match[0]) : null;
  }

  // If it's a whole number > 50, likely in pence/cents
  if (numericValue !== null && Number.isInteger(numericValue) && numericValue > 50 && numericValue < 1000000) {
    numericValue = numericValue / 100;
  }

  // Format the amount
  let amount: string;
  if (numericValue !== null) {
    amount = numericValue.toFixed(2);
  } else {
    // Fallback to string extraction
    const matches = decodeHtmlEntities(raw).match(/(£|\$|€|USD|GBP|EUR)\s?[0-9]+(?:[.,][0-9]+)?/g);
    const priceFragment = matches?.[matches.length - 1] || raw;
    const currencyMatch = priceFragment.match(/(£|\$|€|USD|GBP|EUR)/);
    amount = priceFragment.replace(currencyMatch?.[0] || '', '').trim();
  }

  // Determine currency
  const currencyMatch = raw.match(/(£|\$|€|USD|GBP|EUR)/);
  const currencySymbol =
    currencyMatch && currencyMatch[0] in currencyMap
      ? currencyMap[currencyMatch[0] as keyof typeof currencyMap]
      : currencyMatch?.[0] || '£';

  return {
    currency: currencySymbol,
    amount: amount,
  };
}

function mapProductToCard(product: Product): CardProduct | null {
  const price = normalizePrice(product);
  if (!price) {
    return null;
  }

  return {
    id: product.id,
    title: decodeHtmlEntities(product.name),
    price,
    rating: Math.min(5, Math.max(0, parseFloat(product.average_rating || '0') || 0)),
    reviews: product.rating_count ? product.rating_count.toLocaleString() : '0',
    image: product.images?.[0]?.src || '',
    imageAlt: product.images?.[0]?.alt,
    href: `/product/${product.slug}`,
    slug: product.slug,
    rawPrice: product.price || product.sale_price || product.regular_price || price.amount,
  };
}

function StarRating({ rating, reviews }: { rating: number; reviews: string }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div className={styles.ratingRow}>
      {Array.from({ length: 5 }).map((_, index) => {
        if (index < fullStars) {
          return (
            <span key={index} className={styles.star}>
              ★
            </span>
          );
        }

        if (index === fullStars && hasHalf) {
          return (
            <span key={index} className={`${styles.star} ${styles.starHalf}`}>
              ★
            </span>
          );
        }

        return (
          <span key={index} className={`${styles.star} ${styles.starEmpty}`}>
            ☆
          </span>
        );
      })}
      <span className={styles.reviewCount}>({reviews})</span>
    </div>
  );
}

export default function BestsellersSection({ initialProducts = [] }: { initialProducts?: any[] }) {
  const [bestsellers, setBestsellers] = useState<CardProduct[]>(() =>
    initialProducts
      .map(mapProductToCard)
      .filter((product): product is CardProduct => product !== null)
  );
  const [loading, setLoading] = useState(false);

  // If initialProducts change (though unlikely in SSR), update state
  useEffect(() => {
    if (initialProducts.length > 0) {
      setBestsellers(
        initialProducts
          .map(mapProductToCard)
          .filter((product): product is CardProduct => product !== null)
      );
    }
  }, [initialProducts]);

  if (loading) {
    return (
      <section className={styles.bestsellersSection}>
        <h2>Our Bestsellers</h2>
        <div className={styles.bestsellerGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className={styles.bestsellerCard}>
              <div style={{ height: '200px', backgroundColor: '#f0f0f0', borderRadius: '8px' }} />
              <div style={{ padding: '1rem' }}>
                <div style={{ height: '20px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }} />
                <div style={{ height: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px', width: '60%' }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (bestsellers.length === 0) {
    return null;
  }

  return (
    <section className={styles.bestsellersSection}>
      <h2>Our Bestsellers</h2>
      <div className={styles.bestsellerGrid}>
        {bestsellers.map((product) => (
          <article key={`${product.id}-${product.slug}`} className={styles.bestsellerCard}>
            <Link href={product.href} className={styles.bestsellerLinkArea}>
              <div className={styles.bestsellerMedia}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt={product.imageAlt || product.title} />
              </div>
              <div className={styles.bestsellerContent}>
                <h3>{product.title}</h3>
                <StarRating rating={product.rating} reviews={product.reviews} />
                <p className={styles.productPrice}>
                  <span className={styles.currency}>{product.price.currency}</span>
                  {product.price.amount}
                </p>
              </div>
            </Link>
            <div className={styles.cardActions}>
              <AddToCartButton
                className={styles.cardButton}
                product={{
                  id: product.id,
                  title: product.title,
                  slug: product.slug,
                  image: product.image,
                  price: product.rawPrice,
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

