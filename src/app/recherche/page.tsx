'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Loader2, ArrowLeft, Crown, Sparkles, X, Clock, SearchX, TrendingUp } from 'lucide-react'
import { getSupabase } from '@/utils/supabase/lazy'
import { getFirstProductImage } from '@/utils/parseImages'
import { trackSearch } from '@/lib/analytics'
import { getOrCreateVisitorId, trackProductClickHistory, trackSearchHistory } from '@/lib/personalization'
import PriceTag from '@/components/PriceTag'
import { EmptyState } from '@/components/EmptyState'
import { UiChip, UiSectionTitle } from '@/components/ui'

interface SearchResult {
  id: string
  title: string
  price: number
  images: string
  location_city: string
  location_island: string
  category_id: number
  sub_category: string
  is_pro: boolean
  boosted_until: string | null
  is_boosted?: boolean
}

const RECENT_KEY = 'cm_recent_searches'
const MAX_RECENT = 6
const POPULAR_SEARCHES = ['iPhone', 'Voiture', 'Terrain', 'Appartement', 'Moto', 'Ordinateur', 'Climatiseur', 'Vanille']

// Historique local branche sur useSyncExternalStore : lecture sans setState dans un effet, sans decalage d'hydratation.
const recentListeners = new Set<() => void>()

function subscribeRecent(callback: () => void) {
  recentListeners.add(callback)
  window.addEventListener('storage', callback)
  return () => {
    recentListeners.delete(callback)
    window.removeEventListener('storage', callback)
  }
}

const getRecentSnapshot = () => {
  try {
    return localStorage.getItem(RECENT_KEY) || ''
  } catch {
    return ''
  }
}

const getRecentServerSnapshot = () => ''

function parseRecent(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function writeRecent(items: string[]) {
  try {
    if (items.length === 0) localStorage.removeItem(RECENT_KEY)
    else localStorage.setItem(RECENT_KEY, JSON.stringify(items))
  } catch {
    // stockage indisponible : l'historique local est simplement ignore
  }
  recentListeners.forEach((listener) => listener())
}
export default function RecherchePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  // Resultats associes au terme pour lequel ils ont ete obtenus : permet de deriver `loading`
  // et d'ecarter naturellement les reponses obsoletes.
  const [data, setData] = useState<{ term: string; items: SearchResult[] } | null>(null)

  const recentRaw = useSyncExternalStore(subscribeRecent, getRecentSnapshot, getRecentServerSnapshot)
  const recent = useMemo(() => parseRecent(recentRaw), [recentRaw])

  const term = query.trim()
  const showIdle = term.length < 2
  const settled = !showIdle && data?.term === term
  const loading = !showIdle && !settled
  const results = settled && data ? data.items : []
  const searched = settled

  const clearRecent = () => writeRecent([])

  // Recherche automatique avec delai (debounce).
  useEffect(() => {
    if (term.length < 2) return

    let cancelled = false
    const timer = setTimeout(async () => {
      const supabase = await getSupabase()
      const { data: rows } = await supabase
        .from('products_with_details')
        .select('id, title, price, images, location_city, location_island, category_id, sub_category, is_pro, boosted_until')
        .ilike('title', `%${term}%`)
        .order('is_pro', { ascending: false })
        .limit(20)

      if (cancelled) return

      // Calcule ici (et non au rendu) : Date.now() n'est pas pur.
      const now = Date.now()
      const items = ((rows as SearchResult[]) || []).map((item) => ({
        ...item,
        is_boosted: item.boosted_until ? new Date(item.boosted_until).getTime() > now : false,
      }))
      setData({ term, items })

      if (items.length > 0) {
        writeRecent([term, ...parseRecent(getRecentSnapshot()).filter((entry) => entry.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT))
      }
      const visitorId = getOrCreateVisitorId()
      trackSearch(term, items.length)
      trackSearchHistory({ query: term, resultsCount: items.length, visitorId })
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term])
  return (
    <div className="min-h-screen bg-transparent pb-24 font-sans">
      {/* En-tete */}
      <div className="sticky top-0 z-40 flex flex-col gap-3 bg-white p-4 pt-safe shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            aria-label="Retour"
            className="-ml-2 rounded-full p-2 text-gray-600 transition hover:bg-gray-100 active:scale-90"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-black tracking-tight text-gray-900">Recherche</h1>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} aria-hidden="true" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Rechercher une annonce"
            placeholder="Que cherchez-vous ?"
            className="w-full rounded-2xl border border-transparent bg-gray-100 py-3.5 pl-12 pr-11 text-base font-medium text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 transition hover:bg-gray-200 active:scale-90"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 p-4">
        {/* Etat initial : raccourcis plutot qu'une page vide */}
        {showIdle && (
          <>
            {recent.length > 0 && (
              <section>
                <UiSectionTitle
                  tone="neutral"
                  eyebrow="Historique"
                  title="Recherches récentes"
                  action={
                    <button onClick={clearRecent} className="text-xs font-bold text-gray-500 underline-offset-2 hover:underline">
                      Effacer
                    </button>
                  }
                />
                <div className="flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <UiChip key={term} tone="neutral" onClick={() => setQuery(term)}>
                      <Clock size={12} aria-hidden="true" /> {term}
                    </UiChip>
                  ))}
                </div>
              </section>
            )}

            <section>
              <UiSectionTitle tone="mustard" eyebrow="Tendances" title="Recherches populaires" />
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <UiChip key={term} onClick={() => setQuery(term)}>
                    <TrendingUp size={12} aria-hidden="true" /> {term}
                  </UiChip>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Resultats */}
        {!showIdle && loading && (
          <div className="flex justify-center pt-10" role="status" aria-label="Recherche en cours">
            <Loader2 className="animate-spin text-brand" />
          </div>
        )}

        {!showIdle && !loading && results.length > 0 && (
          <div className="space-y-3">
            <p className="px-1 text-xs font-bold uppercase tracking-wide text-gray-500" aria-live="polite">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </p>
            {results.map((product) => {
              const img = getFirstProductImage(product.images)
              const isPro = product.is_pro
              const isBoosted = Boolean(product.is_boosted)
              const place = [product.location_city, product.location_island].filter(Boolean).join(', ')

              return (
                <Link
                  key={product.id}
                  href={`/annonce/${product.id}`}
                  onClick={() => trackProductClickHistory({ productId: product.id, source: 'search_results', visitorId: getOrCreateVisitorId() })}
                  className="flex gap-3 rounded-card border border-gray-100 bg-white p-3 shadow-card transition active:scale-[0.99] hover:shadow-pop"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                    {img && <Image src={img} alt="" fill sizes="96px" className="object-cover" />}
                    {isPro && (
                      <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-black/80 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
                        <Crown size={8} className="fill-amber-400 text-amber-400" /> PRO
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <h2 className="line-clamp-2 font-display text-sm font-bold leading-snug text-gray-900">{product.title}</h2>
                    <PriceTag price={product.price} className="text-base font-black tracking-tight text-brand-700" />
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      <MapPin size={11} className="shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="truncate">{place}</span>
                      {isBoosted && (
                        <span className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700">
                          <Sparkles size={9} /> VEDETTE
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!showIdle && !loading && searched && results.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="Aucun résultat"
            description={`Nous n'avons rien trouvé pour « ${query.trim()} ». Essayez un mot plus court ou une autre orthographe.`}
            action={{ label: 'Voir toutes les annonces', href: '/' }}
          />
        )}
      </div>
    </div>
  )
}
