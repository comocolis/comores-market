import { NextResponse } from 'next/server'
import { getRankedHomepageProducts } from '@/lib/homepage-ranking'

const MAX_LIMIT = 40
const MAX_OFFSET = 400

// Borne les parametres de pagination : evite des requetes SQL surdimensionnees (NaN, valeurs enormes).
function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isNaN(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const result = await getRankedHomepageProducts(
      {
        searchTerm: searchParams.get('searchTerm') || undefined,
        selectedCategory: Number.parseInt(searchParams.get('selectedCategory') || '0', 10),
        selectedSubCategory: searchParams.get('selectedSubCategory') || 'Tout',
        selectedIsland: searchParams.get('selectedIsland') || 'Tout',
        priceMin: searchParams.get('priceMin') || undefined,
        priceMax: searchParams.get('priceMax') || undefined,
        limit: clampInt(searchParams.get('limit'), 20, 1, MAX_LIMIT),
        offset: clampInt(searchParams.get('offset'), 0, 0, MAX_OFFSET),
      },
      searchParams.get('visitorId')
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unable to fetch ranked homepage products', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des produits' }, { status: 500 })
  }
}
