import styles from './page.module.css';
import { decodeHtmlEntities } from '@/lib/utils';
import { Metadata } from 'next';
import { getPageSeoById, SeoData } from '@/lib/graphql';

const POLICY_PAGE_ID = 1358;
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
    console.error('Shipping policy fetch failed:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seoData: SeoData = await getPageSeoById(POLICY_PAGE_ID);

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
    title: 'Shipping Policy - PurOstill',
  };
}

export default async function ShippingPolicyPage() {
  const [policy, seoData] = await Promise.all([
    fetchWordPressPage(POLICY_PAGE_ID),
    getPageSeoById(POLICY_PAGE_ID) as Promise<SeoData>
  ]);

  const title = decodeHtmlEntities(policy?.title?.rendered || 'Shipping Policy');
  const updatedAt = policy?.modified ? new Date(policy.modified).toLocaleDateString() : null;
  const content = policy?.content?.rendered ? decodeHtmlEntities(policy.content.rendered) : null;

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
          <p className={styles.eyebrow}>Customer care</p>
          <h1 className={styles.title}>{title}</h1>
          {updatedAt && <p className={styles.meta}>Last updated: {updatedAt}</p>}
        </header>

        {content ? (
          <section className={styles.content} dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className={styles.error}>
            Shipping policy details are currently unavailable. Please refresh or email contact@purostill.com.
          </div>
        )}
      </article>
    </div>
  );
}

