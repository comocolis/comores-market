'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Animated Icon Container */}
      <div className="mb-6 p-6 bg-brand/5 rounded-full border-2 border-brand/10 shadow-lg shadow-brand/5 animate-bounce">
        <Icon size={48} className="text-brand opacity-60" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm leading-relaxed">{description}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {action && (
          action.href ? (
            <Link href={action.href} aria-label={action.label} className="w-full bg-brand text-white font-bold py-3 px-6 rounded-2xl hover:bg-brand/90 active:scale-95 transition">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} aria-label={action.label} className="w-full bg-brand text-white font-bold py-3 px-6 rounded-2xl hover:bg-brand/90 active:scale-95 transition">
              {action.label}
            </button>
          )
        )}

        {secondaryAction && (
          secondaryAction.href ? (
            <Link href={secondaryAction.href} aria-label={secondaryAction.label} className="w-full bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-2xl hover:bg-gray-200 active:scale-95 transition">
              {secondaryAction.label}
            </Link>
          ) : (
            <button onClick={secondaryAction.onClick} aria-label={secondaryAction.label} className="w-full bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-2xl hover:bg-gray-200 active:scale-95 transition">
              {secondaryAction.label}
            </button>
          )
        )}
      </div>
    </div>
  )
}

export function EmptyStateFavorites() {
  return (
    <EmptyState
      icon={Heart}
      title="Aucun favori pour le moment"
      description="Commencez à ajouter des annonces à vos favoris pour les retrouver facilement"
      action={{
        label: "Découvrir des annonces",
        href: "/"
      }}
    />
  )
}

export function EmptyStateSearchResults({ onViewAll }: { onViewAll?: () => void } = {}) {
  return (
    <EmptyState
      icon={Search}
      title="Aucune annonce trouvée"
      description="Essayez de modifier vos critères de recherche ou explorez d'autres catégories"
      secondaryAction={{
        label: "Voir toutes les annonces",
        ...(onViewAll ? { onClick: onViewAll } : { href: "/" })
      }}
    />
  )
}

export function EmptyStateListings() {
  return (
    <EmptyState
      icon={ShoppingBag}
      title="Vous n'avez pas d'annonces"
      description="Commencez à vendre en créant votre première annonce"
      action={{
        label: "Créer une annonce",
        href: "/publier"
      }}
      secondaryAction={{
        label: "Apprendre comment vendre",
        href: "/faq"
      }}
    />
  )
}

export function EmptyStateMessages() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Aucun message"
      description="Vos messages de discussion apparaîtront ici"
      action={{
        label: "Parcourir les annonces",
        href: "/"
      }}
    />
  )
}

export function EmptyStateNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="Aucune notification"
      description="Vous êtes à jour avec tout !"
    />
  )
}

export function EmptyStateReviews() {
  return (
    <EmptyState
      icon={Star}
      title="Aucun avis pour le moment"
      description="Les avis des clients apparaîtront ici"
    />
  )
}

// Import icons for empty states
import { Heart, Search, ShoppingBag, MessageSquare, Bell, Star, Package } from 'lucide-react'

export function EmptyStateDefault({ title = "Aucun résultat", description = "Essayez une autre recherche" }: { title?: string; description?: string }) {
  return (
    <EmptyState
      icon={Package}
      title={title}
      description={description}
    />
  )
}
