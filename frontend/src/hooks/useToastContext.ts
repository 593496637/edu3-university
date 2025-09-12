import { useContext } from 'react';
import { ToastContext } from '../context/ToastContextInstance';

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
