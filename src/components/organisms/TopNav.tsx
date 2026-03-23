import React from 'react';
import { Button } from '../atoms/Button';

interface TopNavProps {
  title: string;
  subtitle?: string;
  onActionClick?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}

export const TopNav: React.FC<TopNavProps> = ({
  title,
  subtitle,
  onActionClick,
  actionLabel,
  actionIcon,
}) => {
  return (
    <header className="shrink-0 w-full h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm flex items-center justify-between px-6 md:px-10 z-10 sticky top-0 transition-all">
      <div className="flex flex-col animate-fade-in min-w-0 flex-1 mr-4">
        <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight capitalize truncate">
          {title}
        </h2>
        {subtitle && (
          <span className="text-xs md:text-sm text-slate-500 font-medium mt-0.5 hidden md:block">
            {subtitle}
          </span>
        )}
      </div>
      
      {onActionClick && actionLabel && (
        <div className="flex items-center gap-3 animate-fade-in">
          <Button 
            variant="primary" 
            onClick={onActionClick}
            leftIcon={actionIcon || <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>}
          >
            <span className="hidden md:inline">{actionLabel}</span>
            <span className="md:hidden">Baru</span>
          </Button>
        </div>
      )}
    </header>
  );
};
