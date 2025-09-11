import { useState, useEffect } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { useContracts } from '../hooks/useContracts';
import CreateCourseModal from '../components/CreateCourseModal';
import CourseManagementModal from '../components/CourseManagementModal';
import { testApi } from '../services/api';
import { authService } from '../services/authService';
import { ethers } from 'ethers';

interface CourseAccessMessage {
  message: string;
  timestamp: number;
  courseId: number;
  userAddress: string;
  expiresAt: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  price: string;
  instructor: string;
  isActive: boolean;
  createdAt: number;
  // 数据库字段
  category?: string;
  coverImageUrl?: string;
  // API返回的购买状态
  hasPurchased?: boolean;
  // 课程内容（签名验证后获取）
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

export default function Courses() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [userBalance, setUserBalance] = useState('0');
  const [purchasedCourses, setPurchasedCourses] = useState<Set<number>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [managingCourse, setManagingCourse] = useState<Course | null>(null);
  const [approvedCourses, setApprovedCourses] = useState<Set<number>>(new Set());
  const { isConnected, account } = useWalletContext();
  const { tokenOperations, courseOperations, loading, isReady, CONTRACT_ADDRESSES } = useContracts();

  // 加载课程数据（使用认证状态获取购买信息）
  const loadCourses = async () => {
    if (!isReady) return;
    
    try {
      setCoursesLoading(true);
      
      // 构建请求URL，如果已登录则带上session token
      let url = 'http://localhost:3001/api/courses';
      if (authService.isLoggedIn()) {
        url += `?sessionToken=${authService.getSessionToken()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data.courses) {
        console.log('API返回完整数据:', data.data);
        
        // 直接使用API返回的完整数据，包括购买状态
        const coursesData = data.data.courses.map((apiCourse: any) => ({
          id: apiCourse.courseId,
          title: apiCourse.title || `课程 #${apiCourse.courseId}`,
          description: apiCourse.description || `分类: ${apiCourse.category}`,
          price: apiCourse.price ? apiCourse.price.toString() : "0",
          instructor: apiCourse.instructorAddress || "0x0000",
          isActive: true,
          createdAt: new Date(apiCourse.createdAt).getTime() / 1000,
          // 数据库扩展字段
          category: apiCourse.category,
          coverImageUrl: apiCourse.coverImageUrl,
          // API返回的购买状态
          hasPurchased: apiCourse.hasPurchased || false
        }));
        setCourses(coursesData);
        
        // 更新本地购买状态（API数据作为初始状态）
        const purchased = new Set<number>();
        coursesData.forEach(course => {
          if (course.hasPurchased) {
            purchased.add(course.id);
          }
        });
        setPurchasedCourses(purchased);
        
        console.log('📊 API返回购买状态:', {
          userAddress: data.data.userAddress,
          purchasedFromAPI: Array.from(purchased)
        });
        
        console.log('用户登录状态:', data.data.userAddress ? '已登录' : '未登录');
        console.log('已购买课程:', Array.from(purchased));
      }
    } catch (error) {
      console.error('加载课程失败:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    console.log('课程创建成功');
    loadUserData(); // 重新加载用户数据
    loadCourses(); // 重新加载课程列表
  };

  // 处理用户登录
  const handleLogin = async () => {
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
        // 重新加载课程以获取购买状态
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
  };

  // 处理用户登出
  const handleLogout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
    // 重新加载课程（将不显示购买状态）
    loadCourses();
  };

  // 处理开始学习（需要签名验证）
  const handleStartLearning = async (course: Course) => {
    if (!account || !window.ethereum) {
      alert('请先连接钱包');
      return;
    }

    try {
      setIsLoggingIn(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      console.log('🎯 开始学习课程:', course.title);
      
      let result;
      
      if (!authService.isLoggedIn()) {
        // 未登录：使用优化的登录+访问课程方法（最多2次签名）
        console.log('🔑 未登录，执行登录并访问课程');
        result = await authService.loginAndAccessCourse(course.id, account, signer);
        if (result.success) {
          setIsLoggedIn(true);
          loadCourses(); // 重新加载课程以获取购买状态
        }
      } else {
        // 已登录：直接访问课程（可能使用缓存签名，0-1次签名）
        console.log('✅ 已登录，直接访问课程');
        result = await authService.accessCourseWithCache(course.id, account, signer);
      }
      
      if (result.success) {
        console.log('✅ 课程访问成功:', result.data);
        // 设置选中课程以显示详情
        setSelectedCourse({
          ...course,
          // 添加课程内容数据
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
  };


  // 加载用户数据
  const loadUserData = async () => {
    if (!account || !isReady) return;
    
    try {
      // 获取用户余额
      const balance = await tokenOperations.getBalance(account);
      setUserBalance(balance);
      
      // 检查已购买的课程和授权状态
      const purchased = new Set<number>();
      const approved = new Set<number>();
      
      // 获取总授权额度
      const allowance = await tokenOperations.getAllowance(account, CONTRACT_ADDRESSES.CourseManager);
      
      for (const course of courses) {
        // 从智能合约检查购买状态（权威状态）
        const hasPurchased = await courseOperations.hasPurchased(account, course.id);
        if (hasPurchased) {
          purchased.add(course.id);
        }
        
        // 检查授权状态 - 如果总授权额度大于等于课程价格
        if (parseFloat(allowance) >= parseFloat(course.price)) {
          approved.add(course.id);
        }
      }
      
      setPurchasedCourses(purchased);
      setApprovedCourses(approved);
      
      console.log('🔍 链上购买状态检查完成:', {
        userAddress: account,
        purchasedCourses: Array.from(purchased),
        totalCourses: courses.length
      });
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  };

  // 处理授权
  const handleApprove = async (course: Course, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    
    if (!account || !isReady) {
      alert('请先连接钱包并切换到正确网络');
      return;
    }

    // 检查是否已购买
    if (course.hasPurchased || purchasedCourses.has(course.id)) {
      alert('您已经购买过这个课程了，无需授权');
      return;
    }

    try {
      const priceStr = course.price;
      const currentAllowance = await tokenOperations.getAllowance(account, CONTRACT_ADDRESSES.CourseManager);
      
      if (parseFloat(currentAllowance) >= parseFloat(priceStr)) {
        // 更新授权状态（即使已经授权过）
        setApprovedCourses(prev => new Set(prev).add(course.id));
        alert('已经授权足够的金额');
        return;
      }

      console.log('🔐 开始授权:', { courseId: course.id, price: priceStr });
      await tokenOperations.approve(CONTRACT_ADDRESSES.CourseManager, priceStr);
      
      // 更新授权状态
      setApprovedCourses(prev => new Set(prev).add(course.id));
      
      alert('授权成功！现在可以购买课程了');
    } catch (error) {
      console.error('授权失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`授权失败: ${errorMessage}`);
    }
  };

  // 处理购买
  const handlePurchase = async (course: Course, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    
    if (!account || !isReady) {
      alert('请先连接钱包并切换到正确网络');
      return;
    }

    // 先从链上再次确认购买状态
    try {
      const hasPurchasedOnChain = await courseOperations.hasPurchased(account, course.id);
      if (hasPurchasedOnChain) {
        alert('您已经购买过这个课程了！正在更新状态...');
        // 更新本地状态
        setPurchasedCourses(prev => new Set(prev).add(course.id));
        // 重新加载数据以同步状态
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
    
    // 检查余额
    if (parseFloat(userBalance) < parseFloat(priceStr)) {
      alert('YD 代币余额不足');
      return;
    }

    // 检查授权
    try {
      if (!approvedCourses.has(course.id)) {
        alert('请先点击 Approve 按钮进行授权');
        return;
      }

      console.log('🛒 开始购买课程:', { courseId: course.id, price: priceStr });
      await courseOperations.purchaseCourse(course.id);
      alert('购买成功！');
      
      // 立即更新购买状态
      setPurchasedCourses(prev => new Set(prev).add(course.id));
      
      // 重新加载数据以同步状态
      loadUserData();
      loadCourses();
    } catch (error) {
      console.error('购买失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 特殊处理各种错误类型
      if (errorMessage.includes('Already purchased') || errorMessage.includes('已购买')) {
        alert('检测到您已购买此课程！正在同步状态...');
        // 更新本地状态
        setPurchasedCourses(prev => new Set(prev).add(course.id));
        // 重新加载数据
        loadUserData();
        loadCourses();
      } else if (errorMessage.includes('Cannot purchase your own course') || errorMessage.includes('own course')) {
        alert('💡 不能购买自己创建的课程\n\n作为课程创建者，您已经拥有此课程的所有权限。\n请切换到其他钱包地址来测试购买功能。');
      } else {
        alert(`购买失败: ${errorMessage}`);
      }
    }
  };

  // 测试后端连接
  const testBackendConnection = async () => {
    try {
      console.log('测试后端连接...');
      const result = await testApi.testConnection();
      console.log('后端连接测试结果:', result);
      if (result.success) {
        alert('后端连接成功！');
      } else {
        alert('后端连接失败: ' + result.error);
      }
    } catch (error) {
      console.error('后端连接测试失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert('后端连接测试失败: ' + errorMessage);
    }
  };

  // 验证登录状态
  const checkLoginStatus = async () => {
    if (authService.isLoggedIn()) {
      const isValid = await authService.verifySession();
      setIsLoggedIn(isValid);
    }
  };

  // 组件加载时获取用户数据和课程数据
  useEffect(() => {
    if (isReady) {
      checkLoginStatus();
      loadCourses(); // 先加载课程列表
    }
  }, [isReady, account]);
  
  // 课程数据加载完成后再加载用户数据（确保courses数组不为空）
  useEffect(() => {
    if (isReady && courses.length > 0) {
      loadUserData();
    }
  }, [isReady, account, courses.length]);

  // 登录状态变化时重新加载课程
  useEffect(() => {
    if (isReady) {
      loadCourses();
    }
  }, [isLoggedIn, isReady]);

  const openCourseDetails = async (course: Course) => {
    // 直接显示课程详情模态框，不自动调用签名验证
    setSelectedCourse(course);
  };

  const closeCourseDetails = () => {
    setSelectedCourse(null);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              课程中心
            </h1>
            <p className="text-gray-300">探索区块链技术的无限可能</p>
            {isConnected && (
              <div className="mt-3 flex items-center gap-3">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 font-medium">{parseFloat(userBalance).toFixed(2)} YD</span>
                </div>
              </div>
            )}
          </div>
          {isConnected && (
            <div className="flex gap-3">
              <button
                onClick={testBackendConnection}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl hover:from-green-400 hover:to-emerald-400 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
              >
                <span className="text-xl">🔗</span>
                测试后端
              </button>
              
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3 rounded-xl hover:from-red-400 hover:to-orange-400 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                >
                  <span className="text-xl">🚪</span>
                  登出
                </button>
              )}
              
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105"
              >
                <span className="text-xl">+</span>
                创建课程
              </button>
            </div>
          )}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coursesLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">加载课程中...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">暂无课程，快来创建第一个课程吧！</p>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:transform hover:scale-105 group cursor-pointer" onClick={() => openCourseDetails(course)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-blue-400 text-sm font-medium">课程 #{course.id}</span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-orange-400 text-xs font-medium bg-orange-500/10 px-2 py-1 rounded">{course.category}</span>
                  </div>
                  {account?.toLowerCase() === course.instructor.toLowerCase() && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setManagingCourse(course);
                      }}
                      className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded-md text-xs transition-colors"
                    >
                      管理
                    </button>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">{course.title}</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">{course.description}</p>
              
                <div className="flex justify-between items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* 只有未购买且非自己创建的课程才显示Approve按钮 */}
                  {!(course.hasPurchased || purchasedCourses.has(course.id)) && account?.toLowerCase() !== course.instructor.toLowerCase() && (
                    <button 
                      onClick={(e) => handleApprove(course, e)}
                      disabled={loading || approvedCourses.has(course.id)}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm flex-shrink-0 ${
                        approvedCourses.has(course.id)
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : loading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-500 hover:to-teal-500 hover:shadow-lg'
                      }`}
                    >
                      {approvedCourses.has(course.id) ? '已授权' : loading ? '处理中...' : 'Approve'}
                    </button>
                  )}
                  
                  <div className="flex items-center">
                    <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{parseFloat(course.price).toFixed(2)}</span>
                    <span className="text-gray-400 ml-1 text-sm">YD</span>
                  </div>
                  
                  {(course.hasPurchased || purchasedCourses.has(course.id)) ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartLearning(course);
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 hover:shadow-lg text-sm"
                    >
                      开始学习
                    </button>
                  ) : account?.toLowerCase() === course.instructor.toLowerCase() ? (
                    /* 自己创建的课程显示特殊状态 */
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 text-sm font-medium bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
                        👨‍🏫 我的课程
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartLearning(course);
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 hover:shadow-lg text-sm"
                      >
                        查看内容
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => handlePurchase(course, e)}
                      disabled={loading || !approvedCourses.has(course.id) || (course.hasPurchased || purchasedCourses.has(course.id))}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                        (course.hasPurchased || purchasedCourses.has(course.id))
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : !approvedCourses.has(course.id)
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : loading
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 hover:shadow-lg'
                      }`}
                    >
                      {(course.hasPurchased || purchasedCourses.has(course.id))
                        ? '已购买'
                        : !approvedCourses.has(course.id)
                          ? '需要授权'
                          : loading
                            ? '处理中...'
                            : '购买课程'
                      }
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 创建课程模态框 */}
        <CreateCourseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          onBalanceUpdate={loadUserData}
        />


        {/* 课程管理模态框 */}
        <CourseManagementModal
          isOpen={!!managingCourse}
          onClose={() => setManagingCourse(null)}
          course={managingCourse}
        />

        {/* 简化的课程详情模态框 */}
        {selectedCourse && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeCourseDetails}>
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* 简化的头部 */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{selectedCourse.title}</h2>
                <button 
                  onClick={closeCourseDetails}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 课程内容展示 */}
              {selectedCourse.courseContent ? (
                /* 签名验证成功后显示实际课程内容 */
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <h3 className="text-lg font-semibold text-emerald-400">课程内容</h3>
                    </div>
                    
                    {/* 课程章节 */}
                    <div className="space-y-3">
                      {selectedCourse.courseContent.lessons?.map((lesson, index) => (
                        <div key={lesson.id} className="bg-gray-700/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-medium">{lesson.title}</h4>
                              {lesson.duration && (
                                <p className="text-gray-400 text-sm">时长: {lesson.duration}</p>
                              )}
                            </div>
                            <button className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-500 transition-colors">
                              播放
                            </button>
                          </div>
                        </div>
                      )) || (
                        <div className="text-gray-400 text-center py-4">暂无课程内容</div>
                      )}
                    </div>
                    
                    {/* 课程资源 */}
                    {selectedCourse.courseContent.resources && selectedCourse.courseContent.resources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <h4 className="text-white font-medium mb-2">课程资源</h4>
                        <div className="space-y-2">
                          {selectedCourse.courseContent.resources.map((resource, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-700/20 rounded p-2">
                              <span className="text-gray-300 text-sm">{resource.name}</span>
                              <button className="text-blue-400 hover:text-blue-300 text-sm">
                                下载
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : account?.toLowerCase() === selectedCourse.instructor.toLowerCase() ? (
                /* 课程创建者界面 */
                <div className="text-center py-8">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6">
                    <div className="text-orange-400 mb-3">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">👨‍🏫</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">我的课程</h3>
                    <p className="text-gray-400 mb-4">作为课程创建者，点击下方按钮查看课程内容</p>
                    <button 
                      onClick={() => handleStartLearning(selectedCourse)}
                      className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-500 transition-colors"
                    >
                      🔍 查看课程内容
                    </button>
                  </div>
                </div>
              ) : (selectedCourse.hasPurchased || purchasedCourses.has(selectedCourse.id)) ? (
                /* 已购买但未验证签名的状态 */
                <div className="text-center py-8">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                    <div className="text-blue-400 mb-3">
                      <div className="w-12 h-12 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">课程已购买</h3>
                    <p className="text-gray-400 mb-4">点击下方按钮验证签名并查看课程内容</p>
                    <button 
                      onClick={() => handleStartLearning(selectedCourse)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors"
                    >
                      🔐 验证签名并开始学习
                    </button>
                  </div>
                </div>
              ) : (
                /* 未购买用户的简化购买界面 */
                <div className="text-center py-8">
                  <div className="bg-gray-700/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">购买课程解锁内容</h3>
                    <div className="text-2xl font-bold text-yellow-400 mb-4">
                      {parseFloat(selectedCourse.price).toFixed(2)} YD
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleApprove(selectedCourse)}
                        disabled={loading || approvedCourses.has(selectedCourse.id)}
                        className={`w-full px-4 py-2 rounded-lg transition-all duration-200 ${
                          approvedCourses.has(selectedCourse.id)
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : loading
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-500'
                        }`}
                      >
                        {approvedCourses.has(selectedCourse.id) ? '✓ 已授权' : loading ? '处理中...' : '1. 授权代币'}
                      </button>
                      <button 
                        onClick={() => handlePurchase(selectedCourse)}
                        disabled={loading || !approvedCourses.has(selectedCourse.id)}
                        className={`w-full px-4 py-2 rounded-lg transition-all duration-200 ${
                          !approvedCourses.has(selectedCourse.id)
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : loading
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                      >
                        {!approvedCourses.has(selectedCourse.id) ? '2. 购买课程 (需先授权)' : loading ? '处理中...' : '2. 购买课程'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}