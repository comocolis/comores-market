'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

/**
 * Hook to track page views on route changes
 * Use in root layout or a specific component
 */
export function useAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    // Track page view with human-readable title
    const pageTitle = getPageTitle(pathname)
    trackPageView(pathname, pageTitle)
  }, [pathname])
}

/**
 * Convert pathname to human-readable page title
 */
function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return 'Home'
  }

  const titles: Record<string, string> = {
    recherche: 'Search',
    favoris: 'Favorites',
    messages: 'Messages',
    compte: 'Account',
    publier: 'Publish Listing',
    admin: 'Admin Dashboard',
    pro: 'Pro Features',
    faq: 'FAQ',
    cgu: 'Terms & Conditions',
    auth: 'Login',
    profil: 'User Profile',
    'mes-annonces': 'My Listings',
    modifier: 'Edit Listing',
    annonce: 'Product Details',
    boost: 'Boost Listing',
  }

  // Get the first meaningful segment
  const firstSegment = segments[0]
  return titles[firstSegment] || capitalize(firstSegment)
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
