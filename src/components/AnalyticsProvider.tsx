'use client'

import { useAnalytics } from '@/hooks/useAnalytics'

/**
 * Analytics Provider Component
 * Wraps the layout to enable route-based analytics tracking
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // This hook tracks page views on route changes
  useAnalytics()

  return <>{children}</>
}
