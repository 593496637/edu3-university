import { useState, useEffect } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { useContracts } from '../hooks/useContracts';
import CreateCourseModal from '../components/CreateCourseModal';
import CourseManagementModal from '../components/CourseManagementModal';
import { testApi } from '../services/api';

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
}

export default function Courses() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [userBalance, setUserBalance] = useState('0');
  const [purchasedCourses, setPurchasedCourses] = useState<Set<number>>(new Set());
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [managingCourse, setManagingCourse] = useState<Course | null>(null);
  const [approvedCourses, setApprovedCourses] = useState<Set<number>>(new Set());
  const { isConnected, account } = useWalletContext();
  const { tokenOperations, courseOperations, loading, isReady, CONTRACT_ADDRESSES } = useContracts();

  // 加载课程数据（直接使用API数据）
  const loadCourses = async () => {
    if (!isReady) return;
    
    try {
      setCoursesLoading(true);
      // 直接调用API，不做过度封装
      const response = await fetch('http://localhost:3001/api/courses');
      const data = await response.json();
      
      if (data.success && data.data.courses) {
        console.log('API返回完整数据:', data.data.courses);
        // 直接使用API返回的完整数据
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
          coverImageUrl: apiCourse.coverImageUrl
        }));
        setCourses(coursesData);
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

    try {
      const priceStr = course.price;
      const currentAllowance = await tokenOperations.getAllowance(account, CONTRACT_ADDRESSES.CourseManager);
      
      if (parseFloat(currentAllowance) >= parseFloat(priceStr)) {
        // 更新授权状态（即使已经授权过）
        setApprovedCourses(prev => new Set(prev).add(course.id));
        alert('已经授权足够的金额');
        return;
      }

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

    if (purchasedCourses.has(course.id)) {
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

      await courseOperations.purchaseCourse(course.id);
      alert('购买成功！');
      
      // 更新购买状态
      setPurchasedCourses(prev => new Set(prev).add(course.id));
      
      // 重新加载用户数据
      loadUserData();
    } catch (error) {
      console.error('购买失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`购买失败: ${errorMessage}`);
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

  // 组件加载时获取用户数据和课程数据
  useEffect(() => {
    if (isReady) {
      loadUserData();
      loadCourses();
    }
  }, [isReady, account]);

  const openCourseDetails = (course: Course) => {
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
                  {!purchasedCourses.has(course.id) && (
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
                  
                  {purchasedCourses.has(course.id) ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openCourseDetails(course);
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 hover:shadow-lg text-sm"
                    >
                      进入学习
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => handlePurchase(course, e)}
                      disabled={loading || !approvedCourses.has(course.id)}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                        !approvedCourses.has(course.id)
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : loading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 hover:shadow-lg'
                      }`}
                    >
                      {!approvedCourses.has(course.id) ? '需要授权' : loading ? '处理中...' : '购买课程'}
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

        {/* 课程详情模态框 */}
        {selectedCourse && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeCourseDetails}>
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-blue-400 text-sm font-medium">课程 #{selectedCourse.id}</span>
                  <span className="mx-2 text-gray-500">•</span>
                  <span className="text-gray-400 text-sm">讲师: {selectedCourse.instructor.slice(0, 8)}...</span>
                </div>
                <button 
                  onClick={closeCourseDetails}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">{selectedCourse.title}</h2>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">{selectedCourse.description}</p>

              <div className="bg-gray-700/20 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">课程信息</h3>
                <div className="grid grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <span className="text-gray-400">课程价格：</span>
                    <span className="text-yellow-400 font-semibold">{parseFloat(selectedCourse.price).toFixed(2)} YD</span>
                  </div>
                  <div>
                    <span className="text-gray-400">创建时间：</span>
                    <span>{new Date(selectedCourse.createdAt * 1000).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">课程状态：</span>
                    <span className={selectedCourse.isActive ? 'text-green-400' : 'text-red-400'}>
                      {selectedCourse.isActive ? '进行中' : '已停止'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">购买状态：</span>
                    <span className={purchasedCourses.has(selectedCourse.id) ? 'text-green-400' : 'text-gray-400'}>
                      {purchasedCourses.has(selectedCourse.id) ? '已购买' : '未购买'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 已购买用户的学习内容 */}
              {purchasedCourses.has(selectedCourse.id) ? (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      <h3 className="text-xl font-semibold text-emerald-400">课程内容</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">第一章：基础概念</h4>
                        <p className="text-gray-300 text-sm">了解{selectedCourse.title}的核心概念和基础知识</p>
                        <button className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 transition-colors text-sm">
                          开始学习
                        </button>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">第二章：实战应用</h4>
                        <p className="text-gray-300 text-sm">通过实际案例深入理解应用场景</p>
                        <button className="mt-3 bg-gray-600 text-gray-300 px-4 py-2 rounded-lg cursor-not-allowed text-sm">
                          即将开放
                        </button>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">第三章：进阶技巧</h4>
                        <p className="text-gray-300 text-sm">掌握高级技巧和最佳实践</p>
                        <button className="mt-3 bg-gray-600 text-gray-300 px-4 py-2 rounded-lg cursor-not-allowed text-sm">
                          即将开放
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-gray-400 text-sm mb-2">学习进度</div>
                    <div className="bg-gray-700 rounded-full h-2 mb-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: '30%'}}></div>
                    </div>
                    <div className="text-emerald-400 text-sm">30% 完成</div>
                  </div>
                </div>
              ) : (
                /* 未购买用户的购买界面 */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleApprove(selectedCourse)}
                      disabled={loading || approvedCourses.has(selectedCourse.id)}
                      className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                        approvedCourses.has(selectedCourse.id)
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : loading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-500 hover:to-teal-500 hover:shadow-lg'
                      }`}
                    >
                      {approvedCourses.has(selectedCourse.id) ? '已授权' : loading ? '处理中...' : 'Approve'}
                    </button>
                    <div className="flex items-center">
                      <span className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{parseFloat(selectedCourse.price).toFixed(2)}</span>
                      <span className="text-gray-400 ml-2">YD</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePurchase(selectedCourse)}
                    disabled={loading || !approvedCourses.has(selectedCourse.id)}
                    className={`px-8 py-3 rounded-xl transition-all duration-200 font-medium ${
                      !approvedCourses.has(selectedCourse.id)
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : loading
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 hover:shadow-lg'
                    }`}
                  >
                    {!approvedCourses.has(selectedCourse.id) ? '需要先授权' : loading ? '处理中...' : '购买课程'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}