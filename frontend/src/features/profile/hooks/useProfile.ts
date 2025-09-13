/**
 * 用户个人资料管理 Hook
 * 
 * 功能概述：
 * - 获取用户购买和创建的课程列表
 * - 查询用户YDToken余额和合约owner权限
 * - 集成课程服务API和智能合约交互
 * - 提供加载状态管理和错误处理
 * 
 * 数据流：认证状态 → 合约查询 → 课程数据 → UI展示
 */

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { courseService } from '@services/courseService';
import { useAuthStore } from '@store/authStore';
import { CONTRACT_ADDRESSES } from '@config/constants';
import type { CourseData } from '@/types/contracts';

import YDTokenABI from '@abis/YDToken.json';

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [purchasedCourses, setPurchasedCourses] = useState<CourseData[]>([]);
  const [createdCourses, setCreatedCourses] = useState<CourseData[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  const { account, isConnected, setBalance } = useAuthStore();
  const isReady = isConnected && account;

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
      console.log('开始加载用户课程数据...');
      
      // 首先尝试从API获取课程数据
      let allCourses: CourseData[] = [];
      try {
        allCourses = await courseService.getCoursesFromAPI();
        console.log('从API获取到课程数据:', allCourses.length);
      } catch (apiError) {
        console.warn('API获取课程失败，尝试从合约获取:', apiError);
        allCourses = await courseService.getCoursesFromContract();
        console.log('从合约获取到课程数据:', allCourses.length);
      }
      
      const purchased: CourseData[] = [];
      const created: CourseData[] = [];

      // 并发处理课程检查以提高性能
      const courseChecks = allCourses.map(async (course) => {
        try {
          // 检查是否为用户创建的课程
          if (course.instructor && course.instructor.toLowerCase() === account.toLowerCase()) {
            return { type: 'created', course };
          } else if (course.id) {
            // 检查是否已购买
            const hasPurchased = await courseService.hasPurchased(account, course.id);
            if (hasPurchased) {
              return { type: 'purchased', course };
            }
          }
          return null;
        } catch (error) {
          console.error(`检查课程 ${course.id} 失败:`, error);
          return null;
        }
      });

      const results = await Promise.all(courseChecks);
      
      results.forEach(result => {
        if (result) {
          if (result.type === 'created') {
            created.push(result.course);
          } else if (result.type === 'purchased') {
            purchased.push(result.course);
          }
        }
      });

      console.log('用户已购买课程:', purchased.length);
      console.log('用户已创建课程:', created.length);

      setPurchasedCourses(purchased);
      setCreatedCourses(created);
    } catch (error) {
      console.error('加载用户课程失败:', error);
      // 设置空数组以显示无数据状态而不是加载状态
      setPurchasedCourses([]);
      setCreatedCourses([]);
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
    console.log('useProfile useEffect triggered:', { account, isConnected, isReady });
    if (account && isConnected) {
      console.log('Loading data for account:', account);
      loadUserBalance();
      loadUserCourses();
      checkOwnerStatus();
    }
  }, [account, isConnected, isReady, loadUserBalance, loadUserCourses, checkOwnerStatus]);

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