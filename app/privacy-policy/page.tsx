import styles from './page.module.css';
import { decodeHtmlEntities } from '@/lib/utils';
import { Metadata } from 'next';
import { getPostSeo } from '@/lib/public-api';

const PAGE_ID = 1251;
const WP_URL = process.env.WOOCOMMERCE_URL ?? 'https://test.purostill.com';
export const revalidate = 86400;

type WordPressPage = {
  id: number;
  title?: { rendered?: string };
  content?: { rendered?: string };
  modified?: string;
};

async function fetchWordPressPage(pageId: number): Promise<WordPressPage | null> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/pages/${pageId}`, {
      next: { revalidate },
    });

    if (!res.ok) {
      throw new Error(`Failed to load page ${pageId}: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Privacy page fetch failed:', error);
    return null;
  }
}

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
    title: 'Privacy Policy - PurOstill',
  };
}

export default async function PrivacyPolicyPage() {
  const [page, seoData] = await Promise.all([
    fetchWordPressPage(PAGE_ID),
    getPostSeo('page', PAGE_ID).catch(() => null),
  ]);

  const title = decodeHtmlEntities(page?.title?.rendered || 'Privacy Policy');
  const updatedAt = page?.modified ? new Date(page.modified).toLocaleDateString() : null;
  const content = page?.content?.rendered ? decodeHtmlEntities(page.content.rendered) : null;

  return (
    <div className={styles.page}>
      {seoData?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.schema) }}
        />
      )}
      <article className={styles.container}>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Compliance</p>
          <h1 className={styles.title}>{title}</h1>
          {updatedAt && <p className={styles.meta}>Last updated: {updatedAt}</p>}
        </header>

        {content ? (
          <section className={styles.content} dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className={styles.error}>
            Privacy policy details are currently unavailable. Please refresh or email contact@purostill.com.
          </div>
        )}
      </article>
    </div>
  );
}

