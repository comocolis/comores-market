import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createStaticClient } from '@/utils/supabase/static'
import AnnonceClient from '../AnnonceClient'

const SITE_URL = 'https://www.comores-market.com'
const DESCRIPTION_SEPARATOR = '--- ✨ CARACTÉRISTIQUES ---'
const ID_PATTERN = /^[0-9a-fA-F-]{36}$/

interface PageProps {
  params: Promise<{ id: string }>
}

// Requete unique par rendu, partagee entre generateMetadata et la page (dedoublonnee par cache()).
// Retourne `null` si l'annonce n'existe pas, `undefined` si la lecture a echoue (erreur reseau/Supabase).
const getProduct = cache(async (id: string) => {
  if (!ID_PATTERN.test(id)) return null

  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, title, price, description, images, location_island, location_city, created_at, user_id, whatsapp_number, sub_category,
      profiles(full_name, avatar_url, is_pro, subscription_end_date, phone_number)
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Erreur lors du chargement de l\'annonce :', error)
    return undefined
  }
  return data
})

function getFirstImage(rawImages: unknown): string | null {
  if (!rawImages || typeof rawImages !== 'string') return null
  try {
    const imgs = JSON.parse(rawImages)
    if (Array.isArray(imgs) && typeof imgs[0] === 'string') return imgs[0]
  } catch {
    if (rawImages.startsWith('http')) return rawImages
  }
  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  if (product === undefined) {
    return { title: 'Annonce' }
  }

  if (!product) {
    return {
      title: 'Annonce introuvable',
      description: 'L\'annonce demandée n\'existe pas ou a été supprimée.',
      robots: { index: false, follow: false },
    }
  }

  const mainDescription = product.description?.split(DESCRIPTION_SEPARATOR)[0]?.trim() || ''
  const priceInEuro = Math.round(product.price / 500)
  const formattedPrice = new Intl.NumberFormat('fr-KM').format(product.price)
  const formattedEuro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(priceInEuro)
  const pageTitle = `${product.title} - ${formattedPrice} KMF (${formattedEuro})`
  const description = mainDescription.slice(0, 150) || `Découvrez l'annonce ${product.title} sur Comores Market.`
  const imageUrl = getFirstImage(product.images) || `${SITE_URL}/og-image.png`

  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/annonce/${id}` },
    openGraph: {
      title: pageTitle,
      description,
      url: `${SITE_URL}/annonce/${id}`,
      siteName: 'Comores Market',
      locale: 'fr_KM',
      type: 'article',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: product.title }],
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)

  // Annonce absente ou identifiant invalide : vrai statut HTTP 404 (utile au referencement).
  if (product === null) notFound()

  // Donnees structurees schema.org pour les resultats enrichis Google.
  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description?.split(DESCRIPTION_SEPARATOR)[0]?.trim().slice(0, 300) || undefined,
        image: getFirstImage(product.images) || undefined,
        url: `${SITE_URL}/annonce/${id}`,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'KMF',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/annonce/${id}`,
        },
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // Le contenu est du JSON serialise ; "<" est echappe pour empecher toute fermeture de balise.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <AnnonceClient productId={id} initialProduct={product ?? null} />
    </>
  )
}
