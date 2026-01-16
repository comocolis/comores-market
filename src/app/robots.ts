import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // ⚠️ Assurez-vous que c'est bien votre URL finale
  const baseUrl = 'https://comores-market.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/compte/',       // Espace privé
        '/admin/',        // Espace admin
        '/auth/',         // Pages de connexion
        '/api/',          // API Backend
        '/mes-annonces/', // Gestion des annonces perso
        '/favoris/',      // Favoris perso
        '/modifier/',     // Modification d'annonce
        '/publier/',      // Formulaire de publication
        '/boost/',        // Tunnel de paiement
        '/messages/',     // Messagerie privée
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}