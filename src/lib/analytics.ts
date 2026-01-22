/**
 * Google Analytics 4 (GA4) initialization and configuration
 * Tracks page views, user interactions, and conversions
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Initialize Google Analytics 4
 * Should be called once on app startup
 */
export function initializeGA() {
  if (typeof window === 'undefined') return;

  // Check if gtag is already loaded
  if (window.gtag) {
    return;
  }

  // GA4 configuration
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  
  if (!GA_ID) {
    console.warn('NEXT_PUBLIC_GA_ID not configured. Analytics disabled.');
    return;
  }

  // Log initialization
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Google Analytics 4 initialized (${GA_ID})`);
  }
}

/**
 * Track page view
 * Automatically called on route changes
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track custom event
 * @param eventName - Event name (e.g., 'search', 'add_to_favorites')
 * @param eventData - Event properties
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean | any>
) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, eventData || {});

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📍 Event tracked: ${eventName}`, eventData);
  }
}

/**
 * Track conversion event
 * @param conversionId - Google Ads conversion ID
 * @param conversionLabel - Google Ads conversion label
 * @param conversionValue - Conversion value (for revenue tracking)
 */
export function trackConversion(
  conversionId?: string,
  conversionLabel?: string,
  conversionValue?: number
) {
  if (typeof window === 'undefined' || !window.gtag) return;

  // GA4 conversion
  trackEvent('conversion', {
    conversion_value: conversionValue || 0,
  });

  // Google Ads conversion (if configured)
  if (conversionId && conversionLabel) {
    window.gtag('event', 'conversion', {
      send_to: `${conversionId}/${conversionLabel}`,
      value: conversionValue || 0,
      currency: 'KMF',
    });
  }
}

/**
 * Set user properties
 * @param userId - Unique user identifier
 * @param userType - 'free' | 'pro' | 'admin'
 * @param email - User email (optional)
 */
export function setUserProperties(
  userId: string,
  userType: 'free' | 'pro' | 'admin',
  email?: string
) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
    user_id: userId,
    user_properties: {
      user_type: userType,
      email: email,
    },
  });
}

/**
 * Track search event
 */
export function trackSearch(searchTerm: string, resultCount?: number) {
  trackEvent('search', {
    search_term: searchTerm,
    result_count: resultCount || 0,
  });
}

/**
 * Track product view
 */
export function trackProductView(
  productId: string,
  productTitle: string,
  productPrice: number,
  category: string
) {
  trackEvent('view_item', {
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
 */
export function trackAddToFavorites(
  productId: string,
  productTitle: string,
  productPrice: number
) {
  trackEvent('add_to_wishlist', {
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
 * Track listing creation
 */
export function trackListingCreated(
  listingId: string,
  listingTitle: string,
  category: string,
  price?: number
) {
  trackConversion();
  trackEvent('listing_created', {
    listing_id: listingId,
    listing_title: listingTitle,
    category: category,
    price: price || 0,
  });
}

/**
 * Track ad boost purchase
 */
export function trackBoostPurchase(
  listingId: string,
  boostType: string,
  price: number
) {
  trackConversion();
  trackEvent('boost_purchased', {
    listing_id: listingId,
    boost_type: boostType,
    price: price,
    currency: 'KMF',
  });
}

/**
 * Track pro subscription
 */
export function trackProSubscription(price: number, planDuration: string) {
  trackConversion();
  trackEvent('pro_subscription', {
    price: price,
    plan_duration: planDuration,
    currency: 'KMF',
  });
}

/**
 * Track messaging event
 */
export function trackMessageSent(
  conversationId: string,
  listingId: string,
  messageType: 'text' | 'image'
) {
  trackEvent('message_sent', {
    conversation_id: conversationId,
    listing_id: listingId,
    message_type: messageType,
  });
}

/**
 * Track category view
 */
export function trackCategoryView(categoryName: string, categoryId: number) {
  trackEvent('view_item_list', {
    item_category: categoryName,
    item_category_id: categoryId,
  });
}

/**
 * Track filter application
 */
export function trackFilterApplied(filters: Record<string, string | number>) {
  trackEvent('filter_applied', filters);
}
