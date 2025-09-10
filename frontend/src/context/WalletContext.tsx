import { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '../../hooks/useWallet';

interface WalletContextType {
  account: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  loading: boolean;
  connectWallet: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  disconnectWallet: () => void;
  formatAddress: (address: string) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

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