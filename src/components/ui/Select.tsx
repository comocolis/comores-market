'use client';

import type { ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { fieldBorder, fieldLabelClasses, fieldShellClasses } from './fieldStyles';

export interface UiSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  startAdornment?: ReactNode;
  wrapperClassName?: string;
}

/** Liste deroulante native (meilleure ergonomie mobile) avec le meme habillage que UiInput. */
export function UiSelect({ label, error, id, startAdornment, wrapperClassName = '', className = '', disabled, children, ...props }: UiSelectProps) {
  const selectId = id ?? props.name ?? `ui-select-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'field'}`;

  return (
    <div className={`block w-full ${wrapperClassName}`.trim()}>
      {label ? (
        <label htmlFor={selectId} className={fieldLabelClasses}>
          {label}
        </label>
      ) : null}
      <div className={`${fieldShellClasses} relative ${fieldBorder(error, disabled)}`}>
        {startAdornment ? <span className="flex shrink-0 items-center text-gray-500">{startAdornment}</span> : null}
        <select
          id={selectId}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          className={`min-w-0 flex-1 appearance-none bg-transparent py-3 pr-6 text-base font-medium text-gray-900 outline-none disabled:text-gray-500 ${className}`.trim()}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute right-3 text-gray-500" />
      </div>
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-bold text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}