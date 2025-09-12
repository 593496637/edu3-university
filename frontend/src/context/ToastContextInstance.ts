import { createContext } from 'react';
import type { ToastContextType } from '../types/context';

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
