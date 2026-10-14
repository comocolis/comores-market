// Styles partages par les champs de formulaire (input, select, textarea).
// text-base (16 px) : evite le zoom automatique d'iOS au focus.

export const fieldShellClasses =
  'flex w-full items-center gap-2 rounded-2xl border bg-gray-50 dark:bg-slate-800/80 px-3.5 transition focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20';

export const fieldControlClasses =
  'min-w-0 flex-1 bg-transparent py-3 text-base text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-500 outline-none disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-slate-600';

export const fieldLabelClasses = 'mb-1 block text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300';

export function fieldBorder(error?: string, disabled?: boolean) {
  if (error) return 'border-red-400 dark:border-red-500';
  return disabled ? 'border-gray-100 dark:border-slate-800 bg-gray-100 dark:bg-slate-800!' : 'border-gray-200 dark:border-slate-700';
}
