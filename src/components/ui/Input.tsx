'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { fieldBorder, fieldControlClasses, fieldLabelClasses, fieldShellClasses } from './fieldStyles';

export interface UiInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  /** Icone ou texte (ex. « FC ») affiche avant la saisie. */
  startAdornment?: ReactNode;
  /** Element affiche apres la saisie (icone, bouton, cadenas...). */
  endAdornment?: ReactNode;
  /** Classes appliquees au conteneur du champ (marges, largeur). */
  wrapperClassName?: string;
}

/**
 * Champ standardise : libelle, aide, erreur, icone de debut/fin.
 * Le conteneur est un <div> (et non un <label> englobant) pour que les boutons
 * places en `endAdornment` ne declenchent pas le champ.
 */
export function UiInput({
  label,
  error,
  hint,
  id,
  startAdornment,
  endAdornment,
  wrapperClassName = '',
  className = '',
  disabled,
  ...props
}: UiInputProps) {
  const inputId = id ?? props.name ?? `ui-input-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'field'}`;
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`block w-full ${wrapperClassName}`.trim()}>
      {label ? (
        <label htmlFor={inputId} className={fieldLabelClasses}>
          {label}
        </label>
      ) : null}
      <div className={`${fieldShellClasses} ${fieldBorder(error, disabled)}`}>
        {startAdornment ? <span className="flex shrink-0 items-center text-gray-500 text-sm font-black">{startAdornment}</span> : null}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          disabled={disabled}
          className={`${fieldControlClasses} ${className}`.trim()}
          {...props}
        />
        {endAdornment ? <span className="flex shrink-0 items-center text-gray-500">{endAdornment}</span> : null}
      </div>
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
    </div>
  );
}