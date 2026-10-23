import React from 'react';
import { LucideIcon, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white/70 shadow-sm ${className}`}>
      <div className="w-14 h-14 mx-auto rounded-2xl bg-krishi-50 border border-krishi-200/60 flex items-center justify-center text-krishi-700 mb-4 shadow-inner">
        <Icon className="w-7 h-7 text-krishi-600" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-md mx-auto mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-krishi-700 hover:bg-krishi-800 text-white shadow-sm transition-all transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
