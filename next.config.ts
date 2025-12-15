import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vous pouvez laisser vide pour l'instant
  // ou ajouter uniquement les options nécessaires (images, etc.)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Autorise toutes les images externes (pratique pour le dév)
      },
    ],
  },
};

export default nextConfig;