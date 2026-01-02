import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// Configuration PWA avec correctif pour le build
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // IMPORTANT : Empêche l'erreur de build sur manifest.webmanifest
  buildExcludes: [/manifest\.webmanifest$/], 
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
    // Optimisation de base
    if (config.optimization) {
        config.optimization.treeShake = true;
    }
    return config;
  },
};

// 1. Application de l'enveloppe PWA
const configWithPWA = withPWA(nextConfig);

// 2. Application de l'enveloppe Sentry (Nettoyée des options dépréciées)
export default withSentryConfig(configWithPWA, {
  org: "comoresmarket",
  project: "comoresmarket",
  
  // N'affiche les logs que lors des builds automatiques (CI)
  silent: !process.env.CI,
  
  // Options d'upload de source maps
  widenClientFileUpload: true,
  
  // Route pour contourner les bloqueurs de pub
  tunnelRoute: "/monitoring",
  
  // Note: 'automaticVercelMonitors' a été retiré car déprécié
  disableLogger: true, // Réduit le bruit dans la console
});