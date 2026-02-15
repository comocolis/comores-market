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

// Détection du mode développement
const isDev = process.env.NODE_ENV === 'development';

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
  
  // Security Headers (VERSION ORIGINALE STRICTE)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://eprocure.gov.km",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://ipapi.co https://www.google.com",
              "frame-src 'self' https://www.googletagmanager.com https://www.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              isDev ? "" : "upgrade-insecure-requests" 
            ].filter(Boolean).join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
    ]
  },
};

export default process.env.NODE_ENV === 'development' ? nextConfig : withPWA(nextConfig);