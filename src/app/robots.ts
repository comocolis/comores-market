import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.comores-market.com'

  return {
    rules: [
      // 🛡️ BLOCAGE DU PILLAGE PAR LES IA (Anti-Scraping & Entraînement)
      {
        userAgent: [
          'GPTBot',            // OpenAI (ChatGPT)
          'ClaudeBot',         // Anthropic (Claude)
          'Google-Extended',   // Google (Utilisé pour nourrir Gemini)
          'Applebot-Extended', // Apple AI
          'CCBot',             // Common Crawl (Aspirateur massif de données pour IA)
          'PerplexityBot',     // Perplexity AI
          'cohere-ai',         // Cohere AI
          'Omgilibot',         // Omgili (Aspirateur de forums/marketplaces pour IA)
        ],
        disallow: '/',         // Interdiction absolue d'accéder au contenu
      },
      // 🔍 CONFIGURATION POUR LES MOTEURS DE RECHERCHE CLASSIQUES (Google, Bing...)
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/compte',        // Espace privé
          '/admin',         // Espace admin
          '/auth',          // Pages de connexion
          '/api',           // API Backend
          '/mes-annonces',  // Gestion des annonces perso
          '/favoris',       // Favoris perso
          '/modifier',      // Modification d'annonce
          '/publier',       // Formulaire de publication
          '/boost',         // Tunnel de paiement
          '/messages',      // Messagerie privée
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}