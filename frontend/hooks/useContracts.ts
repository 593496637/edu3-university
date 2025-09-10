import { useState, useMemo } from 'react';
import { Contract, formatEther, parseEther } from 'ethers';
import { useWallet } from './useWallet';

// 合约地址
const CONTRACT_ADDRESSES = {
  YDToken: '0x752250B9471b77e85c3DE330db8a5d7802Eb87d7',
  CourseManager: '0xCb4A483c8F1F84BF0128a7081c0d4FC4A2607EE7',
  SimpleStaking: '0xf5924164C4685f650948bf4a51124f0CB24DA026',
};

// 合约ABI (简化版，实际使用时需要完整ABI)
const YD_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

const COURSE_MANAGER_ABI = [
  'function createCourse(string title, string description, uint256 price) returns (uint256)',
  'function purchaseCourse(uint256 courseId) returns (bool)',
  'function getCourse(uint256 courseId) view returns (tuple(uint256 id, string title, string description, uint256 price, address instructor, bool active, uint256 createdAt))',
  'function hasPurchased(address user, uint256 courseId) view returns (bool)',
  'function getTotalCourses() view returns (uint256)',
  'event CourseCreated(uint256 indexed courseId, address indexed instructor, string title, string description, uint256 price, uint256 timestamp)',
  'event CoursePurchased(address indexed buyer, uint256 indexed courseId, address indexed instructor, uint256 price, uint256 timestamp)',
];

const STAKING_ABI = [
  'function stake(uint256 amount)',
  'function unstake()',
  'function calculateReward(address user) view returns (uint256)',
  'function getStakeInfo(address user) view returns (uint256 amount, uint256 stakeTime, uint256 pendingReward)',
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount, uint256 reward)',
];

export const useContracts = () => {
  const { signer, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);

  // 创建合约实例
  const contracts = useMemo(() => {
    if (!signer) return null;

    return {
      ydToken: new Contract(CONTRACT_ADDRESSES.YDToken, YD_TOKEN_ABI, signer),
      courseManager: new Contract(CONTRACT_ADDRESSES.CourseManager, COURSE_MANAGER_ABI, signer),
      staking: new Contract(CONTRACT_ADDRESSES.SimpleStaking, STAKING_ABI, signer),
    };
  }, [signer]);

  // YD Token 相关操作
  const tokenOperations = {
    // 获取YD余额
    getBalance: async (address: string): Promise<string> => {
      if (!contracts) throw new Error('Contracts not initialized');
      const balance = await contracts.ydToken.balanceOf(address);
      return formatEther(balance);
    },

    // 授权代币
    approve: async (spender: string, amount: string): Promise<string> => {
      if (!contracts) throw new Error('Contracts not initialized');
      setLoading(true);
      try {
        const tx = await contracts.ydToken.approve(spender, parseEther(amount));
        await tx.wait();
        return tx.hash;
      } finally {
        setLoading(false);
      }
    },

    // 检查授权额度
    getAllowance: async (owner: string, spender: string): Promise<string> => {
      if (!contracts) throw new Error('Contracts not initialized');
      const allowance = await contracts.ydToken.allowance(owner, spender);
      return formatEther(allowance);
    },
  };

  // 课程相关操作
  const courseOperations = {
    // 创建课程
    createCourse: async (title: string, description: string, price: string): Promise<{ courseId: number; txHash: string }> => {
      if (!contracts) throw new Error('Contracts not initialized');
      setLoading(true);
      try {
        const tx = await contracts.courseManager.createCourse(title, description, parseEther(price));
        const receipt = await tx.wait();

        // 从事件中获取课程ID
        const event = receipt.logs?.find((log) => log.fragment?.name === 'CourseCreated');
        const courseId = event ? Number(event.args?.courseId) : 0;

        return { courseId, txHash: tx.hash };
      } finally {
        setLoading(false);
      }
    },

    // 购买课程
    purchaseCourse: async (courseId: number): Promise<string> => {
      if (!contracts) throw new Error('Contracts not initialized');
      setLoading(true);
      try {
        const tx = await contracts.courseManager.purchaseCourse(courseId);
        await tx.wait();
        return tx.hash;
      } finally {
        setLoading(false);
      }
    },

    // 检查是否已购买
    hasPurchased: async (userAddress: string, courseId: number): Promise<boolean> => {
      if (!contracts) throw new Error('Contracts not initialized');
      return await contracts.courseManager.hasPurchased(userAddress, courseId);
    },

    // 获取课程总数
    getTotalCourses: async (): Promise<number> => {
      if (!contracts) throw new Error('Contracts not initialized');
      const total = await contracts.courseManager.getTotalCourses();
      return Number(total);
    },
  };

  // 质押相关操作
  const stakingOperations = {
    // 质押代币
    stake: async (amount: string): Promise<string> => {
      if (!contracts) throw new Error('Contracts not initialized');
      setLoading(true);
      try {
        const tx = await contracts.staking.stake(parseEther(amount));
        await tx.wait();
        return tx.hash;
      } finally {
        setLoading(false);
      }
    },

    // 取消质押
    unstake: async (): Promise<string> => {
      if (!contracts) throw new Error('Contracts not initialized');
      setLoading(true);
      try {
        const tx = await contracts.staking.unstake();
        await tx.wait();
        return tx.hash;
      } finally {
        setLoading(false);
      }
    },

    // 获取质押信息
    getStakeInfo: async (userAddress: string) => {
      if (!contracts) throw new Error('Contracts not initialized');
      const info = await contracts.staking.getStakeInfo(userAddress);
      return {
        stakedAmount: formatEther(info.amount),
        stakeTime: new Date(Number(info.stakeTime) * 1000),
        pendingReward: formatEther(info.pendingReward),
      };
    },
  };

  return {
    contracts,
    loading,
    isConnected,
    tokenOperations,
    courseOperations,
    stakingOperations,
  };
};