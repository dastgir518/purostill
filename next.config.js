const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    // Single source of truth is .env (.env.local in development)
    WOOCOMMERCE_URL: process.env.WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
  },
  async rewrites() {
    return [
      {
        source: '/wp-content/:path*',
        destination: `${process.env.WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-content/:path*`,
      },
      {
        source: '/sitemap.xml',
        destination: '/sitemap.xml'
      }
    ]
  },
}

console.log('[NextConfig] Build Env:', {
  WOOCOMMERCE_URL: process.env.WOOCOMMERCE_URL,
  NEXT_PUBLIC_WOOCOMMERCE_URL: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
});

module.exports = nextConfig

