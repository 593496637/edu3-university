import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
import type { BaseProviderProps } from '../types/context';
import { ToastContext } from './ToastContextInstance';

export function ToastProvider({ children }: BaseProviderProps) {
  const { toasts, toast, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}