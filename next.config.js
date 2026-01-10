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
}

console.log('[NextConfig] Build Env:', {
  WOOCOMMERCE_URL: process.env.WOOCOMMERCE_URL,
  NEXT_PUBLIC_WOOCOMMERCE_URL: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
});

module.exports = nextConfig

