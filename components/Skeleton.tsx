import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = '4px',
  className = '' 
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 ? '80%' : '100%'}
          className={styles.skeletonText}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.skeletonCard} ${className}`}>
      <Skeleton height="200px" borderRadius="8px" className={styles.skeletonImage} />
      <div className={styles.skeletonCardContent}>
        <Skeleton height="1.25rem" width="60%" />
        <SkeletonText lines={2} className={styles.skeletonTextContainer} />
        <Skeleton height="1.5rem" width="40%" />
      </div>
    </div>
  );
}

export function SkeletonProductPage() {
  return (
    <div className={styles.skeletonProductPage}>
      <div className={styles.skeletonProductContainer}>
        {/* Image Section */}
        <div className={styles.skeletonImageSection}>
          <Skeleton height="600px" borderRadius="8px" />
          <div className={styles.skeletonThumbnails}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="100px" width="100px" borderRadius="6px" />
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div className={styles.skeletonDetailsSection}>
          <Skeleton height="2rem" width="80%" />
          <Skeleton height="1.5rem" width="40%" className={styles.skeletonSpacing} />
          <Skeleton height="3rem" width="50%" className={styles.skeletonSpacing} />
          <SkeletonText lines={5} className={styles.skeletonSpacing} />
          <Skeleton height="3rem" width="100%" className={styles.skeletonSpacing} />
          <div className={styles.skeletonInfoBoxes}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="60px" borderRadius="6px" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonCategoryPage() {
  return (
    <div className={styles.skeletonCategoryPage}>
      <Skeleton height="2rem" width="30%" className={styles.skeletonSpacing} />
      <Skeleton height="1rem" width="60%" className={styles.skeletonSpacing} />
      <div className={styles.skeletonCategoryGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

