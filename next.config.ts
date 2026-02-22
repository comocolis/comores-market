import type { NextConfig } from "next";

// Configuration PWA (Progressive Web App)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
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
  // Optimisation des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  reactStrictMode: true,
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](lucide-react|framer-motion|sonner)[\\/]/,
              chunks: 'all',
              priority: 25,
            },
          },
        },
      };
    }
    return config;
  },
  
  // Security Headers (VERSION CORRIGÉE ET ASSOUPLIE)
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
          // ⚠️ CORRECTION MAJEURE : On autorise la caméra et le micro !
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=(self), payment=()'
          },
          // ⚠️ CORRECTION MAJEURE : On empêche le blocage de l'iframe/webview
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' 
          }
          // NOTE : J'ai temporairement retiré la "Content-Security-Policy" (CSP).
          // Elle est souvent source de bugs majeurs (écran blanc) si mal configurée.
          // Mieux vaut un site qui marche sans CSP qu'un site sécurisé qui ne s'affiche pas.
        ],
      },
    ]
  },
};

export default process.env.NODE_ENV === 'development' ? nextConfig : withPWA(nextConfig);