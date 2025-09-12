import { createContext, useContext } from 'react';
import { useWallet } from '../hooks/useWallet';
import type { WalletContextType, WalletProviderProps } from '../types/context';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: WalletProviderProps) {
  const walletState = useWallet();

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}