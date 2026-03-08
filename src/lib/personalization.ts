const VISITOR_ID_KEY = 'cm_visitor_id'

function buildVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateVisitorId() {
  if (typeof window === 'undefined') return null

  const existingVisitorId = window.localStorage.getItem(VISITOR_ID_KEY)
  if (existingVisitorId) return existingVisitorId

  const nextVisitorId = buildVisitorId()
  window.localStorage.setItem(VISITOR_ID_KEY, nextVisitorId)
  return nextVisitorId
}

async function sendPersonalizationEvent(payload: Record<string, unknown>) {
  try {
    await fetch('/api/personalization/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Unable to persist personalization event', error)
    }
  }
}

export function trackSearchHistory(params: {
  query: string
  categoryId?: number
  island?: string
  resultsCount?: number
  visitorId?: string | null
}) {
  const normalizedQuery = params.query.trim()
  if (normalizedQuery.length < 2) return

  void sendPersonalizationEvent({
    type: 'search',
    visitorId: params.visitorId ?? getOrCreateVisitorId(),
    query: normalizedQuery,
    categoryId: params.categoryId,
    island: params.island,
    resultsCount: params.resultsCount,
  })
}

export function trackProductClickHistory(params: {
  productId: string
  source: string
  visitorId?: string | null
}) {
  if (!params.productId) return

  void sendPersonalizationEvent({
    type: 'product_click',
    visitorId: params.visitorId ?? getOrCreateVisitorId(),
    productId: params.productId,
    source: params.source,
  })
}
