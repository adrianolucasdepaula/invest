/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // FASE 130+: Turbopack is now the default for development (--turbopack flag in package.json)
  // The webpack "Cannot read properties of undefined (reading 'call')" error was fixed by using Turbopack
  // Related issues: https://github.com/vercel/next.js/issues/70703, https://github.com/vercel/next.js/issues/61995
  // Note: Production builds still use webpack (stable), this config only affects production
  webpack: (config, { dev, isServer }) => {
    // Keep optimizations for production builds (webpack is only used in production now)
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'brapi.dev',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3101',
  },
  // FASE 46: CSS Critical Inlining - Eliminar render-blocking
  // Ref: https://www.corewebvitals.io/pagespeed/nextjs-remove-render-blocking-css
  experimental: {
    optimizeCss: true, // Inline critical CSS automaticamente via critters
  },
  // FASE 130+: Turbopack config - Now the default bundler for development
  // Switched from webpack to turbopack to fix RSC module resolution errors
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
  turbopack: {
    root: __dirname,
  },
  // Docker-optimized output mode
  output: 'standalone',
  // FASE 47: Cache-Control Headers - Otimizar TTFB e cache
  // Ref: https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers
  // Ref: https://focusreactive.com/configure-cdn-caching-for-self-hosted-next-js-websites/
  async headers() {
    return [
      {
        // Cache agressivo para assets estáticos (CSS, JS, images)
        // immutable = nunca muda após deploy, cache permanente
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 ano
          },
        ],
      },
      {
        // Cache médio para imagens públicas
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800', // 1 dia, 7 dias SWR
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
