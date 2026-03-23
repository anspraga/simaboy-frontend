import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || Math.random().toString(36).substring(7);
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`
            w-full bg-white border rounded-xl px-4 py-3 text-base md:text-sm text-slate-800 
            transition-all placeholder:text-slate-400 outline-none select-auto
            ${error ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            disabled:bg-slate-50 disabled:text-slate-400
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-500 ml-1 translate-y-0 animate-fade-in-up">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
