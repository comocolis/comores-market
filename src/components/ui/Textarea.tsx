'use client';

import type { TextareaHTMLAttributes } from 'react';
import { fieldBorder, fieldLabelClasses, fieldShellClasses } from './fieldStyles';

export interface UiTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

/** Zone de texte multiligne, meme habillage que UiInput. */
export function UiTextarea({ label, error, hint, id, wrapperClassName = '', className = '', disabled, ...props }: UiTextareaProps) {
  const areaId = id ?? props.name ?? `ui-textarea-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'field'}`;

  return (
    <div className={`block w-full ${wrapperClassName}`.trim()}>
      {label ? (
        <label htmlFor={areaId} className={fieldLabelClasses}>
          {label}
        </label>
      ) : null}
      <div className={`${fieldShellClasses} items-start ${fieldBorder(error, disabled)}`}>
        <textarea
          id={areaId}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          className={`min-h-28 min-w-0 flex-1 resize-none bg-transparent py-3 text-base leading-relaxed text-gray-900 placeholder:text-gray-500 outline-none ${className}`.trim()}
          {...props}
        />
      </div>
      {hint && !error ? <span className="mt-1 block text-xs text-gray-500">{hint}</span> : null}
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-bold text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}