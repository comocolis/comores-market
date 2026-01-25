/**
 * Lightweight date formatting utilities
 * Replaces heavy date-fns dependency (saves ~60KB)
 */

const TIME_UNITS = {
  year: 31536000000,
  month: 2592000000,
  week: 604800000,
  day: 86400000,
  hour: 3600000,
  minute: 60000,
  second: 1000,
} as const;

const LABELS_FR = {
  year: { singular: 'an', plural: 'ans' },
  month: { singular: 'mois', plural: 'mois' },
  week: { singular: 'semaine', plural: 'semaines' },
  day: { singular: 'jour', plural: 'jours' },
  hour: { singular: 'heure', plural: 'heures' },
  minute: { singular: 'minute', plural: 'minutes' },
  second: { singular: 'seconde', plural: 'secondes' },
} as const;

/**
 * Format a date as relative time from now
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted string like "il y a 2 heures"
 */
export function formatDistanceToNow(
  date: Date | string | number,
  options: { addSuffix?: boolean; locale?: string } = {}
): string {
  const { addSuffix = true } = options;
  const now = Date.now();
  const targetDate = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const diff = now - targetDate;
  const absDiff = Math.abs(diff);

  // Find the appropriate unit
  for (const [unit, ms] of Object.entries(TIME_UNITS)) {
    if (absDiff >= ms) {
      const value = Math.floor(absDiff / ms);
      const label = LABELS_FR[unit as keyof typeof LABELS_FR];
      const text = value === 1 ? label.singular : label.plural;
      
      if (addSuffix) {
        return diff < 0 ? `dans ${value} ${text}` : `il y a ${value} ${text}`;
      }
      return `${value} ${text}`;
    }
  }

  return addSuffix ? "à l'instant" : "maintenant";
}

/**
 * Format a date to locale string
 * @param date - The date to format
 * @param format - The format type ('short', 'long', 'numeric')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'long' | 'numeric' = 'short'
): string {
  const d = date instanceof Date ? date : new Date(date);

  switch (format) {
    case 'long':
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'numeric':
      return d.toLocaleDateString('fr-FR');
    case 'short':
    default:
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
  }
}

/**
 * Format time only
 * @param date - The date to extract time from
 * @returns Time string like "14:30"
 */
export function formatTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 * @param date - The date to check
 * @returns True if the date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}
