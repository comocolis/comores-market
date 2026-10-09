// Limiteur a fenetre glissante, en memoire (best effort : une instance serveur = un compteur).
// Suffisant pour freiner les abus evidents sur les routes IA ; pour du strict, passer a un store partage.

const buckets = new Map<string, number[]>()
let lastSweep = 0

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return
  lastSweep = now
  for (const [key, stamps] of buckets) {
    const recent = stamps.filter((t) => now - t < windowMs)
    if (recent.length === 0) buckets.delete(key)
    else buckets.set(key, recent)
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'inconnu'
  )
}

/** Retourne true si la cle a depasse `max` appels sur la fenetre `windowMs`. */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  sweep(now, windowMs)

  const stamps = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  if (stamps.length >= max) {
    buckets.set(key, stamps)
    return true
  }

  stamps.push(now)
  buckets.set(key, stamps)
  return false
}
