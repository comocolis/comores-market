'use client';

import type { InputHTMLAttributes } from 'react';

export interface UiInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Champ standardise : libelle, aide et message d'erreur coherents.
 * Concu pour les formulaires existants (recherche, publier, compte, auth).
 */
export function UiInput({ label, error, hint, id, className = '', ...props }: UiInputProps) {
  const inputId = id ?? props.name ?? `ui-input-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'field'}`;
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <label className="block w-full" htmlFor={inputId}>
      {label ? (
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-700">
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:bg-gray-50 disabled:text-gray-500 ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${className}`.trim()}
        {...props}
      />
      {hint && !error ? (
        <span id={`${inputId}-hint`} className="mt-1 block text-xs text-gray-500">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${inputId}-error`} role="alert" className="mt-1 block text-xs font-bold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
