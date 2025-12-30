import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// Utilisation d'un require pour next-pwa car le support ESM peut varier selon les versions
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
  // La minification SWC est activée par défaut, plus besoin de swcMinify: true
  reactStrictMode: true,
  
  // Correction de la fonction webpack ici (dans nextConfig)
  webpack: (config) => {
    // Optimisation pour la vitesse
    config.optimization.treeShake = true;
    return config;
  },
};

// Application de l'enveloppe PWA
const configWithPWA = withPWA(nextConfig);

// Application de l'enveloppe Sentry avec uniquement les propriétés reconnues
export default withSentryConfig(configWithPWA, {
  org: "comoresmarket",
  project: "comoresmarket",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  
  // Sentry n'accepte pas de fonction webpack ici, 
  // il utilise ses propres mécanismes internes pour les source maps.
  automaticVercelMonitors: true,
});