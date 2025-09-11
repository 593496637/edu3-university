import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'lg',
  className = '' 
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto shadow-2xl ${className}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white w-8 h-8 rounded-full hover:bg-gray-700/50 flex items-center justify-center transition-all duration-200 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}