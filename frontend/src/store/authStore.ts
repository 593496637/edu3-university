import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthState {
  account: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isLoggedIn: boolean;
  balance: string;
  chainId: number | null;
}

interface AuthActions {
  setAccount: (account: string | null) => void;
  setConnected: (connected: boolean) => void;
  setCorrectNetwork: (correct: boolean) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  setBalance: (balance: string) => void;
  setChainId: (chainId: number | null) => void;
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  account: null,
  isConnected: false,
  isCorrectNetwork: false,
  isLoggedIn: false,
  balance: '0',
  chainId: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      setAccount: (account) => set({ account }),
      setConnected: (isConnected) => set({ isConnected }),
      setCorrectNetwork: (isCorrectNetwork) => set({ isCorrectNetwork }),
      setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setBalance: (balance) => set({ balance }),
      setChainId: (chainId) => set({ chainId }),
      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        account: state.account,
        isLoggedIn: state.isLoggedIn,
        chainId: state.chainId
      }),
    }
  )
);