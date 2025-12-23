import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/compte/', '/admin/', '/messages/', '/favoris/'], // On protège la vie privée
    },
    sitemap: 'https://comores-market.com/sitemap.xml', // Changez le domaine si nécessaire
  }
}