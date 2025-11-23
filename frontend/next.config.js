/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'brapi.dev'],
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
}

module.exports = nextConfig
