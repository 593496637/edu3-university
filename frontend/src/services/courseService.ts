import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@config/constants';
import { courseApi, purchaseApi } from './api';
import type {
  CourseData,
  ApiCourseData,
  ApiResponse,
  CreateCourseResult,
  RecordPurchaseRequest,
  ContractInterface,
} from '@/types/contracts';

import YDTokenABI from '@abis/YDToken.json';
import CourseManagerABI from '@abis/CourseManager.json';

export class CourseService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  private getProvider(): ethers.BrowserProvider {
    if (!window.ethereum) throw new Error('请安装 MetaMask');
    if (!this.provider) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
    return this.provider;
  }

  private async getSigner(): Promise<ethers.Signer> {
    if (!this.signer) {
      const provider = this.getProvider();
      this.signer = await provider.getSigner();
    }
    return this.signer;
  }

  private async getContract(address: string, abi: ethers.InterfaceAbi): Promise<ethers.Contract> {
    const signer = await this.getSigner();
    return new ethers.Contract(address, abi, signer);
  }

  async getCoursesFromAPI(): Promise<CourseData[]> {
    try {
      const response = await courseApi.getCourses(1, 50) as ApiResponse;
      if (response.success && response.data && response.data.courses) {
        return response.data.courses.map((course: ApiCourseData): CourseData => ({
          id: parseInt(course.courseId),
          instructor: course.instructorAddress,
          title: course.title,
          description: course.description,
          price: course.price,
          isActive: true,
          createdAt: new Date(course.createdAt).getTime() / 1000
        }));
      }
      return [];
    } catch (error) {
      console.error('从API获取课程失败:', error);
      return this.getCoursesFromContract();
    }
  }

  async getCoursesFromContract(): Promise<CourseData[]> {
    try {
      const contract = await this.getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
      const totalCourses = await contract.getTotalCourses();
      const courseCount = Number(totalCourses);
      
      console.log('合约中总课程数:', courseCount);
      
      if (courseCount === 0) {
        console.log('合约中没有课程');
        return [];
      }
      
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
      
      console.log('从合约获取到有效课程:', courses.length);
      return courses;
    } catch (error) {
      console.error('获取所有课程失败:', error);
      return [];
    }
  }

  async createCourse(
    title: string, 
    description: string, 
    price: string, 
    instructorAddress: string,
    options?: {
      category?: string;
      coverImageUrl?: string;
    }
  ): Promise<CreateCourseResult> {
    const contract = await this.getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
    const priceWei = ethers.parseEther(price);
    
    const tx = await contract.createCourse(title, description, priceWei);
    const receipt = await tx.wait();
    
    const courseCreatedEvent = receipt.logs.find((log: ethers.Log) => {
      try {
        const parsed = (contract.interface as ContractInterface).parseLog(log);
        return parsed && parsed.name === 'CourseCreated';
      } catch {
        return false;
      }
    });
    
    let courseId = null;
    if (courseCreatedEvent) {
      const parsed = (contract.interface as ContractInterface).parseLog(courseCreatedEvent);
      if (parsed) {
        courseId = parsed.args.courseId.toString();
      }
    }

    if (courseId) {
      try {
        await courseApi.createCourse({
          courseId: courseId,
          title,
          description,
          price,
          instructorAddress,
          category: options?.category || 'Web3',
          coverImageUrl: options?.coverImageUrl || '',
          txHash: tx.hash
        });
      } catch (apiError) {
        console.warn('同步到后端失败，但区块链创建成功:', apiError);
      }
    }
    
    return { courseId, txHash: tx.hash } as CreateCourseResult;
  }

  async purchaseCourse(courseId: number, userAddress: string): Promise<string> {
    const contract = await this.getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
    
    const course = await contract.courses(courseId);
    const priceInEther = ethers.formatEther(course.price);
    
    const tx = await contract.purchaseCourse(courseId);
    await tx.wait();

    try {
      await purchaseApi.recordPurchase({
        userAddress,
        courseId: courseId.toString(),
        txHash: tx.hash,
        pricePaid: priceInEther
      } as RecordPurchaseRequest);
    } catch (apiError) {
      console.warn('同步购买记录到后端失败，但区块链购买成功:', apiError);
    }
    
    return tx.hash;
  }

  async hasPurchased(userAddress: string, courseId: number): Promise<boolean> {
    try {
      console.log(`检查购买状态: 用户 ${userAddress} 课程 ${courseId}`);
      const contract = await this.getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
      const result = await contract.hasPurchased(userAddress, courseId);
      console.log(`购买状态结果: ${result}`);
      return result;
    } catch (error) {
      console.error('检查购买状态失败:', error);
      return false;
    }
  }

  async getCourse(courseId: number): Promise<CourseData> {
    const contract = await this.getContract(CONTRACT_ADDRESSES.CourseManager, CourseManagerABI.abi);
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
  }

  async approveTokens(spenderAddress: string, amount: string): Promise<string> {
    const contract = await this.getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
    const amountWei = ethers.parseEther(amount);
    
    const tx = await contract.approve(spenderAddress, amountWei);
    await tx.wait();
    
    return tx.hash;
  }

  async getAllowance(ownerAddress: string, spenderAddress: string): Promise<string> {
    try {
      const contract = await this.getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
      const allowance = await contract.allowance(ownerAddress, spenderAddress);
      return ethers.formatEther(allowance);
    } catch (error) {
      console.error('获取授权额度失败:', error);
      throw error;
    }
  }

  async getBalance(userAddress: string): Promise<string> {
    try {
      const contract = await this.getContract(CONTRACT_ADDRESSES.YDToken, YDTokenABI.abi);
      const balance = await contract.balanceOf(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('获取余额失败:', error);
      throw error;
    }
  }
}

export const courseService = new CourseService();