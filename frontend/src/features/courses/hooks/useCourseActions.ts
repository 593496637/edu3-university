import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { courseService } from '../../../services/courseService';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../store/authStore';
import { CONTRACT_ADDRESSES } from '../../../config/constants';
import type { Course } from '../types';

export const useCourseActions = () => {
  const [loading, setLoading] = useState(false);
  const [approvedCourses, setApprovedCourses] = useState<Set<number>>(new Set());
  
  const { account, isConnected, isCorrectNetwork, balance } = useAuthStore();
  const isReady = isConnected && isCorrectNetwork && account;

  const handleApprove = useCallback(async (course: Course, onSuccess?: () => void) => {
    if (!account || !isReady) {
      alert('请先连接钱包并切换到正确网络');
      return;
    }

    try {
      setLoading(true);
      const priceStr = course.price;
      const currentAllowance = await courseService.getAllowance(account, CONTRACT_ADDRESSES.CourseManager);
      
      if (parseFloat(currentAllowance) >= parseFloat(priceStr)) {
        setApprovedCourses(prev => new Set(prev).add(course.id));
        alert('已经授权足够的金额');
        return;
      }

      await courseService.approveTokens(CONTRACT_ADDRESSES.CourseManager, priceStr);
      setApprovedCourses(prev => new Set(prev).add(course.id));
      alert('授权成功！现在可以购买课程了');
      onSuccess?.();
    } catch (error) {
      console.error('授权失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`授权失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [account, isReady]);

  const handlePurchase = useCallback(async (
    course: Course, 
    onSuccess?: () => void
  ) => {
    if (!account || !isReady) {
      alert('请先连接钱包并切换到正确网络');
      return;
    }

    try {
      setLoading(true);
      
      const hasPurchasedOnChain = await courseService.hasPurchased(account, course.id);
      if (hasPurchasedOnChain) {
        alert('您已经购买过这个课程了！');
        onSuccess?.();
        return;
      }

      const priceStr = course.price;
      if (parseFloat(balance) < parseFloat(priceStr)) {
        alert('YD 代币余额不足');
        return;
      }

      if (!approvedCourses.has(course.id)) {
        alert('请先点击 Approve 按钮进行授权');
        return;
      }

      await courseService.purchaseCourse(course.id, account);
      alert('购买成功！');
      onSuccess?.();
    } catch (error) {
      console.error('购买失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      if (errorMessage.includes('Already purchased') || errorMessage.includes('已购买')) {
        alert('检测到您已购买此课程！');
        onSuccess?.();
      } else if (errorMessage.includes('Cannot purchase your own course') || errorMessage.includes('own course')) {
        alert('💡 不能购买自己创建的课程\n\n作为课程创建者，您已经拥有此课程的所有权限。\n请切换到其他钱包地址来测试购买功能。');
      } else {
        alert(`购买失败: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [account, isReady, balance, approvedCourses]);

  const handleStartLearning = useCallback(async (
    course: Course,
    onSuccess?: (courseWithContent: Course) => void
  ) => {
    if (!account || !window.ethereum) {
      alert('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let result;
      
      if (!authService.isLoggedIn()) {
        result = await authService.loginAndAccessCourse(course.id, account, signer);
      } else {
        result = await authService.accessCourseWithCache(course.id, account, signer);
      }
      
      if (result.success) {
        const courseWithContent = {
          ...course,
          courseContent: result.data.content
        };
        onSuccess?.(courseWithContent);
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
      setLoading(false);
    }
  }, [account]);

  const loadUserAllowances = useCallback(async (courses: Course[]) => {
    if (!account || !isReady || courses.length === 0) return;
    
    try {
      const allowance = await courseService.getAllowance(account, CONTRACT_ADDRESSES.CourseManager);
      const approved = new Set<number>();
      
      courses.forEach(course => {
        if (parseFloat(allowance) >= parseFloat(course.price)) {
          approved.add(course.id);
        }
      });
      
      setApprovedCourses(approved);
    } catch (error) {
      console.error('加载用户授权数据失败:', error);
    }
  }, [account, isReady]);

  return {
    loading,
    approvedCourses,
    handleApprove,
    handlePurchase,
    handleStartLearning,
    loadUserAllowances
  };
};