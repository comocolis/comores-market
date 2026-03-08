import { NextResponse } from 'next/server'
import { getRankedHomepageProducts } from '@/lib/homepage-ranking'

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
        limit: Number.parseInt(searchParams.get('limit') || '20', 10),
        offset: Number.parseInt(searchParams.get('offset') || '0', 10),
      },
      searchParams.get('visitorId')
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unable to fetch ranked homepage products', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des produits' }, { status: 500 })
  }
}
