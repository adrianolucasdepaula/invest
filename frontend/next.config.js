/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // Next.js 16+ uses Turbopack by default
  // root: Set explicit workspace root to avoid lockfile detection warning
  turbopack: {
    root: __dirname,
  },
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
