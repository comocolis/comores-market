'use client';

import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type UiButtonSize = 'sm' | 'md' | 'lg';

export interface UiButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  variant?: UiButtonVariant;
  size?: UiButtonSize;
  loading?: boolean;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-bold transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 rounded-2xl select-none';

const variantClasses: Record<UiButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};

const sizeClasses: Record<UiButtonSize, string> = {
  sm: 'py-2 px-4 text-xs uppercase tracking-widest',
  md: 'py-3 px-6 text-sm',
  lg: 'py-4 px-8 text-base',
};

/** Classes d'un bouton, pour habiller un <Link> ou un <a> de la meme facon qu'un UiButton. */
export function uiButtonClasses(variant: UiButtonVariant = 'primary', size: UiButtonSize = 'md', extra = '') {
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${extra}`.trim();
}

/**
 * Bouton standardise : memes variantes, memes tailles, memes etats.
 * La page d'accueil et les formulaires migreront progressivement vers lui.
 */
export function UiButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}: UiButtonProps) {
  return (
    <button
      className={uiButtonClasses(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      ) : null}
      {children}
    </button>
  );
}
