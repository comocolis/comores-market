import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Comores Market',
    short_name: 'ComoresMarket',
    description: 'Achat et vente facile aux Comores',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#22c55e',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}