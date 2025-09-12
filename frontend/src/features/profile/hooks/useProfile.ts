import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { courseService } from '../../../services/courseService';
import { useAuthStore } from '../../../store/authStore';
import { CONTRACT_ADDRESSES } from '../../../config/constants';
import type { Course } from '../../courses/types';

import YDTokenABI from '../../../../abis/YDToken.json';

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [purchasedCourses, setPurchasedCourses] = useState<Course[]>([]);
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  const { account, isConnected, isCorrectNetwork, setBalance } = useAuthStore();
  const isReady = isConnected && isCorrectNetwork && account;

  const getProvider = useCallback(() => {
    if (!window.ethereum) throw new Error('请安装 MetaMask');
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  const getSigner = useCallback(async () => {
    const provider = getProvider();
    return await provider.getSigner();
  }, [getProvider]);

  const getContract = useCallback(async (address: string, abi: any) => {
    const signer = await getSigner();
    return new ethers.Contract(address, abi, signer);
  }, [getSigner]);

  const loadUserBalance = useCallback(async () => {
    if (!account || !isReady) return;

    try {
      const newBalance = await courseService.getBalance(account);
      setBalance(newBalance);
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  }, [account, isReady, setBalance]);

  const loadUserCourses = useCallback(async () => {
    if (!account || !isReady) return;

    try {
      setLoading(true);
      const allCourses = await courseService.getCoursesFromAPI();
      
      const purchased: Course[] = [];
      const created: Course[] = [];

      for (const course of allCourses) {
        if (course.instructor.toLowerCase() === account.toLowerCase()) {
          created.push(course);
        } else {
          const hasPurchased = await courseService.hasPurchased(account, course.id);
          if (hasPurchased) {
            purchased.push(course);
          }
        }
      }

      setPurchasedCourses(purchased);
      setCreatedCourses(created);
    } catch (error) {
      console.error('加载用户课程失败:', error);
    } finally {
      setLoading(false);
    }
  }, [account, isReady]);

  const checkOwnerStatus = useCallback(async () => {
    if (!account || !isReady) return;

    try {
      const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (error) {
      console.error('检查 owner 状态失败:', error);
      setIsOwner(false);
    }
  }, [account, isReady, getContract]);

  const mintTokensToUser = useCallback(async (userAddress: string, amount: string): Promise<void> => {
    if (!account || !isReady || !isOwner) {
      throw new Error('只有合约 owner 可以执行此操作');
    }

    try {
      setLoading(true);
      const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
      const amountWei = ethers.parseEther(amount);
      
      const tx = await contract.mint(userAddress, amountWei);
      await tx.wait();

      if (userAddress.toLowerCase() === account.toLowerCase()) {
        await loadUserBalance();
      }
    } finally {
      setLoading(false);
    }
  }, [account, isReady, isOwner, getContract, loadUserBalance]);

  const mintTokensToSelf = useCallback(async (amount: string): Promise<void> => {
    if (!account) {
      throw new Error('请先连接钱包');
    }
    
    await mintTokensToUser(account, amount);
  }, [account, mintTokensToUser]);

  useEffect(() => {
    if (isReady) {
      loadUserBalance();
      loadUserCourses();
      checkOwnerStatus();
    }
  }, [isReady, loadUserBalance, loadUserCourses, checkOwnerStatus]);

  return {
    loading,
    purchasedCourses,
    createdCourses,
    isOwner,
    loadUserBalance,
    loadUserCourses,
    mintTokensToUser,
    mintTokensToSelf
  };
};