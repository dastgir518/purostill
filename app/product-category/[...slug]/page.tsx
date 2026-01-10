import CategoryPageClient from './CategoryPageClient';
import { Metadata } from 'next';

const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || '';

async function getCategoryData(slug: string) {
  if (!WOOCOMMERCE_URL || !slug) return null;

  try {
    const slugParts = slug.split('/');
    const categorySlug = slugParts[slugParts.length - 1];

    // Fetch all categories to find the one matching the slug
    const catRes = await fetch(`${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products/categories?per_page=100&hide_empty=false`, { next: { revalidate: 3600 } });
    if (!catRes.ok) return null;

    const allCategories = await catRes.json();
    const currentCategory = allCategories.find((cat: any) => cat.slug === categorySlug);

    if (!currentCategory) return null;

    // Fetch products, subcategories, and parent category in parallel
    const [productsRes, subRes] = await Promise.all([
      fetch(`${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products?category=${currentCategory.id}&per_page=100`, { next: { revalidate: 3600 } }),
      fetch(`${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products/categories?parent=${currentCategory.id}&per_page=100&hide_empty=false`, { next: { revalidate: 3600 } }),
    ]);

    const products = await productsRes.json();
    const subRaw = await subRes.json();

    // WooCommerce Store API might return all categories if parent filter is ignored
    // Manually filter to ensure we only have direct children (subcategories)
    const subcategories = Array.isArray(subRaw)
      ? subRaw.filter((cat: any) => cat.parent === currentCategory.id)
      : [];

    let parentCategory = null;
    if (currentCategory.parent > 0) {
      parentCategory = allCategories.find((cat: any) => cat.id === currentCategory.parent);
    }

    return {
      category: currentCategory,
      products: Array.isArray(products) ? products : [],
      subcategories: Array.isArray(subcategories) ? subcategories : [],
      parentCategory
    };
  } catch (error) {
    console.error('Error fetching category data in SSR:', error);
    return null;
  }
}

import { getTermSeo } from '@/lib/public-api';

export async function generateMetadata({ params }: { params: { slug: string[] } }): Promise<Metadata> {
  // Handle nested slugs, e.g., ['filters', 'carbon-filters'] -> 'carbon-filters'
  const slug = params.slug[params.slug.length - 1];

  const seoData = await getTermSeo('product_cat', slug).catch(() => null);

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
    title: `Category: ${slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' ')}`,
  };
}

export default async function CategoryPage({ params, searchParams }: { params: { slug: string[] }, searchParams: any }) {
  const slugJoined = params.slug.join('/');
  const slugLeaf = params.slug[params.slug.length - 1];

  const [initialData, seoData] = await Promise.all([
    getCategoryData(slugJoined),
    getTermSeo('product_cat', slugLeaf).catch(() => null),
  ]);

  return (
    <>
      {seoData?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.schema) }}
        />
      )}
      <CategoryPageClient
        initialData={initialData}
        slug={slugJoined}
        initialSearchParams={searchParams}
      />
    </>
  );
}
