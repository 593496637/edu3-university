import { useState, useEffect, useCallback } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { useContracts } from './useContracts';
import { authService } from '../services/authService';
import { ethers } from 'ethers';

interface Course {
  id: number;
  title: string;
  description: string;
  price: string;
  instructor: string;
  isActive: boolean;
  createdAt: number;
  category?: string;
  coverImageUrl?: string;
  hasPurchased?: boolean;
  courseContent?: {
    lessons: Array<{
      id: number;
      title: string;
      videoUrl?: string;
      duration?: string;
    }>;
    resources?: Array<{
      name: string;
      url: string;
    }>;
  };
}

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [purchasedCourses, setPurchasedCourses] = useState<Set<number>>(new Set());
  const [approvedCourses, setApprovedCourses] = useState<Set<number>>(new Set());
  const [userBalance, setUserBalance] = useState('0');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { isConnected, account } = useWalletContext();
  const { tokenOperations, courseOperations, loading, isReady, CONTRACT_ADDRESSES } = useContracts();

  // 加载课程数据
  const loadCourses = useCallback(async () => {
    if (!isReady) return;
    
    try {
      setCoursesLoading(true);
      
      let url = 'http://localhost:3001/api/courses';
      if (authService.isLoggedIn()) {
        url += `?sessionToken=${authService.getSessionToken()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data.courses) {
        const coursesData = data.data.courses.map((apiCourse: any) => ({
          id: apiCourse.courseId,
          title: apiCourse.title || `课程 #${apiCourse.courseId}`,
          description: apiCourse.description || `分类: ${apiCourse.category}`,
          price: apiCourse.price ? apiCourse.price.toString() : "0",
          instructor: apiCourse.instructorAddress || "0x0000",
          isActive: true,
          createdAt: new Date(apiCourse.createdAt).getTime() / 1000,
          category: apiCourse.category,
          coverImageUrl: apiCourse.coverImageUrl,
          hasPurchased: apiCourse.hasPurchased || false
        }));
        setCourses(coursesData);
        
        const purchased = new Set<number>();
        coursesData.forEach((course: Course) => {
          if (course.hasPurchased) {
            purchased.add(course.id);
          }
        });
        setPurchasedCourses(purchased);
      }
    } catch (error) {
      console.error('加载课程失败:', error);
    } finally {
      setCoursesLoading(false);
    }
  }, [isReady]);

  // 加载用户数据
  const loadUserData = useCallback(async () => {
    if (!account || !isReady) return;
    
    try {
      const balance = await tokenOperations.getBalance(account);
      setUserBalance(balance);
      
      const purchased = new Set<number>();
      const approved = new Set<number>();
      
      const allowance = await tokenOperations.getAllowance(account, CONTRACT_ADDRESSES.CourseManager);
      
      for (const course of courses) {
        const hasPurchased = await courseOperations.hasPurchased(account, course.id);
        if (hasPurchased) {
          purchased.add(course.id);
        }
        
        if (parseFloat(allowance) >= parseFloat(course.price)) {
          approved.add(course.id);
        }
      }
      
      setPurchasedCourses(purchased);
      setApprovedCourses(approved);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  }, [account, isReady, courses, tokenOperations, courseOperations, CONTRACT_ADDRESSES]);

  // 处理用户登录
  const handleLogin = useCallback(async () => {
    if (!account || !window.ethereum) {
      alert('请先连接钱包');
      return;
    }

    try {
      setIsLoggingIn(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const result = await authService.login(account, signer);
      
      if (result.success) {
        setIsLoggedIn(true);
        alert('登录成功！');
        loadCourses();
      } else {
        alert('登录失败: ' + result.error);
      }
    } catch (error) {
      console.error('登录失败:', error);
      alert('登录失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoggingIn(false);
    }
  }, [account, loadCourses]);

  // 处理用户登出
  const handleLogout = useCallback(async () => {
    await authService.logout();
    setIsLoggedIn(false);
    loadCourses();
  }, [loadCourses]);

  // 处理授权
  const handleApprove = useCallback(async (course: Course, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    
    if (!account || !isReady) {
      alert('请先连接钱包并切换到正确网络');
      return;
    }

    if (course.hasPurchased || purchasedCourses.has(course.id)) {
      alert('您已经购买过这个课程了，无需授权');
      return;
    }

    try {
      const priceStr = course.price;
      const currentAllowance = await tokenOperations.getAllowance(account, CONTRACT_ADDRESSES.CourseManager);
      
      if (parseFloat(currentAllowance) >= parseFloat(priceStr)) {
        setApprovedCourses(prev => new Set(prev).add(course.id));
        alert('已经授权足够的金额');
        return;
      }

      await tokenOperations.approve(CONTRACT_ADDRESSES.CourseManager, priceStr);
      setApprovedCourses(prev => new Set(prev).add(course.id));
      alert('授权成功！现在可以购买课程了');
    } catch (error) {
      console.error('授权失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`授权失败: ${errorMessage}`);
    }
  }, [account, isReady, purchasedCourses, tokenOperations, CONTRACT_ADDRESSES]);

  // 处理购买
  const handlePurchase = useCallback(async (course: Course, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    
    if (!account || !isReady) {
      alert('请先连接钱包并切换到正确网络');
      return;
    }

    try {
      const hasPurchasedOnChain = await courseOperations.hasPurchased(account, course.id);
      if (hasPurchasedOnChain) {
        alert('您已经购买过这个课程了！正在更新状态...');
        setPurchasedCourses(prev => new Set(prev).add(course.id));
        loadUserData();
        loadCourses();
        return;
      }
    } catch (error) {
      console.error('检查购买状态失败:', error);
    }

    if (purchasedCourses.has(course.id) || course.hasPurchased) {
      alert('您已经购买过这个课程了');
      return;
    }

    const priceStr = course.price;
    
    if (parseFloat(userBalance) < parseFloat(priceStr)) {
      alert('YD 代币余额不足');
      return;
    }

    try {
      if (!approvedCourses.has(course.id)) {
        alert('请先点击 Approve 按钮进行授权');
        return;
      }

      await courseOperations.purchaseCourse(course.id);
      alert('购买成功！');
      
      setPurchasedCourses(prev => new Set(prev).add(course.id));
      loadUserData();
      loadCourses();
    } catch (error) {
      console.error('购买失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      if (errorMessage.includes('Already purchased') || errorMessage.includes('已购买')) {
        alert('检测到您已购买此课程！正在同步状态...');
        setPurchasedCourses(prev => new Set(prev).add(course.id));
        loadUserData();
        loadCourses();
      } else if (errorMessage.includes('Cannot purchase your own course') || errorMessage.includes('own course')) {
        alert('💡 不能购买自己创建的课程\n\n作为课程创建者，您已经拥有此课程的所有权限。\n请切换到其他钱包地址来测试购买功能。');
      } else {
        alert(`购买失败: ${errorMessage}`);
      }
    }
  }, [account, isReady, purchasedCourses, userBalance, approvedCourses, courseOperations, loadUserData, loadCourses]);

  // 处理开始学习
  const handleStartLearning = useCallback(async (course: Course) => {
    if (!account || !window.ethereum) {
      alert('请先连接钱包');
      return;
    }

    try {
      setIsLoggingIn(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let result;
      
      if (!authService.isLoggedIn()) {
        result = await authService.loginAndAccessCourse(course.id, account, signer);
        if (result.success) {
          setIsLoggedIn(true);
          loadCourses();
        }
      } else {
        result = await authService.accessCourseWithCache(course.id, account, signer);
      }
      
      if (result.success) {
        setSelectedCourse({
          ...course,
          courseContent: result.data.content
        });
      } else {
        if (result.needsNewSignature) {
          alert('签名已过期，请重新尝试');
        } else {
          alert('访问失败: ' + result.error);
        }
      }
    } catch (error) {
      console.error('开始学习失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      if (errorMessage.includes('您尚未购买此课程')) {
        alert('您尚未购买此课程，请先购买');
      } else {
        alert('开始学习失败: ' + errorMessage);
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [account, loadCourses]);

  // 检查登录状态
  const checkLoginStatus = useCallback(async () => {
    if (authService.isLoggedIn()) {
      const isValid = await authService.verifySession();
      setIsLoggedIn(isValid);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    if (isReady) {
      checkLoginStatus();
      loadCourses();
    }
  }, [isReady, account, checkLoginStatus, loadCourses]);

  useEffect(() => {
    if (isReady && courses.length > 0) {
      loadUserData();
    }
  }, [isReady, account, courses.length, loadUserData]);

  useEffect(() => {
    if (isReady) {
      loadCourses();
    }
  }, [isLoggedIn, isReady, loadCourses]);

  return {
    // State
    courses,
    coursesLoading,
    selectedCourse,
    purchasedCourses,
    approvedCourses,
    userBalance,
    isLoggedIn,
    isLoggingIn,
    loading,
    
    // Actions
    setSelectedCourse,
    handleLogin,
    handleLogout,
    handleApprove,
    handlePurchase,
    handleStartLearning,
    loadCourses,
    loadUserData
  };
};