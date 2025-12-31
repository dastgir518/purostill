import Link from 'next/link';
import styles from './Footer.module.css';
import { getMenu, buildMenuTree } from '@/lib/menu';
import { decodeHtmlEntities } from '@/lib/utils';

const shopLinks = [
  { label: 'Shop by Category', href: '/product-category' },
  { label: 'Deals', href: '/product-category/sale' },
  { label: 'About Us', href: '/about' },
  { label: 'Support', href: '/contact' },
];

const policyLinks = [
  { label: 'Shipping Policy', href: '/shipping-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

function normalizeMenuUrl(url?: string) {
  if (!url) return '#';
  if (url.startsWith('/')) return url;
  
  try {
    const parsed = new URL(url);
    // Extract path from any absolute URL (backend or external)
    // This ensures menu links work on the current website
    const path = parsed.pathname || '/';
    const query = parsed.search || '';
    const hash = parsed.hash || '';
    return `${path}${query}${hash}` || '/';
  } catch {
    // If URL parsing fails, try to extract path manually
    const pathMatch = url.match(/^https?:\/\/[^/]+(\/.*)$/);
    if (pathMatch) {
      return pathMatch[1] || '/';
    }
    // If it's not a valid URL, return as-is (might be a relative path or fragment)
    return url;
  }
}

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Fetch menu 108 for Categories
  let categoryLinks: Array<{ label: string; href: string }> = [];
  try {
    const menu = await getMenu(108);
    const menuTree = buildMenuTree(menu.items || []);
    
    // Get top-level menu items for footer
    categoryLinks = menuTree.map((item) => ({
      label: decodeHtmlEntities(item.title || ''),
      href: normalizeMenuUrl(item.url),
    }));
  } catch (error) {
    console.error('Failed to fetch category menu:', error);
    // Keep empty array if menu fetch fails
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.logo}>
              PurOstill
            </Link>
            <p>
              Premium water distillation systems designed in Britain for clinics, hospitality brands,
              and homes that put water first.
            </p>
            <div className={styles.badges}>
              <span>ISO 9001</span>
              <span>NSF Certified</span>
            </div>
          </div>

          <div className={styles.linkColumn}>
            <h4>Shop</h4>
            <ul>
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkColumn}>
            <h4>Categories</h4>
            <ul>
              {categoryLinks.length > 0 ? (
                categoryLinks.map((link, index) => (
                  <li key={`${link.label}-${index}`}>
                    {link.href.startsWith('http') ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))
              ) : (
                <li>No categories available</li>
              )}
            </ul>
          </div>

          <div className={styles.linkColumn}>
            <h4>Policies</h4>
            <ul>
              {policyLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('http') ? (
                    <a href={link.href} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className={styles.bottomRow}>
          <p>© {currentYear} PurOstill. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

