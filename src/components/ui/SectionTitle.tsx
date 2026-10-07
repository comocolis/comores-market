import type { ReactNode } from 'react';

export interface UiSectionTitleProps {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  tone?: 'brand' | 'mustard' | 'neutral';
}

/**
 * Titre de section standardise : surtitre (eyebrow) + titre display.
 * Apporte la hierarchie moderne sans toucher aux mises en page existantes.
 */
export function UiSectionTitle({ eyebrow, title, action, tone = 'brand' }: UiSectionTitleProps) {
  const eyebrowColor =
    tone === 'mustard' ? 'text-mustard-dark' : tone === 'neutral' ? 'text-gray-500' : 'text-brand';

  return (
    <div className="mb-4 flex items-end justify-between gap-3 px-1">
      <div>
        {eyebrow ? (
          <p className={`mb-1 text-[11px] font-black uppercase tracking-[0.18em] ${eyebrowColor}`}>
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-xl font-black tracking-tight text-gray-900">{title}</h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
