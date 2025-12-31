'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import Cart from './Cart';
import { getCurrentUser, logout } from '@/lib/auth';
import type { MenuItemWithChildren } from '@/types/menu';
import { decodeHtmlEntities } from '@/lib/utils';

const navigationLinks = [
  { label: 'Shop by Category', href: '/product-category' },
  { label: 'Deals', href: '/product-category/sale' },
  { label: 'About Us', href: '/about' },
  { label: 'Support', href: '/contact' },
];

interface HeaderProps {
  initialSettings: { logo: string | null; site_title: string };
  initialPrimaryMenu: MenuItemWithChildren[];
  initialCategoryMenu: MenuItemWithChildren[];
}

export default function Header({
  initialSettings,
  initialPrimaryMenu,
  initialCategoryMenu
}: HeaderProps) {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialSettings.logo);
  const [siteTitle, setSiteTitle] = useState<string>(initialSettings.site_title || 'PurOstill');
  const [menuItems, setMenuItems] = useState<MenuItemWithChildren[]>(initialPrimaryMenu);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(buildInitialExpansion(initialPrimaryMenu));
  const [categoryMenuItems, setCategoryMenuItems] = useState<MenuItemWithChildren[]>(initialCategoryMenu);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);

  useEffect(() => {
    updateCartCount();
    updateUser();

    const handleCartUpdate = () => updateCartCount();
    const handleAuthUpdate = () => updateUser();
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('authUpdated', handleAuthUpdate);
    window.addEventListener('openCart', handleOpenCart);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('authUpdated', handleAuthUpdate);
      window.removeEventListener('openCart', handleOpenCart);
    };
  }, []);

  const updateCartCount = () => {
    if (typeof window === 'undefined') return;
    const savedCart = localStorage.getItem('cart');
    if (!savedCart) {
      setCartCount(0);
      return;
    }
    try {
      const cartItems = JSON.parse(savedCart);
      const count = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  const updateUser = () => {
    if (typeof window === 'undefined') return;
    const currentUser = getCurrentUser();
    setUser(currentUser);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const brandTitle = siteTitle;
  const closeHamburger = () => setIsHamburgerOpen(false);
  const toggleHamburger = () => setIsHamburgerOpen((prev) => !prev);
  const toggleMenuItem = (id: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const renderMenuItems = (items: MenuItemWithChildren[], level = 0) => {
    if (!items || items.length === 0) return null;
    return (
      <ul className={`${styles.menuList} ${level > 0 ? styles.subMenuList : ''}`}>
        {items.map((item) => {
          const hasChildren = !!(item.children && item.children.length);
          const isExpanded = expandedItems[item.id];
          return (
            <li key={item.id} className={styles.menuListItem}>
              <div className={styles.menuItemRow}>
                {hasChildren ? (
                  <button
                    className={`${styles.caretButton} ${isExpanded ? styles.caretOpen : ''}`}
                    onClick={() => toggleMenuItem(item.id)}
                    aria-label={`Toggle ${item.title} submenu`}
                    aria-expanded={isExpanded}
                  >
                    <CaretIcon isOpen={isExpanded} />
                  </button>
                ) : (
                  <span className={styles.caretPlaceholder} aria-hidden />
                )}
                <MenuLink
                  item={item}
                  className={styles.menuLink}
                  onNavigate={() => {
                    if (!hasChildren) {
                      closeHamburger();
                    }
                  }}
                />
              </div>
              {hasChildren && isExpanded && renderMenuItems(item.children || [], level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <header className={styles.headerShell}>
        <div className={styles.headerInner}>
          <div className={styles.headerBar}>
            <Link href="/" className={styles.brand}>
              {logoUrl ? (
                <span className={styles.logoImageWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt={brandTitle} className={styles.logoImage} />
                </span>
              ) : (
                <span className={styles.logoIcon} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" role="img">
                    <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
                    <path
                      d="M8.5 12l3.5 3.5L15.5 12"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.5 8.5 12 12l3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.6"
                    />
                  </svg>
                </span>
              )}
            </Link>

            <nav className={styles.navLinks} aria-label="Primary navigation">
              {navigationLinks.map((link) => {
                if (link.label === 'Shop by Category') {
                  return (
                    <div
                      key={link.label}
                      className={styles.dropdownContainer}
                      onMouseEnter={() => setIsCategoryHovered(true)}
                      onMouseLeave={() => setIsCategoryHovered(false)}
                    >
                      <Link href={link.href} className={styles.navLink}>
                        {link.label}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          style={{ marginLeft: '0.25rem', display: 'inline-block' }}
                        >
                          <path
                            d="M3 4.5L6 7.5L9 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                      {isCategoryHovered && categoryMenuItems.length > 0 && (
                        <div className={styles.dropdownMenu}>
                          {categoryMenuItems.map((item) => (
                            <CategoryMenuLink key={item.id} item={item} onNavigate={() => setIsCategoryHovered(false)} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link key={link.label} href={link.href} className={styles.navLink}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className={styles.actions}>
              <button
                className={`${styles.iconButton} ${styles.cartButton}`}
                onClick={() => setIsCartOpen(true)}
                aria-label="Open cart"
              >
                <CartIcon />
                {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
              </button>
              <button
                className={`${styles.iconButton} ${styles.hamburgerButton}`}
                onClick={toggleHamburger}
                aria-label="Open navigation menu"
                aria-haspopup="true"
                aria-expanded={isHamburgerOpen}
              >
                <HamburgerIcon isActive={isHamburgerOpen} />
              </button>
            </div>
          </div>
        </div>

        <aside className={`${styles.menuDrawer} ${isHamburgerOpen ? styles.open : ''}`} aria-hidden={!isHamburgerOpen}>
          <div className={styles.menuDrawerHeader}>
            <div>
              <p className={styles.menuDrawerTitle}>Browse categories</p>
              <p className={styles.menuDrawerSubtitle}>Find your perfect hydration match</p>
            </div>
            <button className={styles.closeButton} onClick={closeHamburger} aria-label="Close menu panel">
              <CloseIcon />
            </button>
          </div>
          <div className={styles.menuDrawerContent}>
            {menuLoading && <p className={styles.menuStatus}>Loading menu…</p>}
            {!menuLoading && menuError && <p className={styles.menuStatus}>{menuError}</p>}
            {!menuLoading && !menuError && renderMenuItems(menuItems)}
          </div>
        </aside>
      </header>
      <div className={styles.headerPlaceholder} aria-hidden="true" />

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 20v-0.5C6 16.91 8.91 14 12.5 14s6.5 2.91 6.5 6.5V20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <circle cx="9" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8H19a1 1 0 0 0 1-.8L21 8H7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HamburgerIcon({ isActive }: { isActive: boolean }) {
  return (
    <span className={`${styles.hamburgerIcon} ${isActive ? styles.hamburgerIconActive : ''}`} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M17 7L7 17M7 7l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CaretIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span className={`${styles.caretIcon} ${isOpen ? styles.caretIconOpen : ''}`}>
      <svg viewBox="0 0 20 20" fill="none" aria-hidden focusable="false">
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function MenuLink({
  item,
  className,
  onNavigate,
}: {
  item: MenuItemWithChildren;
  className?: string;
  onNavigate?: () => void;
}) {
  const href = normalizeMenuUrl(item.url);
  const isRelative = href.startsWith('/');
  const label = decodeHtmlEntities(item.title);

  if (!item.url) {
    return (
      <span className={`${className ?? ''} ${styles.menuLinkLabel}`} aria-disabled="true">
        {label}
      </span>
    );
  }

  if (isRelative) {
    return (
      <Link href={href} className={className} onClick={onNavigate} target={item.target}>
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      target={item.target || '_blank'}
      rel="noopener noreferrer"
      onClick={onNavigate}
    >
      {label}
    </a>
  );
}

function CategoryMenuLink({
  item,
  onNavigate,
}: {
  item: MenuItemWithChildren;
  onNavigate?: () => void;
}) {
  const href = normalizeMenuUrl(item.url);
  const isRelative = href.startsWith('/');
  const label = decodeHtmlEntities(item.title);

  if (!item.url) {
    return (
      <span className={styles.dropdownMenuItem} aria-disabled="true">
        {label}
      </span>
    );
  }

  if (isRelative) {
    return (
      <Link href={href} className={styles.dropdownMenuItem} onClick={onNavigate} target={item.target}>
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={styles.dropdownMenuItem}
      target={item.target || '_blank'}
      rel="noopener noreferrer"
      onClick={onNavigate}
    >
      {label}
    </a>
  );
}

function buildInitialExpansion(items: MenuItemWithChildren[]) {
  const map: Record<number, boolean> = {};
  const traverse = (nodes: MenuItemWithChildren[], level: number) => {
    nodes.forEach((node) => {
      map[node.id] = false;
      if (node.children && node.children.length > 0) {
        traverse(node.children, level + 1);
      }
    });
  };
  traverse(items, 0);
  return map;
}


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


