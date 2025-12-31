import styles from './page.module.css';
import { decodeHtmlEntities } from '@/lib/utils';
import { Metadata } from 'next';
import { getPageSeoById, SeoData } from '@/lib/graphql';

const PAGE_ID = 1268;
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
    console.error('Terms page fetch failed:', error);
    return null;
  }
}

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
    title: 'Terms & Conditions - PurOstill',
  };
}

export default async function TermsAndConditionsPage() {
  const [page, seoData] = await Promise.all([
    fetchWordPressPage(PAGE_ID),
    getPageSeoById(PAGE_ID) as Promise<SeoData>
  ]);

  const title = decodeHtmlEntities(page?.title?.rendered || 'Terms & Conditions');
  const updatedAt = page?.modified ? new Date(page.modified).toLocaleDateString() : null;
  const content = page?.content?.rendered ? decodeHtmlEntities(page.content.rendered) : null;

  return (
    <div className={styles.page}>
      <article className={styles.container}>
        {seoData?.schema?.raw && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: seoData.schema.raw }}
          />
        )}
        <header className={styles.header}>
          <p className={styles.eyebrow}>Legal</p>
          <h1 className={styles.title}>{title}</h1>
          {updatedAt && <p className={styles.meta}>Last updated: {updatedAt}</p>}
        </header>

        {content ? (
          <section className={styles.content} dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className={styles.error}>
            Terms & Conditions are currently unavailable. Please refresh or email contact@purostill.com.
          </div>
        )}
      </article>
    </div>
  );
}

