/**
 * 钱包连接管理 Hook
 * 
 * 功能概述：
 * - MetaMask钱包连接、断开连接和账户切换
 * - Sepolia测试网络检测和切换
 * - 账户状态监听和自动重连
 * - 地址格式化工具函数
 * 
 * 核心特性：网络自动检测 + 账户监听 + 错误处理
 */

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { NETWORK_CONFIG, ERROR_MESSAGES, UI_CONFIG } from '../config/constants';

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

  // 检查当前网络是否为Sepolia测试网
  const checkNetwork = useCallback(async () => {
    if (window.ethereum) {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const chainIdDecimal = parseInt(currentChainId, 16);
      setChainId(chainIdDecimal);
      setCorrectNetwork(currentChainId === NETWORK_CONFIG.SEPOLIA_CHAIN_ID_HEX);
    }
  }, [setChainId, setCorrectNetwork]);

  // 连接MetaMask钱包
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert(ERROR_MESSAGES.WALLET_NOT_INSTALLED);
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
      console.error(ERROR_MESSAGES.WALLET_CONNECTION_FAILED + ':', error);
    }
  };

  // 切换到Sepolia测试网络，如果网络不存在则自动添加
  const switchToSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.SEPOLIA_CHAIN_ID_HEX }],
      });
      setCorrectNetwork(true);
    } catch (error: unknown) {
      const err = error as { code?: number };
      // 错误码4902表示网络不存在，需要添加
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORK_CONFIG.SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Sepolia Testnet',
                rpcUrls: [NETWORK_CONFIG.SEPOLIA_RPC],
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

  // 格式化钱包地址显示（0x1234...abcd）
  const formatAddress = (address: string) => {
    return `${address.slice(0, UI_CONFIG.ADDRESS_DISPLAY_LENGTH.PREFIX)}...${address.slice(-UI_CONFIG.ADDRESS_DISPLAY_LENGTH.SUFFIX)}`;
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

  // 监听钱包账户和网络变化，实现自动重连
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // 检查页面加载时是否已连接钱包
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