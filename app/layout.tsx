import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ToastProvider from '@/components/ToastProvider'
import { getSettings } from '@/lib/settings'
import { getMenu, buildMenuTree } from '@/lib/menu'

const manrope = Manrope({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  fallback: ['system-ui', 'arial'],
})

import { getSeoSettings } from '@/lib/public-api'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings().catch(() => null);

  // Fallback if API fails
  const siteTitle = settings?.general?.home_title || settings?.site_title || 'PurOstill - Water Distiller';
  const siteDescription = settings?.general?.home_description || settings?.site_description || 'PurOstill Water Distiller - Pure water for you and your family';
  const siteIcon = settings?.schema?.logo || '/favicon.ico';

  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description: siteDescription,
    icons: {
      icon: siteIcon,
      apple: siteIcon,
    },
    openGraph: settings?.social?.og_enabled ? {
      title: siteTitle,
      description: siteDescription,
      siteName: siteTitle,
      images: settings?.schema?.logo ? [{ url: settings.schema.logo }] : [],
      type: 'website',
    } : undefined,
    twitter: settings?.social?.twitter_enabled ? {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: settings?.schema?.logo ? [settings.schema.logo] : [],
    } : undefined,
    other: {
      'application-name': 'PurOstill',
    }
  };
}

async function getInitialData() {
  try {
    const [settings, primaryMenu, categoryMenu] = await Promise.all([
      getSettings().catch(() => ({ logo: null, site_title: 'PurOstill' })),
      getMenu(5).catch(() => ({ items: [] })),
      getMenu(108).catch(() => ({ items: [] })),
    ]);

    return {
      settings,
      primaryMenu: buildMenuTree(primaryMenu.items || []),
      categoryMenu: buildMenuTree(categoryMenu.items || []),
    };
  } catch (error) {
    console.error('Error fetching initial SSR data:', error);
    return {
      settings: { logo: null, site_title: 'PurOstill' },
      primaryMenu: [],
      categoryMenu: [],
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { settings, primaryMenu, categoryMenu } = await getInitialData();

  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={manrope.className}>
        <Header
          initialSettings={settings}
          initialPrimaryMenu={primaryMenu}
          initialCategoryMenu={categoryMenu}
        />
        {children}
        <Footer />
        <ToastProvider />
      </body>
    </html>
  )
}

