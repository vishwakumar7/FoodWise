import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900 mt-1">
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-gray-500 mt-1">
          {subtext}
        </div>
      )}
    </div>
  );
};
