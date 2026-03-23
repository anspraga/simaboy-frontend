import React from 'react';

interface LoadingProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = 'Memuat data...', 
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 space-y-4 animate-fade-in ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className={`absolute ${sizeClasses[size]} rounded-full border-4 border-indigo-100 opacity-20`}></div>
        {/* Inner spinning gradient ring, gap at top */}
        <div className={`absolute ${sizeClasses[size]} rounded-full border-4 border-transparent border-t-indigo-600 animate-spin`}></div>
        {/* Subtle pulse core */}
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
      </div>
      {message && (
        <p className="text-sm font-medium text-slate-400 tracking-wide animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};
