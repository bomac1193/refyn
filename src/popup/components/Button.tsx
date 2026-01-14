import React from 'react';
import { cn } from '@/shared/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-refyn-base
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-refyn-cyan to-refyn-cyan-dim
      text-refyn-base font-semibold
      hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]
      focus:ring-refyn-cyan
      active:scale-[0.98]
    `,
    secondary: `
      bg-refyn-surface border border-refyn-active
      text-zinc-100
      hover:bg-refyn-hover hover:border-refyn-cyan/30
      focus:ring-refyn-cyan
    `,
    ghost: `
      bg-transparent
      text-zinc-400
      hover:text-zinc-100 hover:bg-refyn-surface
      focus:ring-refyn-cyan
    `,
    danger: `
      bg-red-500/10 border border-red-500/30
      text-red-500
      hover:bg-red-500/20
      focus:ring-red-500
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

export default Button;
