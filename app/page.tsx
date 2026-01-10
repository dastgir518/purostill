import Link from 'next/link';
import { Metadata } from 'next';
import { getMenu } from '@/lib/menu';
import { decodeHtmlEntities } from '@/lib/utils';
import BestsellersSection from '@/components/BestsellersSection';
import styles from './page.module.css';

// Note: Static export - this will be pre-rendered at build time

type CategoryItem = {
  title: string;
  subtitle: string;
  icon: string;
  spanWide?: boolean;
  href: string;
};

const CATEGORY_MENU_ID = 108;

const materialIcons = {
  waterPurifiers: 'air_purifier',
  replacementFilters: 'filter_alt',
  smartBottles: 'water_bottle',
  installationKits: 'build',
  accessories: 'add_circle',
};

const fallbackCategoryItems: CategoryItem[] = [
  {
    title: 'Water Purifiers',
    subtitle: 'Whole-home & targeted solutions for tough water challenges.',
    icon: materialIcons.waterPurifiers,
    href: '#',
  },
  {
    title: 'Replacement Filters',
    subtitle: 'Long-lasting filters to polish taste, remove odours and reduce residual contaminants.',
    icon: materialIcons.replacementFilters,
    href: '#',
  },
  {
    title: 'Water Systems',
    subtitle: 'Gravity, countertop systems for everyday pure drinking water.',
    icon: materialIcons.smartBottles,
    href: '#',
  },
  {
    title: 'Testing Kits',
    subtitle: 'Easy-to-use kits to see exactly what’s in your water before and after filtration.',
    icon: materialIcons.installationKits,
    href: '#',
  },
  {
    title: 'Accessories',
    subtitle: 'Jugs, cleaners and spare parts that keep your equipment running at peak performance.',
    icon: materialIcons.accessories,
    spanWide: true,
    href: '#',
  },
];

const whyChoosePoints = [
  {
    icon: 'verified',
    title: 'Quality You Can Trust',
    description:
      'Every product is tested to strict quality standards and independently certified for performance and safety, so you know exactly what\'s coming out of the tap.',
  },
  {
    icon: 'rocket_launch',
    title: 'Advanced Purification Technology',
    description:
      'From gravity filters to distillation systems, we use proven technologies to remove contaminants like chlorine, heavy metals, micro-plastics, and more—without compromising taste.',
  },
  {
    icon: 'support_agent',
    title: 'Expert, Human Support',
    description:
      'Not sure which system you need? Our expert team is here to help with product selection, installation guidance, and ongoing maintenance advice.',
  },
];

const testimonials = [
  {
    quote:
      '“The water tastes incredibly clean now. My whole family noticed the difference immediately. Installation was a breeze with the guide provided. Highly recommend the AquaHome Pro!”',
    author: 'Sarah J.',
    role: 'Verified Buyer',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC4ZYsxhjzN1O20owMkczSPRDhQFj6jpYEpO11RHUeZPopMKIzKigO5jIeYo1-3pCJHz2k8SY5Dzm1Ys5LEKFHJGKpHLrhC78rFYAKczuSdxk5JJbiTT2lfvfHxf9ySSYh7Pvdxi3ZNY1M9nQvXSvlj5SpmgAj4EFxNNcHb0NSXb9CXLKwWE96It6nsCiuxxp8BAMX6XsqxzVKRLlwBRBeRWrHwYsptWglHwAaFxZgXPw-ST_KG-kw3zG69C05NmBY_yx-Zx_ZGN7f',
    rating: 5,
  },
  {
    quote:
      '“I was skeptical at first, but the UnderSink Ultra-Flow has been a game-changer for our kitchen. No more plastic bottles, and the water pressure is still great. Fantastic product.”',
    author: 'Mark T.',
    role: 'Verified Buyer',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCN0-1uC6E3mxatsMgkkflwPXCUPRiWYP49n11tEMnAs7AUCWE5xnvgMupKUBCKTtFPnGxdcre_UYLa_mU0GnduOw_uabSFi1y5-Lan0nFajBI3PcPWHwIdOquTBsV5OJtFPS8Bv42RKrNhXN7jAsYUU1pfRmj9LC1DYg_sLQXCfiFh6YzIUNM_8BSR6EpHr22yHSQXdIfBu1SIxYlSxMVoX4i1rnJBD-XiQruvwfia0s432mu9TRdxeP47IBdMYDk2QUbr0lA7o7uN',
    rating: 5,
  },
  {
    quote:
      '“Customer service was so helpful when I had a question about which filter I needed. They responded quickly and pointed me in the right direction. A+ service and products.”',
    author: 'Emily R.',
    role: 'Verified Buyer',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDGiwjnufXMPqxf1I5bnh3lvkMirSdMcZGbj4dAfFhKQBERGe_86bS2jHc8sKjJ1ARhaSMda3Ect_lkh7ZxeY0R_eA9UDEVtjFz9VP02rgfxsDU_VFkm-i_ugiE-aOnT3S0JK0vFxPfqLayVPWacO_-6pDt7SlN40dtUq34i1nTkesZ7AeID62kIy0dGUNF3Y4wnp8oMWjZziD5r87s5oPoxEDmifAFBn2TqWzezSQ-ctjGhMZQw6Bw88bqmuF6FQgXQbj8Y0vVeSBS',
    rating: 4.5,
  },
];


import { getPublicProducts, getPublicTags } from '@/lib/woocommerce';

async function getBestsellers() {
  try {
    // 1. Efficiently find the tag ID for 'bestsellers'
    const tags = await getPublicTags({ search: 'bestsellers' });
    const bestsellerTag = Array.isArray(tags)
      ? tags.find((t: any) => t.slug === 'bestsellers')
      : null;

    if (bestsellerTag?.id) {
      // 2. Fetch ONLY products with that tag ID
      return await getPublicProducts({
        tag: bestsellerTag.id,
        status: 'publish',
        per_page: 20,
      });
    }

    // Fallback: If tag ID not found, fetch a sample and filter (only as a last resort)
    const products = await getPublicProducts({
      status: 'publish',
      per_page: 100,
    });

    return Array.isArray(products)
      ? products.filter((p: any) => p.tags?.some((t: any) => t.slug === 'bestsellers'))
      : [];
  } catch (error) {
    console.error('Error fetching bestsellers on server:', error);
    return [];
  }
}

import { getPostSeo } from '@/lib/public-api';

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getPostSeo('page', 156).catch(() => null);

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
        follow: true, // Assuming follow unless specified, API only shows noindex boolean in example
      }
    };
  }

  return {
    title: 'Purostill - Premium Water Distillers',
    description: 'Discover the purest water with Purostill water distillers.',
  };
}

export default async function Home() {
  const [categoryMenuItems, bestsellers, seoData] = await Promise.all([
    fetchCategoryMenuItems(),
    getBestsellers(),
    getPostSeo('page', 156).catch(() => null),
  ]);

  const categoryItems = categoryMenuItems.length > 0 ? categoryMenuItems : fallbackCategoryItems;

  return (
    <div className={styles.page}>
      {seoData?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.schema) }}
        />
      )}
      <main className={styles.main}>
        <section
          className={styles.hero}
          style={{
            backgroundImage:
              'linear-gradient(rgba(0, 20, 30, 0.4) 0%, rgba(0, 20, 30, 0.7) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBNXJ_X_X8qKhuTVwPs55X0ra6pJUAX3qWb3scg37JySEGoRTDrn4ygPM5r2T17BBwNgn5EXU4ElBprbj2YA6tIKXopAmuRG2XF0s3dXT6T0pc3omNYmaht3KU_fya4HqZWNKS2OCYGurwevnY__3PFZScurqxuiHguxCIIVfNJrAwFUeGil38S0Os7GxEEbA95MjiMlB7Co-gD-wHwj9T9Zz1ygU6R1zVOdr-pMw40etYWG57HC4xY9NuEC97NA9XdyqrxTt_dFrKq")',
          }}
          data-alt="A modern, clean kitchen sink area with a water purifier installed."
        >
          <div className={styles.heroContent}>
            <div className={styles.heroCopyBlock}>
              <h1>Pure Water, Pure Life.</h1>
              <p>From simple setups to advanced multi-stage systems and water testing PurOstill helps you take charge of every drop you drink.</p>
            </div>
            <Link href="/product-category" className={styles.heroButton}>
              <span>Shop All Water Solutions</span>
            </Link>
          </div>
        </section>

        <section className={styles.categoriesSection}>
          <h2>Shop by Purification Need</h2>
          <div className={styles.categoriesGrid}>
            {categoryItems.map((category: CategoryItem) => (
              <Link
                key={category.title}
                href={category.href || '#'}
                className={`${styles.categoryTile} ${category.spanWide ? styles.categoryTileWide : ''}`}
              >
                <div className={styles.categoryIcon} aria-hidden>
                  <span className={styles.materialIcon}>{category.icon}</span>
                </div>
                <div className={styles.categoryText}>
                  <h3>{category.title}</h3>
                  <p>{category.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <BestsellersSection initialProducts={bestsellers} />

        <section className={styles.whyChooseSection}>
          <div className={styles.whyChooseGrid}>
            <div className={styles.whyChooseImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9jAyhEcTTVI9ibyUjCchKQky0GqFFZnyiT1eO0BpI16eB3PEA85KmjsenRh-4gvk39krugTeCUpIqhU9BuY3pGLyxORDhpi3fXthcA6hG2uYbm6K6ASDWTfH1hNIX01PDesuexK7JYAv7oavMW9KpNPGmEqqjPHQQwZ1rIhX-u_wpnCZQT2Frz5dRatOcqBaoOWEqniXJRhogq3ntk27UGJJMjdtvHtZrsGGU8XbFusakbzB85KyNqZdHBUv7Nn-I-P6curasSIh2"
                alt="A family smiling and drinking clean water in a bright, modern kitchen."
              />
            </div>
            <div className={styles.whyChooseContent}>
              <div className={styles.sectionHeading}>
                <h2>Why Choose PurOstill?</h2>
                <p>
                  Your health and peace of mind come first. Every PurOstill Product is built to deliver consistent purity, backed by rigorous testing and long-term support.
                </p>
              </div>
              <div className={styles.whyChoosePoints}>
                {whyChoosePoints.map((point) => (
                  <div key={point.title} className={styles.whyChoosePoint}>
                    <div className={styles.whyIcon} aria-hidden>
                      <span className={styles.materialIconSmall}>{point.icon}</span>
                    </div>
                    <div>
                      <h3>{point.title}</h3>
                      <p>{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/about" className={styles.heroButton}>
                <span>Learn more about PuroStill</span>
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.testimonialsSection}>
          <h2>Loved by Our Customers</h2>
          <div className={styles.testimonialGrid}>
            {testimonials.map((testimonial) => (
              <article key={testimonial.author} className={styles.testimonialCard}>
                <div className={styles.testimonialRating}>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const isHalf = testimonial.rating - index === 0.5;
                    if (index + 1 <= Math.floor(testimonial.rating)) {
                      return (
                        <span key={index} className={`${styles.materialIconSmall} ${styles.testimonialStar}`}>
                          star
                        </span>
                      );
                    }
                    if (isHalf) {
                      return (
                        <span key={index} className={`${styles.materialIconSmall} ${styles.testimonialStar}`}>
                          star_half
                        </span>
                      );
                    }
                    return (
                      <span key={index} className={`${styles.materialIconSmall} ${styles.testimonialStarEmpty}`}>
                        star
                      </span>
                    );
                  })}
                </div>
                <blockquote className={styles.testimonialQuote}>{testimonial.quote}</blockquote>
                <div className={styles.testimonialMeta}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={testimonial.avatar} alt={testimonial.author} />
                  <div>
                    <p className={styles.testimonialAuthor}>{testimonial.author}</p>
                    <p className={styles.testimonialRole}>{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.newsletterSection}>
          <div className={styles.newsletterContent}>
            <div className={styles.newsletterCopy}>
              <h2>Stay Hydrated with the Latest News</h2>
              <p>
                Subscribe to our newsletter for exclusive offers, new product alerts, and tips on healthy hydration.
              </p>
            </div>
            <form className={styles.newsletterForm}>
              <input type="email" placeholder="Enter your email address" aria-label="Email address" />
              <button type="submit">
                <span>Subscribe</span>
              </button>
            </form>
            <div className={styles.newsletterSocial}>
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
          </div>
        </section>
      </main>
    </div>
  );
}



async function fetchCategoryMenuItems(): Promise<CategoryItem[]> {
  try {
    const menu = await getMenu(CATEGORY_MENU_ID);
    const items = Array.isArray(menu?.items) ? menu.items : [];

    return items.slice(0, fallbackCategoryItems.length).map((item: any, index: number) => {
      const fallback = fallbackCategoryItems[index] ?? fallbackCategoryItems[0];
      return {
        title: decodeHtmlEntities(item.title || fallback.title),
        subtitle: item.description ? decodeHtmlEntities(item.description) : fallback.subtitle,
        icon: fallback.icon,
        spanWide: fallback.spanWide,
        href: normalizeMenuUrl(item.url) || fallback.href,
      };
    });
  } catch (error) {
    console.error('Failed to fetch category menu:', error);
    return [];
  }
}

function normalizeMenuUrl(url?: string) {
  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url);
    const pathname =
      parsed.pathname.endsWith('/') && parsed.pathname !== '/' ? parsed.pathname.slice(0, -1) : parsed.pathname;
    return `${pathname || '/'}${parsed.search}${parsed.hash}`;
  } catch {
    const stripped = url.replace(/^https?:\/\/[^/]+/i, '');
    if (!stripped) {
      return '/';
    }
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  }
}


function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M22.675 0h-21.35C.602 0 0 .602 0 1.343v21.314c0 .741.602 1.343 1.325 1.343h11.494V15.11H9.423V11.8h3.4v-2.58c0-3.378 2.062-5.22 5.078-5.22 1.446 0 2.688.107 3.05.156v3.13h-1.847c-1.64 0-1.956.78-1.956 1.922v2.44h3.46l-.45 3.31h-3.01V24h6.115c.723 0 1.325-.602 1.325-1.343V1.343C24 .602 23.398 0 22.675 0z" />
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

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

