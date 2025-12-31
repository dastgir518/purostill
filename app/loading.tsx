'use client';

import styles from './page.module.css';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/Skeleton';

const CATEGORY_PLACEHOLDER_COUNT = 5;
const BESTSELLER_PLACEHOLDER_COUNT = 4;

export default function Loading() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero} aria-hidden="true">
          <div className={styles.heroContent}>
            <div className={styles.heroCopyBlock}>
              <Skeleton height="2.5rem" width="60%" />
              <SkeletonText lines={2} className={styles.heroSkeletonText} />
            </div>
            <Skeleton height="3rem" width="180px" borderRadius="999px" />
          </div>
        </section>

        <section className={styles.categoriesSection} aria-hidden="true">
          <Skeleton height="2rem" width="40%" />
          <div className={styles.categoriesGrid}>
            {Array.from({ length: CATEGORY_PLACEHOLDER_COUNT }).map((_, index) => (
              <div key={index} className={styles.categoryTile}>
                <Skeleton height="48px" width="48px" borderRadius="12px" />
                <div className={styles.categoryText}>
                  <Skeleton height="1rem" width="70%" />
                  <Skeleton height="0.875rem" width="50%" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.bestsellersSection} aria-hidden="true">
          <Skeleton height="2rem" width="30%" />
          <div className={styles.bestsellerGrid}>
            {Array.from({ length: BESTSELLER_PLACEHOLDER_COUNT }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </section>

        <section className={styles.whyChooseSection} aria-hidden="true">
          <div className={styles.whyChooseGrid}>
            <Skeleton height="420px" />
            <div className={styles.whyChooseContent}>
              <Skeleton height="2rem" width="60%" />
              <SkeletonText lines={3} className={styles.sectionHeading} />
              <div className={styles.whyChoosePoints}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className={styles.whyChoosePoint}>
                    <Skeleton height="42px" width="42px" borderRadius="12px" />
                    <div style={{ flex: 1 }}>
                      <Skeleton height="1rem" width="70%" />
                      <Skeleton height="0.875rem" width="90%" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.testimonialsSection} aria-hidden="true">
          <Skeleton height="2rem" width="35%" />
          <div className={styles.testimonialGrid}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={styles.testimonialCard}>
                <Skeleton height="1.25rem" width="50%" />
                <SkeletonText lines={3} className={styles.testimonialQuote} />
                <div className={styles.testimonialMeta}>
                  <Skeleton height="48px" width="48px" borderRadius="50%" />
                  <div>
                    <Skeleton height="1rem" width="80%" />
                    <Skeleton height="0.875rem" width="60%" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.newsletterSection} aria-hidden="true">
          <div className={styles.newsletterContent}>
            <div className={styles.newsletterCopy}>
              <Skeleton height="2rem" width="60%" />
              <SkeletonText lines={2} />
            </div>
            <div className={styles.newsletterForm}>
              <Skeleton height="3rem" width="100%" borderRadius="999px" />
            </div>
            <div className={styles.newsletterSocial}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} height="40px" width="40px" borderRadius="12px" />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

