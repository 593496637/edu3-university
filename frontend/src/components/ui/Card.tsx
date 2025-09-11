import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export default function Card({ 
  children, 
  title, 
  className = '', 
  hover = false,
  clickable = false,
  onClick 
}: CardProps) {
  const baseClasses = 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-xl';
  const hoverClasses = hover || clickable ? 'hover:shadow-2xl hover:shadow-blue-500/10 hover:transform hover:scale-105' : '';
  const clickableClasses = clickable ? 'cursor-pointer' : '';
  const transitionClasses = 'transition-all duration-300';

  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${transitionClasses} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="p-6 pb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
          </div>
        </div>
      )}
      <div className={title ? 'px-6 pb-6' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}