import { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';
import { getPostSeo } from '@/lib/public-api';

const PAGE_ID = 3205;
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getPostSeo('page', PAGE_ID).catch(() => null);

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
    title: 'Contact Us | Purostill',
  };
}

export default async function ContactPage() {
  const seoData = await getPostSeo('page', PAGE_ID).catch(() => null);

  return (
    <>
      {seoData?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.schema) }}
        />
      )}
      <ContactPageClient />
    </>
  );
}
