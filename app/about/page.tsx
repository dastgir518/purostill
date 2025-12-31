import Link from 'next/link';
import styles from './page.module.css';
import { Metadata } from 'next';
import { getPageSeoById, SeoData } from '@/lib/graphql';

const PAGE_ID = 3203;
export const revalidate = 86400;

const whyChoosePoints = [
  {
    title: 'Complete Approach',
    description:
      'Instead of pushing a single solution, we offer a flexible range of systems, filters, treatment options and tests, so you can mix and match what works for you.',
  },
  {
    title: 'Carefully Selected Products',
    description:
      'We focus on quality, practicality and long-term reliability, not just what&apos;s trending.',
  },
  {
    title: 'Future-Ready Range',
    description:
      'As technology and customer needs evolve, our catalogue is built to expand – from advanced purification methods to new smart hydration tools.',
  },
  {
    title: 'Support That Cares',
    description:
      'Whether you&apos;re comparing systems or looking for the right replacement filter, we&apos;re here to help you find a clear answer, not a hard sell.',
  },
];

const productCategories = [
  {
    title: 'Water Systems',
    description: 'Complete purification units for kitchens, offices, clinics and more.',
  },
  {
    title: 'Filters',
    description: 'Replacement and upgrade filters to keep your system working at its best.',
  },
  {
    title: 'Specialised Treatment',
    description: 'Targeted options for more challenging water conditions or specific requirements.',
  },
  {
    title: 'Testing Kits',
    description: 'Simple kits to help you check and monitor your water quality over time.',
  },
  {
    title: 'Accessories',
    description: 'Practical add-ons and spare parts that protect and enhance your setup.',
  },
  {
    title: 'Smart Hydration Essentials',
    description: 'Everyday pieces that make it easier to drink more and drink better.',
  },
];

const lookingAheadGoals = [
  'Improve your drinking water',
  'Understand your water quality',
  'Upgrade or expand your purification setup',
  'Make pure water an effortless part of everyday life',
];

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
    title: 'About PurOstill | Purostill',
    description: 'Discover the story, mission, and people behind PurOstill&apos;s modern hydration experience.',
  };
}

export default async function AboutPage() {
  const seoData: SeoData = await getPageSeoById(PAGE_ID);

  return (
    <div className={styles.page}>
      {seoData?.schema?.raw && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seoData.schema.raw }}
        />
      )}
      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p>About PurOstill</p>
            <h1>Pure water, made simple.</h1>
            <p>
              At PurOstill, we believe every home deserves easy access to clean, great-tasting water. That&apos;s why we specialise in complete water purification solutions – from compact systems and filters to specialised treatment, testing kits and smart hydration essentials – all designed to help you understand and improve the water you use every day.
            </p>
          </div>
        </section>

        <section>
          <div className={styles.sectionHeading}>
            <h2>How PurOstill Started</h2>
          </div>
          <div className={styles.storySplit}>
            <div className={styles.storyCopy}>
              <p>
                PurOstill began with a straightforward idea: if people could see the difference between untreated water and purified water, they&apos;d never go back.
              </p>
              <p>
                What started as a focus on a single type of system quickly grew. Customers wanted more ways to improve their water:
              </p>
              <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', color: '#5a6b76' }}>
                <li>Different system sizes for different homes</li>
                <li>Replacement filters to keep performance high</li>
                <li>Tools to test what&apos;s really in their water</li>
                <li>Accessories and hydration products to make pure water a natural part of their day</li>
              </ul>
              <p style={{ marginTop: '1rem' }}>
                So we evolved from a one-product solution into a full water purification range.
              </p>
            </div>
            <div className={styles.storyImageWrapper}>
              <img
                src="https://backend-ps.purostill.com/wp-content/uploads/2025/12/purostill-water-purification-about-us.png"
                alt="PurOstill water purification team"
                className={styles.storyImage}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section>
          <div className={styles.sectionHeading}>
            <h2>From One Unit to Complete Water Solutions</h2>
            <p>
              Today, PurOstill offers a broad ecosystem of products so you can build the setup that fits your life:
            </p>
          </div>
          <div className={styles.impactGrid}>
            {productCategories.map((category) => (
              <div key={category.title} className={styles.impactCard}>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem', color: '#5a6b76' }}>
            Whether you&apos;re just starting with your first system or upgrading a full household setup, PurOstill is designed to grow with you.
          </p>
        </section>

        <section>
          <div className={styles.sectionHeading}>
            <h2>How We Think About Water Quality</h2>
            <p>
              For us, good water isn&apos;t just about taste – it&apos;s about clarity, consistency and confidence.
            </p>
            <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', color: '#5a6b76' }}>
              <li>We focus on straightforward explanations, not scare tactics.</li>
              <li>We highlight key performance details in plain language wherever possible.</li>
              <li>We encourage customers to test and track their water, so they can see the difference their choices make.</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              Our aim is to give you both better water and better understanding, so every decision feels informed, not overwhelming.
            </p>
          </div>
        </section>

        <section>
          <div className={styles.sectionHeading}>
            <h2>Why Choose PurOstill?</h2>
          </div>
          <div className={styles.statsGrid}>
            {whyChoosePoints.map((point) => (
              <div key={point.title} className={styles.statCard}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: '#0f3a4f' }}>{point.title}</h3>
                <p className={styles.statLabel}>{point.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className={styles.sectionHeading}>
            <h2>Looking Ahead</h2>
            <p>
              PurOstill is continually developing and expanding its range to meet the changing needs of homes, businesses and specialist environments. Our goal is to become the place you think of first when you want to:
            </p>
            <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', color: '#5a6b76' }}>
              {lookingAheadGoals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Pure Water, Your Way</h2>
          <p>
            No two homes, families or workplaces are exactly the same – and neither are their water needs. With PurOstill, you can build a solution that fits your space, your preferences and your peace of mind.
          </p>
          <p style={{ marginTop: '1rem' }}>
            Explore our range today and take the next step towards clearer, cleaner, better-tasting water – every single day.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <Link href="/product-category" className={styles.ctaButton}>
              Explore our range
            </Link>
          </div>
        </section>

        <section className={styles.socialSection}>
          <h3>Follow us</h3>
          <div className={styles.socialLinks}>
            <a href="https://www.facebook.com/purostillwater" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <FacebookIcon />
            </a>
            <a href="https://www.instagram.com/purostillwater/" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <InstagramIcon />
            </a>
            <a href="https://www.youtube.com/@purostillwater" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
              <YouTubeIcon />
            </a>
            <a href="https://www.tiktok.com/@purostill" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
              <TikTokIcon />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M22.675 0h-21.35C.602 0 0 .602 0 1.343v21.314c0 .741.602 1.343 1.325 1.343h11.494V15.11H9.423V11.8h3.4v-2.58c0-3.378 2.062-5.22 5.078-5.22 1.446 0 2.688.107 3.05.156v3.13h-1.847c-1.64 0-1.956.78-1.956 1.922v2.44h3.46l-.45 3.31h-3.01V24h6.115c.723 0 1.325-.602 1.325-1.343V1.343C24 .602 23.398 0 22.675 0z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}
