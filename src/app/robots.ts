import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/compte/',       // Privé
        '/admin/',        // Privé
        '/messages/',     // Privé
        '/favoris/',      // Privé
        '/publier/',      // Privé (C'est souvent ici que Google bloque)
        '/mes-annonces/', // Privé
        '/modifier/',     // Privé
        '/api/',          // Technique
        '/auth/',         // Connexion
      ],
    },
    sitemap: 'https://comores-market.com/sitemap.xml',
  }
}