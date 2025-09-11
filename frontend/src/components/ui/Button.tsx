import type { ReactNode, ButtonHTMLAttributes } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Button({ 
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg hover:shadow-cyan-500/25 focus:ring-cyan-500/50',
    secondary: 'bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-600/50 hover:text-white focus:ring-gray-500/50',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500 shadow-lg hover:shadow-red-500/25 focus:ring-red-500/50',
    success: 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-500 hover:to-teal-500 shadow-lg hover:shadow-green-500/25 focus:ring-green-500/50',
    ghost: 'text-gray-300 hover:text-white hover:bg-gray-700/30 focus:ring-gray-500/50'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" color="white" />
          {children}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          {children}
        </div>
      )}
    </button>
  );
}