import React from 'react';

type CardVariant = 'default' | 'glass' | 'glass-dark' | 'outline';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  hoverable = false,
}) => {
  const baseClasses = 'rounded-3xl p-6 transition-all duration-300';
  
  const hoverClasses = hoverable 
    ? 'hover:-translate-y-1 hover:shadow-xl cursor-pointer' 
    : '';

  const variants: Record<CardVariant, string> = {
    default: 'bg-white border border-slate-200 shadow-sm',
    glass: 'glass',
    'glass-dark': 'glass-dark',
    outline: 'bg-transparent border-2 border-slate-200',
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
