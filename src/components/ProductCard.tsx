'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Sparkles, Crown } from 'lucide-react'
import PriceTag from '@/components/PriceTag'
import { getFirstProductImage } from '@/utils/parseImages'

export interface ProductCardData {
  id: string
  title: string
  price: number
  images: unknown
  location_island?: string | null
  location_city?: string | null
}

interface ProductCardProps {
  product: ProductCardData
  isPro?: boolean
  isBoosted?: boolean
  /** Index dans la liste : les premieres cartes sont chargees en priorite (LCP). */
  index?: number
  onClick?: () => void
  /** Element superpose en haut a droite de la photo (ex. bouton favori). */
  overlay?: ReactNode
}

/** Carte d'annonce unique pour toutes les grilles (accueil, favoris, profil...). */
export default function ProductCard({ product, isPro = false, isBoosted = false, index = 99, onClick, overlay }: ProductCardProps) {
  const img = getFirstProductImage(product.images) || '/placeholder.webp'

  return (
    <Link
      href={`/annonce/${product.id}`}
      onClick={onClick}
      className="group flex flex-col bg-white rounded-card shadow-card border border-gray-100 overflow-hidden transition-all duration-base hover:-translate-y-0.5 hover:shadow-pop active:scale-[0.98]"
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={img}
          alt={product.title}
          fill
          sizes="(max-width: 500px) 50vw, 240px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority={index < 2}
          fetchPriority={index < 2 ? 'high' : undefined}
          loading={index < 4 ? 'eager' : 'lazy'}
          quality={75}
        />

        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {isBoosted && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest">
              <Sparkles size={10} fill="currentColor" aria-hidden="true" /> VEDETTE
            </span>
          )}
          {isPro && (
            <span className="bg-black/80 backdrop-blur-md text-white border border-white/20 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest">
              <Crown size={10} className="text-amber-400 fill-amber-400" aria-hidden="true" /> PRO
            </span>
          )}
        </div>

        {overlay ? <div className="absolute top-2 right-2">{overlay}</div> : null}

        {product.location_island ? (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-lg font-bold uppercase">
            {product.location_island}
          </div>
        ) : null}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-display text-gray-900 text-sm font-bold line-clamp-2 leading-tight mb-1 group-hover:text-brand transition-colors">
          {product.title}
        </h3>
        <div className="mt-auto flex flex-col gap-1">
          <PriceTag price={product.price} className="text-brand-700 font-black text-base tracking-tight" />
          {product.location_city ? (
            <div className="flex items-center gap-1 text-gray-500 text-[11px] uppercase font-bold tracking-wide">
              <MapPin size={11} className="text-gray-400" aria-hidden="true" /> {product.location_city}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
