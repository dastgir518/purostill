import { Metadata } from 'next';
import { getPageSeoById, SeoData } from '@/lib/graphql';
import ContactPageClient from './ContactPageClient';

const PAGE_ID = 3205;
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const seoData: SeoData = await getPageSeoById(PAGE_ID);

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

  return {
    title: 'Contact Us | Purostill',
  };
}

export default async function ContactPage() {
  const seoData: SeoData = await getPageSeoById(PAGE_ID);

  return (
    <>
      {seoData?.schema?.raw && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seoData.schema.raw }}
        />
      )}
      <ContactPageClient />
    </>
  );
}
