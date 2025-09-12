import type { ReactNode } from 'react';

// Wallet Context 类型
export interface WalletContextType {
  account: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  loading: boolean;
  connectWallet: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  disconnectWallet: () => void;
  formatAddress: (address: string) => string;
}

export interface WalletProviderProps {
  children: ReactNode;
}

// Toast Context 类型
export interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

export interface ToastProviderProps {
  children: ReactNode;
}

// 通用 Provider Props
export interface BaseProviderProps {
  children: ReactNode;
}