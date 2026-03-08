import { Metadata } from 'next'
import AnnonceClient from './AnnonceClient'
import { Suspense } from 'react'

type AnnoncePageProps = {
  searchParams: Promise<{ id?: string }>
}

const BASE_URL = 'https://www.comores-market.com'

export async function generateMetadata({ searchParams }: AnnoncePageProps): Promise<Metadata> {
  const params = await searchParams
  const id = params?.id?.trim()
  const hasValidId = Boolean(id)

  return {
    title: 'Annonce | Comores Market',
    description: "Détails de l'annonce sur Comores Market",
    alternates: {
      canonical: hasValidId
        ? `${BASE_URL}/annonce?id=${encodeURIComponent(id as string)}`
        : `${BASE_URL}/recherche`,
    },
    robots: {
      index: hasValidId,
      follow: true,
      googleBot: {
        index: hasValidId,
        follow: true,
      },
    },
  }
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div></div>}>
      <AnnonceClient />
    </Suspense>
  )
}
