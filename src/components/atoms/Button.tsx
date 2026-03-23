import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-teal-600 text-white hover:bg-teal-500 active:bg-teal-700 shadow-lg shadow-teal-500/30',
  secondary: 'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-900 shadow-md',
  outline: 'border-2 border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-600 bg-transparent',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 shadow-lg shadow-rose-500/30',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 md:py-1.5 text-xs rounded-lg min-h-[36px]',
  md: 'px-5 py-3 md:py-2.5 text-sm rounded-xl min-h-[44px]',
  lg: 'px-6 py-4 md:py-3.5 text-base rounded-2xl min-h-[52px]',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClass = 'inline-flex items-center justify-center font-bold select-none touch-manipulation transition-all duration-200 active:scale-[0.98] outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:pointer-events-none';
  const finalClass = `${baseClass} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  return (
    <button className={finalClass} disabled={isLoading || disabled} {...props}>
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
