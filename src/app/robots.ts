import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/compte/', '/admin/', '/messages/'], // On bloque les pages privées
    },
    sitemap: 'https://comores-market.com/sitemap.xml',
  }
}