import type { Metadata } from 'next'
import Script from 'next/script'
import { Manrope } from 'next/font/google'
import './globals.css'
import { GoogleAnalytics } from '@next/third-parties/google'
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
  const [seoSettings, mainSettings] = await Promise.all([
    getSeoSettings().catch(() => null),
    getSettings().catch(() => null)
  ]);

  // Fallback if API fails
  const siteTitle = seoSettings?.general?.home_title || seoSettings?.site_title || 'PurOstill - Water Distiller';
  const siteDescription = seoSettings?.general?.home_description || seoSettings?.site_description || 'PurOstill Water Distiller - Pure water for you and your family';
  const siteIcon = mainSettings?.favicon || seoSettings?.schema?.logo || '/favicon.ico';

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
    openGraph: seoSettings?.social?.og_enabled ? {
      title: siteTitle,
      description: siteDescription,
      siteName: siteTitle,
      images: seoSettings?.schema?.logo ? [{ url: seoSettings.schema.logo }] : [],
      type: 'website',
    } : undefined,
    twitter: seoSettings?.social?.twitter_enabled ? {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: seoSettings?.schema?.logo ? [seoSettings.schema.logo] : [],
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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K24VDLP');`,
          }}
        />
        {/* End Google Tag Manager */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={manrope.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K24VDLP"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Header
          initialSettings={settings}
          initialPrimaryMenu={primaryMenu}
          initialCategoryMenu={categoryMenu}
        />
        {children}
        <Footer />
        <ToastProvider />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ''} />
        {process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads-tag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}

