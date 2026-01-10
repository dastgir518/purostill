import ProductPageClient from './ProductPageClient';
import { Metadata } from 'next';

const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || '';

async function getProduct(slug: string) {
  if (!WOOCOMMERCE_URL) return null;

  try {
    const response = await fetch(
      `${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour, but allow background revalidation
    );

    if (!response.ok) return null;

    const products = await response.json();
    return Array.isArray(products) && products.length > 0 ? products[0] : null;
  } catch (error) {
    console.error('Error fetching product in SSR:', error);
    return null;
  }
}


import { getPostSeo } from '@/lib/public-api';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Fetch SEO data
  const seoData = await getPostSeo('product', params.slug).catch(() => null);

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

  // Fallback to simpler metadata if API fails
  return {
    title: `Product - ${params.slug}`,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [product, seoData] = await Promise.all([
    getProduct(params.slug),
    getPostSeo('product', params.slug).catch(() => null),
  ]);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
      </div>
    );
  }

  return (
    <>
      {seoData?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.schema) }}
        />
      )}
      <ProductPageClient initialProduct={product} slug={params.slug} />
    </>
  );
}
