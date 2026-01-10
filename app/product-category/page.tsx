import Link from 'next/link';
import FilterSidebar from '@/components/FilterSidebar';
import ProductCard, { type Product } from '@/components/ProductCard';
import { Skeleton, SkeletonCard } from '@/components/Skeleton';
import { decodeHtmlEntities } from '@/lib/utils';
import styles from './category.module.css';
import ShopPageClient from '@/app/product-category/ShopPageClient';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
}

const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || '';

async function getShopData() {
  if (!WOOCOMMERCE_URL) return { categories: [], products: [] };

  try {
    const [categoriesRes, productsRes] = await Promise.all([
      fetch(`${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products/categories?per_page=100`, { next: { revalidate: 3600 } }),
      fetch(`${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products?per_page=100&status=publish`, { next: { revalidate: 3600 } }),
    ]);

    const categories = await categoriesRes.json();
    const products = await productsRes.json();

    return {
      categories: Array.isArray(categories) ? categories : [],
      products: Array.isArray(products) ? products : [],
    };
  } catch (error) {
    console.error('Error fetching shop data in SSR:', error);
    return { categories: [], products: [] };
  }
}

import { getPostSeo } from '@/lib/public-api';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getPostSeo('page', 'shop').catch(() => null);

  if (seoData?.seo_meta) {
    return {
      title: seoData.seo_meta.meta_title,
      description: seoData.seo_meta.meta_description,
      openGraph: {
        title: seoData.seo_meta.meta_title,
        description: seoData.seo_meta.meta_description,
        images: seoData.seo_meta.og_image ? [{ url: seoData.seo_meta.og_image }] : undefined,
      },
      robots: {
        index: !seoData.seo_meta.noindex,
        follow: true,
      }
    };
  }

  return {
    title: 'Shop - PurOstill',
    description: 'Browse our collection of water distillers and accessories.',
  };
}

export default async function ShopPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const { categories, products } = await getShopData();
  const seoData = await getPostSeo('page', 'shop').catch(() => null);

  return (
    <>
      {seoData?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.schema) }}
        />
      )}
      <ShopPageClient
        initialCategories={categories}
        initialProducts={products}
        searchParams={searchParams}
      />
    </>
  );
}

