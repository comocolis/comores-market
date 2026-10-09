import type { NextConfig } from "next";

// Configuration PWA (Progressive Web App)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  
  // ✅ CORRECTION : Ajout du fallback pour l'écran hors connexion
  fallbacks: {
    document: '/offline',
  },

  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-images-cache',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // Optimisation SEO : Uniformisation des URLs
  trailingSlash: false,
  
  // Optimisation des images
  images: {
    // Hotes autorises uniquement (evite un proxy d'images ouvert) : Storage Supabase + avatars Google.
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'www.comores-market.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  reactStrictMode: true,
  // Active uniquement pour l'analyse du bundle : ANALYZE=1 npm run build
  productionBrowserSourceMaps: process.env.ANALYZE === '1',
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Pas de splitChunks personnalise : le decoupage par route de Next evite de charger
  // un "vendor" monolithique (jspdf, html2canvas, dnd-kit...) sur toutes les pages.

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=(self), payment=()'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' 
          }
        ],
      },
    ]
  },
};

export default process.env.NODE_ENV === 'development' ? nextConfig : withPWA(nextConfig);