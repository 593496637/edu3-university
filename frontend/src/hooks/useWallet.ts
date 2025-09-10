import { useState, useEffect } from 'react';

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkNetwork = async () => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装 MetaMask!');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        await checkNetwork();
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setIsCorrectNetwork(true);
    } catch (error: any) {
      if (error.code === 4902) {
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
          setIsCorrectNetwork(true);
        } catch (addError) {
          console.error('添加网络失败:', addError);
        }
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          setIsConnected(true);
          checkNetwork();
        }
      };

      const handleChainChanged = () => {
        checkNetwork();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // 检查是否已连接
      window.ethereum.request({ method: 'eth_accounts' }).then(handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    account,
    isConnected,
    isCorrectNetwork,
    loading,
    connectWallet,
    switchToSepolia,
    disconnectWallet,
    formatAddress,
  };
}