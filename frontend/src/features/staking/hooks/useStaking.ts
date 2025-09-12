import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAuthStore } from '../../../store/authStore';
import { CONTRACT_ADDRESSES } from '../../../config/constants';
import type { StakeInfo } from '../../../types/contracts';

import YDTokenABI from '../../../../abis/YDToken.json';
import SimpleStakingABI from '../../../../abis/SimpleStaking.json';

export const useStaking = () => {
  const [loading, setLoading] = useState(false);
  const [stakeInfo, setStakeInfo] = useState<StakeInfo>({
    amount: '0',
    startTime: 0,
    isActive: false
  });
  const [reward, setReward] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [dailyRewardRate, setDailyRewardRate] = useState(100);

  const { account, isConnected, isCorrectNetwork, balance } = useAuthStore();
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

  const loadStakingData = useCallback(async () => {
    if (!account || !isReady) return;

    try {
      const stakingContract = await getContract(CONTRACT_ADDRESSES.SimpleStaking, SimpleStakingABI.abi);
      
      const [amount, stakeTime] = await stakingContract.getStakeInfo(account);
      const rewardAmount = await stakingContract.calculateReward(account);
      const totalStakedAmount = await stakingContract.getTotalStaked();
      const rate = await stakingContract.DAILY_REWARD_RATE();

      setStakeInfo({
        amount: ethers.formatEther(amount),
        startTime: Number(stakeTime),
        isActive: Number(amount) > 0
      });
      
      setReward(ethers.formatEther(rewardAmount));
      setTotalStaked(ethers.formatEther(totalStakedAmount));
      setDailyRewardRate(Number(rate));
    } catch (error) {
      console.error('获取质押信息失败:', error);
      setStakeInfo({
        amount: '0',
        startTime: 0,
        isActive: false
      });
      setReward('0');
    }
  }, [account, isReady, getContract]);

  const handleStake = useCallback(async (amount: string): Promise<void> => {
    if (!account || !isReady) {
      throw new Error('请先连接钱包并切换到正确网络');
    }

    if (parseFloat(amount) <= 0) {
      throw new Error('质押金额必须大于0');
    }

    if (parseFloat(balance) < parseFloat(amount)) {
      throw new Error('代币余额不足');
    }

    try {
      setLoading(true);

      const tokenContract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
      const stakingContract = await getContract(CONTRACT_ADDRESSES.SimpleStaking, SimpleStakingABI.abi);
      
      const amountWei = ethers.parseEther(amount);
      
      const currentAllowance = await tokenContract.allowance(account, CONTRACT_ADDRESSES.SimpleStaking);
      
      if (currentAllowance < amountWei) {
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.SimpleStaking, amountWei);
        await approveTx.wait();
      }

      const stakeTx = await stakingContract.stake(amountWei);
      await stakeTx.wait();

      await loadStakingData();
    } finally {
      setLoading(false);
    }
  }, [account, isReady, balance, getContract, loadStakingData]);

  const handleUnstake = useCallback(async (): Promise<void> => {
    if (!account || !isReady) {
      throw new Error('请先连接钱包并切换到正确网络');
    }

    if (!stakeInfo.isActive) {
      throw new Error('您没有质押的代币');
    }

    try {
      setLoading(true);
      const contract = await getContract(CONTRACT_ADDRESSES.SimpleStaking, SimpleStakingABI.abi);
      
      const tx = await contract.unstake();
      await tx.wait();

      await loadStakingData();
    } finally {
      setLoading(false);
    }
  }, [account, isReady, stakeInfo.isActive, getContract, loadStakingData]);

  useEffect(() => {
    if (isReady) {
      loadStakingData();
    }
  }, [isReady, loadStakingData]);

  useEffect(() => {
    if (!isReady || !stakeInfo.isActive) return;

    const interval = setInterval(() => {
      loadStakingData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isReady, stakeInfo.isActive, loadStakingData]);

  return {
    loading,
    stakeInfo,
    reward,
    totalStaked,
    dailyRewardRate,
    handleStake,
    handleUnstake,
    loadStakingData
  };
};