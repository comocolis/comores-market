/**
 * Google Analytics 4 (GA4) & Google Ads Event Helpers
 * Used to track specific user interactions (clicks, purchases, searches)
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Generic helper to send events to GA4
 * Safe to use anywhere (client-side)
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean | any>
) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, eventData || {});

  // Log en mode développement pour vérifier que ça marche
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 GA4 Event: ${eventName}`, eventData);
  }
}

/**
 * Helper spécifique pour les conversions Google Ads
 * À utiliser quand une action critique (achat, lead) se produit
 * @param conversionLabel Le code de conversion fourni par Google Ads (ex: "AbC_123456")
 */
export function trackAdsConversion(conversionLabel: string, value?: number) {
  if (typeof window === 'undefined' || !window.gtag) return;

  // L'ID doit correspondre à celui dans layout.tsx
  const ADS_ID = 'AW-16447515729'; 

  window.gtag('event', 'conversion', {
      send_to: `${ADS_ID}/${conversionLabel}`,
      value: value || 0,
      currency: 'KMF',
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`💰 Google Ads Conversion: ${conversionLabel} - ${value} KMF`);
  }
}

/**
 * Configure Enhanced Conversions data (email, phone, address).
 * Call this BEFORE trackAdsConversion.
 * Google will automatically normalize and hash this data.
 */
export function setEnhancedConversionData(userData: {
  email?: string;
  phone_number?: string; 
  address?: {
    first_name?: string;
    last_name?: string;
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  }
}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('set', 'user_data', userData);

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔒 Enhanced Conversion Data Set`, userData);
  }
}

// --- ÉVÉNEMENTS E-COMMERCE & BUSINESS ---

/**
 * Track search event
 * Utile pour savoir ce que les gens cherchent sur Comores Market
 */
export function trackSearch(searchTerm: string, resultCount?: number) {
  trackEvent('search', {
    search_term: searchTerm,
    result_count: resultCount || 0,
  });
}

/**
 * Track category view (Correction de l'erreur)
 * Utilisé sur la page d'accueil quand on change de catégorie
 */
export function trackCategoryView(categoryName: string, categoryId: number) {
  trackEvent('view_item_list', {
    item_category: categoryName,
    item_category_id: categoryId,
  });
}

/**
 * Track product view
 * Quand on ouvre une annonce spécifique
 */
export function trackProductView(
  productId: string,
  productTitle: string,
  productPrice: number,
  category: string
) {
  trackEvent('view_item', {
    currency: 'KMF',
    value: productPrice,
    items: [
      {
        item_id: productId,
        item_name: productTitle,
        price: productPrice,
        item_category: category,
      },
    ],
  });
}

/**
 * Track add to favorites
 * Quand on clique sur le coeur
 */
export function trackAddToFavorites(
  productId: string,
  productTitle: string,
  productPrice: number
) {
  trackEvent('add_to_wishlist', {
    currency: 'KMF',
    value: productPrice,
    items: [
      {
        item_id: productId,
        item_name: productTitle,
        price: productPrice,
      },
    ],
  });
}

/**
 * Track listing creation (Succès publication)
 */
export function trackListingCreated(
  listingId: string,
  listingTitle: string,
  category: string,
  price?: number
) {
  trackEvent('listing_created', {
    listing_id: listingId,
    listing_title: listingTitle,
    category: category,
    price: price || 0,
  });
}

/**
 * Track ad boost purchase (MONÉTISATION 💰)
 * Très important pour suivre vos revenus
 */
export function trackBoostPurchase(
  listingId: string,
  boostType: string,
  price: number
) {
  // Événement standard GA4 pour achat
  trackEvent('purchase', {
    transaction_id: `BOOST-${listingId}-${Date.now()}`,
    value: price,
    currency: 'KMF',
    items: [{
        item_id: `BOOST-${boostType}`,
        item_name: `Boost ${boostType}`,
        price: price
    }]
  });
}

/**
 * Track pro subscription (ABONNEMENT PRO 💰)
 */
export function trackProSubscription(price: number, planDuration: string) {
  trackEvent('purchase', {
    transaction_id: `SUB-${planDuration}-${Date.now()}`,
    value: price,
    currency: 'KMF',
    items: [{
        item_id: `PRO-${planDuration}`,
        item_name: `Abonnement Pro ${planDuration}`,
        price: price
    }]
  });
}

/**
 * Track contact/message (Lead)
 * Quand un acheteur contacte un vendeur
 */
export function trackMessageSent(
  conversationId: string,
  listingId: string,
  messageType: 'text' | 'image'
) {
  trackEvent('generate_lead', {
    conversation_id: conversationId,
    listing_id: listingId,
    message_type: messageType,
  });
}

/**
 * Track filter application
 * Pour savoir quels filtres sont les plus utilisés
 */
export function trackFilterApplied(filters: Record<string, string | number>) {
  trackEvent('filter_applied', filters);
}

/**
 * Identification de l'utilisateur (Optionnel)
 * Permet de segmenter Pro vs Gratuit dans GA4
 */
export function setUserProperties(
  userId: string,
  userType: 'free' | 'pro' | 'admin'
) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('set', 'user_properties', {
    user_type: userType,
    user_id: userId 
  });
}