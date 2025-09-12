import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useAuthStore } from '@store/authStore';
import { CONTRACT_ADDRESSES } from '@config/constants';

import YDTokenABI from '@abis/YDToken.json';
import CourseManagerABI from '@abis/CourseManager.json';
import SimpleStakingABI from '@abis/SimpleStaking.json';

export function useContracts() {
  const { account, isConnected, isCorrectNetwork } = useAuthStore();

  const getProvider = useCallback(() => {
    if (!window.ethereum) throw new Error('请安装 MetaMask');
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  const getSigner = useCallback(async () => {
    const provider = getProvider();
    return await provider.getSigner();
  }, [getProvider]);

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

  return {
    isReady: isConnected && isCorrectNetwork && account,
    getProvider,
    getSigner,
    getContract,
    getYDTokenContract,
    getCourseManagerContract,
    getStakingContract,
    getYDTokenReadOnly,
    getCourseManagerReadOnly,
    getStakingReadOnly,
    CONTRACT_ADDRESSES
  };
}