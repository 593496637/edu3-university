import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWalletContext } from '../context/WalletContext';
import { courseApi, purchaseApi } from '../services/api';

// 导入 ABI
import YDTokenABI from '../../abis/YDToken.json';
import CourseManagerABI from '../../abis/CourseManager.json';
import SimpleStakingABI from '../../abis/SimpleStaking.json';

// 合约地址
const CONTRACT_ADDRESSES = {
  YDToken: '0x752250B9471b77e85c3DE330db8a5d7802Eb87d7',
  CourseManager: '0xCb4A483c8F1F84BF0128a7081c0d4FC4A2607EE7',
  SimpleStaking: '0xf5924164C4685f650948bf4a51124f0CB24DA026'
};

export function useContracts() {
  const { account, isConnected, isCorrectNetwork } = useWalletContext();
  const [loading, setLoading] = useState(false);

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

  // YDToken 相关操作
  const tokenOperations = {
    // 获取余额
    getBalance: async (userAddress: string): Promise<string> => {
      try {
        const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
        const balance = await contract.balanceOf(userAddress);
        return ethers.formatEther(balance);
      } catch (error) {
        console.error('获取余额失败:', error);
        throw error;
      }
    },

    // 授权操作
    approve: async (spenderAddress: string, amount: string): Promise<string> => {
      try {
        setLoading(true);
        const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
        const amountWei = ethers.parseEther(amount);
        
        const tx = await contract.approve(spenderAddress, amountWei);
        await tx.wait();
        
        return tx.hash;
      } catch (error) {
        console.error('授权失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // 检查授权额度
    getAllowance: async (ownerAddress: string, spenderAddress: string): Promise<string> => {
      try {
        const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
        const allowance = await contract.allowance(ownerAddress, spenderAddress);
        return ethers.formatEther(allowance);
      } catch (error) {
        console.error('获取授权额度失败:', error);
        throw error;
      }
    },

    // 铸造代币给自己
    mint: async (toAddress: string, amount: string): Promise<string> => {
      try {
        setLoading(true);
        const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
        const amountWei = ethers.parseEther(amount);
        
        const tx = await contract.mint(toAddress, amountWei);
        await tx.wait();
        
        return tx.hash;
      } catch (error) {
        console.error('铸造代币失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // Owner 给指定地址发代币
    mintToAddress: async (recipientAddress: string, amount: string): Promise<string> => {
      try {
        setLoading(true);
        const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
        const amountWei = ethers.parseEther(amount);
        
        const tx = await contract.mint(recipientAddress, amountWei);
        await tx.wait();
        
        return tx.hash;
      } catch (error) {
        console.error('给用户发放代币失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // 获取合约 owner 地址
    getOwner: async (): Promise<string> => {
      try {
        const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
        return await contract.owner();
      } catch (error) {
        console.error('获取 owner 失败:', error);
        throw error;
      }
    },

    // Owner专用：为用户mint兑换的YD代币
    mintExchangeTokens: async (userAddress: string, ydAmount: number): Promise<string> => {
      try {
        setLoading(true);
        const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
        const amountWei = ethers.parseEther(ydAmount.toString());
        
        const tx = await contract.mint(userAddress, amountWei);
        await tx.wait();
        
        return tx.hash;
      } catch (error) {
        console.error('mint兑换代币失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // ETH 兑换 YD - 动态获取 owner 地址
    exchangeETHForYD: async (ethAmountStr: string): Promise<{ ethTxHash: string; ydAmount: number; ownerAddress: string; mintTxHash?: string }> => {
      try {
        setLoading(true);
        
        const ethAmount = parseFloat(ethAmountStr);
        const ydAmount = ethAmount * 1000; // 1 ETH = 1000 YD
        
        // 获取合约 owner 地址
        const ownerAddress = await tokenOperations.getOwner();
        
        // 检查当前用户是否是 owner
        if (account?.toLowerCase() === ownerAddress.toLowerCase()) {
          // 如果是 owner，直接 mint 代币给自己
          const contract = await getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
          const amountWei = ethers.parseEther(ydAmount.toString());
          
          const tx = await contract.mint(account, amountWei);
          await tx.wait();
          
          return {
            ethTxHash: tx.hash,
            ydAmount: ydAmount,
            ownerAddress: ownerAddress
          };
        } else {
          // 如果不是 owner，先发送 ETH 到 owner 地址
          const signer = await getSigner();
          
          const ethTx = await signer.sendTransaction({
            to: ownerAddress,
            value: ethers.parseEther(ethAmountStr),
            data: ethers.hexlify(ethers.toUtf8Bytes(`YD_EXCHANGE:${account}:${ydAmount}`))
          });
          
          await ethTx.wait();
          
          // ETH支付成功，提示用户等待owner处理
          return {
            ethTxHash: ethTx.hash,
            ydAmount: ydAmount,
            ownerAddress: ownerAddress
          };
        }
      } catch (error) {
        console.error('ETH 兑换失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    }
  };

  // CourseManager 相关操作
  const courseOperations = {
    // 创建课程
    createCourse: async (title: string, description: string, price: string) => {
      try {
        setLoading(true);
        const contract = await getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
        const priceWei = ethers.parseEther(price);
        
        // 调用智能合约创建课程
        const tx = await contract.createCourse(title, description, priceWei);
        const receipt = await tx.wait();
        
        // 从事件中获取课程ID
        const courseCreatedEvent = receipt.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed && parsed.name === 'CourseCreated';
          } catch {
            return false;
          }
        });
        
        let courseId = null;
        if (courseCreatedEvent) {
          const parsed = contract.interface.parseLog(courseCreatedEvent);
          if (parsed) {
            courseId = parsed.args.courseId.toString();
          }
        }

        // 同步到后端数据库
        if (courseId && account) {
          try {
            await courseApi.createCourse({
              courseId: courseId,
              title,
              description,
              price,
              instructorAddress: account,
              txHash: tx.hash
            });
            console.log('课程已同步到后端数据库');
          } catch (apiError) {
            console.warn('同步到后端失败，但区块链创建成功:', apiError);
          }
        }
        
        return { courseId, txHash: tx.hash };
      } catch (error) {
        console.error('创建课程失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // 购买课程
    purchaseCourse: async (courseId: number): Promise<string> => {
      try {
        setLoading(true);
        const contract = await getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
        
        // 获取课程价格
        const course = await contract.courses(courseId);
        const priceInEther = ethers.formatEther(course.price);
        
        // 调用智能合约购买课程
        const tx = await contract.purchaseCourse(courseId);
        await tx.wait();

        // 同步购买记录到后端数据库
        if (account) {
          try {
            await purchaseApi.recordPurchase({
              userAddress: account,
              courseId: courseId.toString(),
              txHash: tx.hash,
              pricePaid: priceInEther
            });
            console.log('购买记录已同步到后端数据库');
          } catch (apiError) {
            console.warn('同步购买记录到后端失败，但区块链购买成功:', apiError);
          }
        }
        
        return tx.hash;
      } catch (error) {
        console.error('购买课程失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // 检查是否已购买课程
    hasPurchased: async (userAddress: string, courseId: number): Promise<boolean> => {
      try {
        const contract = await getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
        return await contract.hasPurchased(userAddress, courseId);
      } catch (error) {
        console.error('检查购买状态失败:', error);
        return false;
      }
    },

    // 获取课程信息
    getCourse: async (courseId: number) => {
      try {
        const contract = await getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
        const course = await contract.courses(courseId);
        return {
          id: courseId,
          instructor: course.instructor,
          title: course.title,
          description: course.description,
          price: ethers.formatEther(course.price),
          isActive: course.active,
          createdAt: Number(course.createdAt)
        };
      } catch (error) {
        console.error('获取课程信息失败:', error);
        throw error;
      }
    },

    // 获取所有课程（从区块链）
    getAllCourses: async () => {
      try {
        const contract = await getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
        const totalCourses = await contract.getTotalCourses();
        const courseCount = Number(totalCourses);
        
        const courses = [];
        for (let i = 1; i <= courseCount; i++) {
          try {
            const course = await contract.courses(i);
            if (course.instructor !== '0x0000000000000000000000000000000000000000') {
              courses.push({
                id: i,
                instructor: course.instructor,
                title: course.title,
                description: course.description,
                price: ethers.formatEther(course.price),
                isActive: course.active,
                createdAt: Number(course.createdAt)
              });
            }
          } catch (error) {
            console.error(`获取课程 ${i} 失败:`, error);
          }
        }
        
        return courses;
      } catch (error) {
        console.error('获取所有课程失败:', error);
        return [];
      }
    },

    // 从后端API获取课程列表（优先使用这个，因为包含数据库信息）
    getCoursesFromAPI: async () => {
      try {
        const response = await courseApi.getCourses(1, 50); // 获取前50个课程
        if (response.success && response.data) {
          return response.data.courses.map((course: any) => ({
            id: parseInt(course.course_id),
            instructor: course.instructor_address,
            title: course.title,
            description: course.description,
            price: course.price_yd,
            isActive: true, // 数据库中的课程默认为活跃状态
            createdAt: new Date(course.created_at).getTime() / 1000
          }));
        }
        return [];
      } catch (error) {
        console.error('从API获取课程失败:', error);
        // 如果API失败，降级到区块链获取
        return await courseOperations.getAllCourses();
      }
    }
  };

  // SimpleStaking 相关操作
  const stakingOperations = {
    // 质押代币
    stake: async (amount: string): Promise<string> => {
      try {
        setLoading(true);
        const contract = await getContract(CONTRACT_ADDRESSES.SimpleStaking, SimpleStakingABI.abi);
        const amountWei = ethers.parseEther(amount);
        
        const tx = await contract.stake(amountWei);
        await tx.wait();
        
        return tx.hash;
      } catch (error) {
        console.error('质押失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // 取消质押
    unstake: async (): Promise<string> => {
      try {
        setLoading(true);
        const contract = await getContract(CONTRACT_ADDRESSES.SimpleStaking, SimpleStakingABI.abi);
        
        const tx = await contract.unstake();
        await tx.wait();
        
        return tx.hash;
      } catch (error) {
        console.error('取消质押失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // 获取质押信息
    getStakeInfo: async (userAddress: string) => {
      try {
        const contract = await getContract(CONTRACT_ADDRESSES.SimpleStaking, SimpleStakingABI.abi);
        const stakeInfo = await contract.stakes(userAddress);
        
        return {
          amount: ethers.formatEther(stakeInfo.amount),
          startTime: Number(stakeInfo.startTime),
          isActive: stakeInfo.isActive
        };
      } catch (error) {
        console.error('获取质押信息失败:', error);
        throw error;
      }
    },

    // 计算收益
    calculateReward: async (userAddress: string): Promise<string> => {
      try {
        const contract = await getContract(CONTRACT_ADDRESSES.SimpleStaking, SimpleStakingABI.abi);
        const reward = await contract.calculateReward(userAddress);
        return ethers.formatEther(reward);
      } catch (error) {
        console.error('计算收益失败:', error);
        return '0';
      }
    }
  };

  return {
    loading,
    tokenOperations,
    courseOperations,
    stakingOperations,
    isReady: isConnected && isCorrectNetwork && account,
    CONTRACT_ADDRESSES
  };
}