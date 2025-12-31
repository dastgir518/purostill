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

import { getProductSeo, SeoData } from '@/lib/graphql';


export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const seoData: SeoData = await getProductSeo(params.slug);
  console.log(`[SEO] Fetching metadata for product: ${params.slug}`, JSON.stringify(seoData, null, 2));

  if (seoData) {
    return {
      title: seoData.title,
      description: seoData.metaDesc,
      openGraph: {
        title: seoData.opengraphTitle || seoData.title,
        description: seoData.opengraphDescription || seoData.metaDesc,
        images: seoData.opengraphImage ? [{ url: seoData.opengraphImage.sourceUrl }] : [],
        url: seoData.canonical,
      },
      twitter: {
        card: 'summary_large_image',
        title: seoData.twitterTitle || seoData.title,
        description: seoData.twitterDescription || seoData.metaDesc,
        images: seoData.twitterImage ? [seoData.twitterImage.sourceUrl] : [],
      },
      alternates: {
        canonical: seoData.canonical,
      },
    };
  }

  // Fallback to simpler metadata if GraphQL fails (or product not found in graph)
  return {
    title: `Product - ${params.slug}`,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  const seoData: SeoData = await getProductSeo(params.slug);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
      </div>
    );
  }

  return (
    <>
      {seoData?.schema?.raw && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seoData.schema.raw }}
        />
      )}
      <ProductPageClient initialProduct={product} slug={params.slug} />
    </>
  );
}
