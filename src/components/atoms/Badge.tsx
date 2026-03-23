import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  pulsing?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  pulsing = false,
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border';
  
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-rose-100 text-rose-700 border-rose-200',
    info: 'bg-teal-100 text-teal-700 border-teal-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const pulseClasses: Record<BadgeVariant, string> = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    info: 'bg-teal-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {pulsing && (
        <span className="relative flex h-2 w-2 mr-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseClasses[variant]}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseClasses[variant]}`}></span>
        </span>
      )}
      {children}
    </span>
  );
};
