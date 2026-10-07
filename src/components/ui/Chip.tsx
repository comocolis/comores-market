'use client';

import type { ButtonHTMLAttributes } from 'react';

export interface UiChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tone?: 'brand' | 'mustard' | 'neutral';
}

/**
 * Pastille de selection standardisee (categories, iles, filtres rapides).
 * Remplace progressivement les boutons ad hoc disperses dans l'accueil.
 */
export function UiChip({ active = false, tone = 'brand', className = '', children, ...props }: UiChipProps) {
  const activeTone =
    tone === 'mustard'
      ? 'bg-mustard text-gray-900 border-mustard shadow-sm'
      : tone === 'neutral'
        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
        : 'bg-brand text-white border-brand shadow-sm';

  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
        active ? activeTone : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
