import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '' 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-lg';
  
  const variantClasses = {
    primary: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    secondary: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    warning: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}