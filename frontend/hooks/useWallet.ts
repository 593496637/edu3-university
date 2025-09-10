import { useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { Eip1193Provider } from 'ethers'

interface WalletState {
  account: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

// 扩展 MetaMask 的 provider 类型
interface EthereumProvider extends Eip1193Provider {
  isMetaMask?: boolean;
  on(event: 'accountsChanged', handler: (accounts: string[]) => void): this;
  on(event: 'chainChanged', handler: (chainId: string) => void): this;
  on(event: string, handler: (...args: unknown[]) => void): this;
  removeListener(event: 'accountsChanged', handler: (accounts: string[]) => void): this;
  removeListener(event: 'chainChanged', handler: (chainId: string) => void): this;
  removeListener(event: string, handler: (...args: unknown[]) => void): this;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    account: null,
    isConnected: false,
    isCorrectNetwork: false,
    provider: null,
    signer: null,
  });

  const [loading, setLoading] = useState(false);

  // 检查是否安装了MetaMask
  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        setWallet({
          account: accounts[0],
          isConnected: true,
          isCorrectNetwork: network.chainId === BigInt(SEPOLIA_CHAIN_ID_DECIMAL),
          provider,
          signer,
        });
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  // 连接钱包
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装 MetaMask!');
      return;
    }

    setLoading(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setWallet({
        account: accounts[0],
        isConnected: true,
        isCorrectNetwork: network.chainId === BigInt(SEPOLIA_CHAIN_ID_DECIMAL),
        provider,
        signer,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换到Sepolia网络
  const switchToSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (error: unknown) {
      // 如果网络不存在，添加网络
      if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            },
          ],
        });
      }
    }
  };

  // 断开连接
  const disconnectWallet = () => {
    setWallet({
      account: null,
      isConnected: false,
      isCorrectNetwork: false,
      provider: null,
      signer: null,
    });
  };

  // 格式化地址显示
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 监听账户和网络变化
  useEffect(() => {
    checkIfWalletIsConnected();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          window.location.reload();
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on?.('accountsChanged', handleAccountsChanged);
      window.ethereum.on?.('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    ...wallet,
    loading,
    connectWallet,
    switchToSepolia,
    disconnectWallet,
    formatAddress,
  };
};
