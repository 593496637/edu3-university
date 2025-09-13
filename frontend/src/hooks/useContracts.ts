/**
 * 智能合约交互管理 Hook
 * 
 * 功能概述：
 * - 提供Web3智能合约实例创建和管理
 * - 支持读写分离：交易需要Signer，查询可用Provider
 * - 集成YDToken、CourseManager、SimpleStaking三个核心合约
 * - 自动检查钱包连接状态和网络环境
 * 
 * 架构：Provider/Signer工厂 + 合约实例管理 + 只读合约支持
 */

import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useAuthStore } from '@store/authStore';
import { CONTRACT_ADDRESSES } from '@config/constants';

import YDTokenABI from '@abis/YDToken.json';
import CourseManagerABI from '@abis/CourseManager.json';
import SimpleStakingABI from '@abis/SimpleStaking.json';

export function useContracts() {
  const { account, isConnected, isCorrectNetwork } = useAuthStore();

  // 获取Web3 Provider（只读操作）
  const getProvider = useCallback(() => {
    if (!window.ethereum) throw new Error('请安装 MetaMask');
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // 获取Web3 Signer（用于交易签名）
  const getSigner = useCallback(async () => {
    const provider = getProvider();
    return await provider.getSigner();
  }, [getProvider]);

  // 创建可签名合约实例（用于发送交易）
  const getContract = useCallback(async (address: string, abi: ethers.InterfaceAbi) => {
    const signer = await getSigner();
    return new ethers.Contract(address, abi, signer);
  }, [getSigner]);

  const getYDTokenContract = useCallback(async () => {
    return await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
  }, [getContract]);

  const getCourseManagerContract = useCallback(async () => {
    return await getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
  }, [getContract]);

  const getStakingContract = useCallback(async () => {
    return await getContract(CONTRACT_ADDRESSES.SimpleStaking, SimpleStakingABI.abi);
  }, [getContract]);

  // 创建只读合约实例（用于查询数据）
  const getReadOnlyContract = useCallback((address: string, abi: ethers.InterfaceAbi) => {
    const provider = getProvider();
    return new ethers.Contract(address, abi, provider);
  }, [getProvider]);

  const getYDTokenReadOnly = useCallback(() => {
    return getReadOnlyContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
  }, [getReadOnlyContract]);

  const getCourseManagerReadOnly = useCallback(() => {
    return getReadOnlyContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
  }, [getReadOnlyContract]);

  const getStakingReadOnly = useCallback(() => {
    return getReadOnlyContract(CONTRACT_ADDRESSES.SimpleStaking, SimpleStakingABI.abi);
  }, [getReadOnlyContract]);

  // 返回合约管理工具集
  return {
    isReady: isConnected && isCorrectNetwork && account, // Web3环境是否就绪
    getProvider,
    getSigner,
    getContract,
    // 三个核心合约的可签名实例
    getYDTokenContract,
    getCourseManagerContract,
    getStakingContract,
    // 三个核心合约的只读实例
    getYDTokenReadOnly,
    getCourseManagerReadOnly,
    getStakingReadOnly,
    CONTRACT_ADDRESSES
  };
}