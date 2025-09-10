import { useState, useMemo } from "react";
import { Contract, formatEther, parseEther } from "ethers";
import { useWallet } from "./useWallet";

// 导入合约ABI
import YDTokenABI from "../abis/YDToken.json";
import CourseManagerABI from "../abis/CourseManager.json";
import SimpleStakingABI from "../abis/SimpleStaking.json";

// 合约地址配置
const CONTRACT_ADDRESSES = {
  YDToken: "0x752250B9471b77e85c3DE330db8a5d7802Eb87d7",
  CourseManager: "0xCb4A483c8F1F84BF0128a7081c0d4FC4A2607EE7",
  SimpleStaking: "0xf5924164C4685f650948bf4a51124f0CB24DA026",
} as const;

export const useContracts = () => {
  const { signer, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);

  // 创建合约实例
  const contracts = useMemo(() => {
    if (!signer) return null;

    return {
      ydToken: new Contract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi, signer),
      courseManager: new Contract(
        CONTRACT_ADDRESSES.CourseManager,
        CourseManagerABI.abi,
        signer
      ),
      staking: new Contract(
        CONTRACT_ADDRESSES.SimpleStaking,
        SimpleStakingABI.abi,
        signer
      ),
    };
  }, [signer]);

  // 通用交易执行函数
  const executeTransaction = async <T>(
    operation: () => Promise<T>,
    errorMessage: string = "交易执行失败"
  ): Promise<T> => {
    if (!contracts) throw new Error("合约未初始化");
    setLoading(true);
    try {
      return await operation();
    } catch (error) {
      console.error(errorMessage, error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // YD Token 操作
  const tokenOperations = {
    // 获取余额
    getBalance: async (address: string): Promise<string> => {
      if (!contracts) throw new Error("合约未初始化");
      const balance = await contracts.ydToken.balanceOf(address);
      return formatEther(balance);
    },

    // 授权代币
    approve: async (spender: string, amount: string): Promise<string> => {
      return executeTransaction(async () => {
        const tx = await contracts!.ydToken.approve(
          spender,
          parseEther(amount)
        );
        await tx.wait();
        return tx.hash;
      }, "代币授权失败");
    },

    // 检查授权额度
    getAllowance: async (owner: string, spender: string): Promise<string> => {
      if (!contracts) throw new Error("合约未初始化");
      const allowance = await contracts.ydToken.allowance(owner, spender);
      return formatEther(allowance);
    },
  };

  // 课程操作
  const courseOperations = {
    // 创建课程
    createCourse: async (
      title: string,
      description: string,
      price: string
    ): Promise<{ courseId: number; txHash: string }> => {
      return executeTransaction(async () => {
        const tx = await contracts!.courseManager.createCourse(
          title,
          description,
          parseEther(price)
        );
        const receipt = await tx.wait();

        // 解析事件获取课程ID
        const courseCreatedEvent = receipt.logs?.find(
          (log: any) => log.fragment?.name === "CourseCreated"
        );
        const courseId = courseCreatedEvent
          ? Number(courseCreatedEvent.args?.courseId)
          : 0;

        return { courseId, txHash: tx.hash };
      }, "课程创建失败");
    },

    // 购买课程
    purchaseCourse: async (courseId: number): Promise<string> => {
      return executeTransaction(async () => {
        const tx = await contracts!.courseManager.purchaseCourse(courseId);
        await tx.wait();
        return tx.hash;
      }, "课程购买失败");
    },

    // 检查购买状态
    hasPurchased: async (
      userAddress: string,
      courseId: number
    ): Promise<boolean> => {
      if (!contracts) throw new Error("合约未初始化");
      return await contracts.courseManager.hasPurchased(userAddress, courseId);
    },

    // 获取课程总数
    getTotalCourses: async (): Promise<number> => {
      if (!contracts) throw new Error("合约未初始化");
      const total = await contracts.courseManager.getTotalCourses();
      return Number(total);
    },

    // 获取单个课程信息
    getCourse: async (courseId: number) => {
      if (!contracts) throw new Error("合约未初始化");
      return await contracts.courseManager.getCourse(courseId);
    },

    // 分页获取课程列表
    getCoursesPaginated: async (offset: number, limit: number) => {
      if (!contracts) throw new Error("合约未初始化");
      return await contracts.courseManager.getCoursesPaginated(offset, limit);
    },
  };

  // 质押操作
  const stakingOperations = {
    // 质押代币
    stake: async (amount: string): Promise<string> => {
      return executeTransaction(async () => {
        const tx = await contracts!.staking.stake(parseEther(amount));
        await tx.wait();
        return tx.hash;
      }, "质押失败");
    },

    // 取消质押
    unstake: async (): Promise<string> => {
      return executeTransaction(async () => {
        const tx = await contracts!.staking.unstake();
        await tx.wait();
        return tx.hash;
      }, "取消质押失败");
    },

    // 获取质押信息
    getStakeInfo: async (userAddress: string) => {
      if (!contracts) throw new Error("合约未初始化");
      const info = await contracts.staking.getStakeInfo(userAddress);
      return {
        stakedAmount: formatEther(info.amount),
        stakeTime: new Date(Number(info.stakeTime) * 1000),
        pendingReward: formatEther(info.pendingReward),
      };
    },

    // 计算收益
    calculateReward: async (userAddress: string): Promise<string> => {
      if (!contracts) throw new Error("合约未初始化");
      const reward = await contracts.staking.calculateReward(userAddress);
      return formatEther(reward);
    },

    // 获取总质押量
    getTotalStaked: async (): Promise<string> => {
      if (!contracts) throw new Error("合约未初始化");
      const total = await contracts.staking.getTotalStaked();
      return formatEther(total);
    },
  };

  return {
    // 状态
    contracts,
    loading,
    isConnected,

    // 合约地址（导出供其他地方使用）
    addresses: CONTRACT_ADDRESSES,

    // 操作方法
    tokenOperations,
    courseOperations,
    stakingOperations,
  };
};
