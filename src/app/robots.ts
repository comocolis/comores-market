import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/compte/',       // Bloque tout l'espace mon compte
        '/admin/',        // Bloque l'admin
        '/auth/',         // Bloque les pages de connexion/callback
        '/api/',          // Bloque les API
        '/mes-annonces/', // Bloque les annonces perso
        '/favoris/',      // Bloque les favoris
        '/modifier/',     // Bloque l'édition
        '/publier/',      // Bloque la publication
        '/boost/',        // Bloque le boost
      ],
    },
    sitemap: 'https://comores-market.com/sitemap.xml',
  }
}