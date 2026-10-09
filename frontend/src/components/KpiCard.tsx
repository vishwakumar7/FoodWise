import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  badge?: string;
  variant?: 'amber' | 'blue' | 'emerald' | 'rose' | 'purple' | 'slate';
  tooltip?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  variant = 'amber',
  tooltip,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'amber':
        return {
          iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          glow: 'group-hover:border-amber-500/40',
        };
      case 'blue':
        return {
          iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
          badge: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
          glow: 'group-hover:border-sky-500/40',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          glow: 'group-hover:border-emerald-500/40',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          glow: 'group-hover:border-rose-500/40',
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
          badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
          glow: 'group-hover:border-purple-500/40',
        };
      default:
        return {
          iconBg: 'bg-slate-800 text-slate-300 border border-slate-700',
          badge: 'bg-slate-800 text-slate-400 border border-slate-700',
          glow: 'group-hover:border-slate-700',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`group relative bg-[#111827] border border-slate-800/90 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/40 ${styles.glow}`}
      title={tooltip}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</span>
          </div>
        </div>

        <div className={`p-3 rounded-xl ${styles.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3">
        <span className="text-[12px] text-slate-400 truncate max-w-[70%]">{subtitle}</span>
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles.badge}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
