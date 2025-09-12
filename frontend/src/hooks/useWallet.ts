import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';

export function useWallet() {
  const {
    account,
    isConnected,
    isCorrectNetwork,
    chainId,
    setAccount,
    setConnected,
    setCorrectNetwork,
    setChainId,
    reset
  } = useAuthStore();

  const checkNetwork = useCallback(async () => {
    if (window.ethereum) {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const chainIdDecimal = parseInt(currentChainId, 16);
      setChainId(chainIdDecimal);
      setCorrectNetwork(currentChainId === SEPOLIA_CHAIN_ID);
    }
  }, [setChainId, setCorrectNetwork]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装 MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setConnected(true);
        await checkNetwork();
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setCorrectNetwork(true);
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                rpcUrls: [SEPOLIA_RPC],
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'SEP',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          });
          setCorrectNetwork(true);
        } catch (addError) {
          console.error('添加网络失败:', addError);
        }
      }
    }
  };

  const disconnectWallet = useCallback(() => {
    reset();
  }, [reset]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
      setConnected(true);
      checkNetwork();
    }
  }, [disconnectWallet, setAccount, setConnected, checkNetwork]);

  const handleChainChanged = useCallback(() => {
    checkNetwork();
  }, [checkNetwork]);

  useEffect(() => {
    if (window.ethereum) {

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // 检查是否已连接
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        handleAccountsChanged(accounts as string[]);
      });

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [handleAccountsChanged, handleChainChanged]);

  return {
    account,
    isConnected,
    isCorrectNetwork,
    chainId,
    connectWallet,
    switchToSepolia,
    disconnectWallet,
    formatAddress,
  };
}