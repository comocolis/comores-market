import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// Importation de la stratégie de cache par défaut de next-pwa
const defaultRuntimeCaching = require("next-pwa/cache");

// Configuration PWA
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: true,
  buildExcludes: [/middleware-manifest\.json$/, /manifest\.json$/, /manifest\.webmanifest$/, /app\.webmanifest$/], 
  
  runtimeCaching: [
    {
      // CORRECTION ICI : On ajoute le type explicite ': { url: URL }'
      urlPattern: ({ url }: { url: URL }) => {
        return (
          url.pathname === '/' || 
          url.pathname.includes('manifest') || 
          url.pathname.endsWith('.webmanifest')
        );
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'start-url-manifest-cache',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-images-cache',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    ...defaultRuntimeCaching,
  ],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  reactStrictMode: true,
  
  webpack: (config) => {
    if (config.optimization) {
        config.optimization.treeShake = true;
    }
    return config;
  },
};

const configWithPWA = withPWA(nextConfig);

export default withSentryConfig(configWithPWA, {
  org: "comoresmarket",
  project: "comoresmarket",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
});