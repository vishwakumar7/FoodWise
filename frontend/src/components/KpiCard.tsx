import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  secondaryText: string;
  badge?: string;
  status?: 'neutral' | 'olive' | 'terracotta' | 'warm';
  detailFormula?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  secondaryText,
  badge,
  status = 'neutral',
  detailFormula,
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'olive':
        return 'bg-olive-50 text-olive-800 border-olive-200';
      case 'terracotta':
        return 'bg-terracotta-50 text-terracotta-800 border-terracotta-200';
      case 'warm':
        return 'bg-warm-50 text-warm-700 border-warm-200';
      default:
        return 'bg-canvas-subtle text-ink-600 border-line';
    }
  };

  return (
    <div className="bg-card border border-line rounded-lg p-4 transition-colors hover:border-line-strong flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 font-sans">
            {label}
          </span>
          {badge && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getBadgeStyle()}`}>
              {badge}
            </span>
          )}
        </div>

        <div className="mt-2.5">
          <span className="font-serif text-2xl lg:text-3xl font-bold text-ink-950 tracking-tight font-tabular">
            {value}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-line/60 flex items-baseline justify-between text-xs">
        <span className="text-ink-500 text-[11px] truncate">{secondaryText}</span>
        {detailFormula && (
          <span className="text-[10px] text-ink-400 font-mono shrink-0 ml-2">{detailFormula}</span>
        )}
      </div>
    </div>
  );
};
