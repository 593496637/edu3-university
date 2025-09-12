import { useEffect } from 'react';
import type { ToastType, ToastProps } from '../../types/ui';

export type { ToastType };

function Toast({ message, type, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'error': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 
      flex items-center gap-3 
      px-4 py-3 rounded-lg border 
      backdrop-blur-sm shadow-lg
      transform transition-all duration-300 ease-out
      translate-x-0 opacity-100
      max-w-sm
      ${getColorClasses()}
    `}>
      <div className="text-lg font-medium">
        {getIcon()}
      </div>
      <div className="flex-1 text-sm font-medium break-words">
        {message}
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-300 transition-colors"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;