/**
 * 课程中心页面 - Web3教育平台的核心功能页面
 * 
 * 主要功能：
 * 1. 课程列表展示 - 显示所有可用课程，支持网格布局
 * 2. 课程购买流程 - 包括代币授权(approve)和购买(purchase)两步操作
 * 3. 课程创建 - 为教师/内容创作者提供课程发布功能
 * 4. 学习管理 - 已购买课程可以开始学习，查看课程内容
 * 5. 后端API测试 - 开发环境下的连接性测试功能
 * 6. 用户认证 - 集成钱包连接和用户登录状态管理
 * 
 * 技术实现：
 * - 使用自定义hooks管理课程数据和用户操作
 * - 集成Web3钱包连接和智能合约交互
 * - 响应式设计支持多设备访问
 * - 模态框组件实现用户交互流程
 * - Toast消息系统提供用户反馈
 * 
 * 数据流：
 * 钱包连接 → 获取用户余额 → 加载课程列表 → 检查购买状态 → 显示操作按钮
 */

// React核心hooks
import { useState } from "react";
// API服务层
import { testApi } from "../services/api";           // 后端连接测试API
import { authService } from "../services/authService";   // 用户认证服务
// 状态管理
import { useAuthStore } from "../store/authStore";       // 全局认证状态
// 自定义hooks
import { useToastContext } from "../hooks/useToastContext"; // Toast通知系统
import { useCourseList } from "../features/courses/hooks/useCourseList";     // 课程列表管理
import { useCourseActions } from "../features/courses/hooks/useCourseActions"; // 课程操作管理
// 类型定义
import type { Course } from "../features/courses/types";
// 功能组件
import CourseCard from "../features/courses/components/CourseCard";           // 课程卡片
import CourseDetailModal from "../features/courses/components/CourseDetailModal"; // 课程详情模态框
import CreateCourseModal from "../features/courses/components/CreateCourseModal"; // 创建课程模态框
// UI组件
import Button from "../components/ui/Button";                // 通用按钮组件
import LoadingSpinner from "../components/ui/LoadingSpinner"; // 加载动画
import Badge from "../components/ui/Badge";                  // 徽章组件

export default function Courses() {
  // === 组件状态管理 ===
  // 控制创建课程模态框的显示/隐藏
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // 当前选中查看详情的课程，null表示未选中
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // === 全局状态获取 ===
  // 从认证状态管理中获取钱包连接状态、代币余额、登录状态等
  const { isConnected, balance, isLoggedIn, setLoggedIn } = useAuthStore();
  // 获取Toast通知函数，用于显示操作结果消息
  const { toast } = useToastContext();

  // === 课程数据管理 ===
  // 课程列表相关的状态和操作函数
  const {
    courses,                    // 所有课程列表
    loading: coursesLoading,    // 课程加载状态
    purchasedCourses,          // 用户已购买的课程ID集合
    loadCourses,               // 重新加载课程列表的函数
    setPurchasedCourses,       // 更新已购买课程状态的函数
  } = useCourseList();

  // === 课程操作管理 ===
  // 处理课程相关操作（授权、购买、学习）的hooks
  const {
    loading: actionLoading,     // 操作进行中的加载状态
    approvedCourses,           // 用户已授权的课程ID集合
    handleApprove,             // 处理代币授权操作
    handlePurchase,            // 处理课程购买操作
    handleStartLearning,       // 处理开始学习操作
    loadUserAllowances,        // 加载用户授权状态
  } = useCourseActions();

  /**
   * 处理课程创建成功后的回调
   * 
   * 当用户成功创建新课程后：
   * 1. 重新加载课程列表以显示新创建的课程
   * 2. 重新加载用户的授权状态，确保UI状态同步
   * 
   * 这个函数会被传递给CreateCourseModal组件
   */
  const handleCreateSuccess = () => {
    console.log("课程创建成功");
    loadCourses();                    // 刷新课程列表
    loadUserAllowances(courses);      // 刷新授权状态
  };

  /**
   * 处理用户登出操作
   * 
   * 执行步骤：
   * 1. 调用认证服务的登出API，清理后端session
   * 2. 更新本地登录状态为false
   * 3. 重新加载课程列表（可能有些课程需要登录才能看到）
   * 
   * 注意：这里的登出是指后端API的用户会话，不会断开钱包连接
   */
  const handleLogout = async () => {
    await authService.logout();       // 清理后端session
    setLoggedIn(false);              // 更新本地状态
    loadCourses();                   // 刷新课程数据
  };

  /**
   * 测试后端API连接状态
   * 
   * 这是一个开发/调试功能，用于：
   * 1. 验证前端与后端API的网络连通性
   * 2. 检查后端服务的健康状态
   * 3. 帮助开发者诊断API调用问题
   * 
   * 流程：
   * 1. 调用测试API接口
   * 2. 根据返回结果显示相应的Toast消息
   * 3. 记录详细的错误信息到控制台便于调试
   * 
   * @async
   */
  const testBackendConnection = async () => {
    try {
      console.log("测试后端连接...");
      // 调用后端健康检查接口
      const result = await testApi.testConnection();
      console.log("后端连接测试结果:", result);
      
      // 根据API返回结果显示相应消息
      if (result.success) {
        toast.success("后端连接成功！");
      } else {
        toast.error("后端连接失败: " + result.error);
      }
    } catch (error) {
      // 处理网络错误或其他异常
      console.error("后端连接测试失败:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      toast.error("后端连接测试失败: " + errorMessage);
    }
  };

  /**
   * 处理课程的代币授权操作
   * 
   * Web3课程购买的第一步：用户需要先授权智能合约使用其YDToken
   * 
   * 流程说明：
   * 1. 用户点击"授权"按钮
   * 2. 调用YDToken合约的approve方法
   * 3. 授权完成后刷新用户的授权状态
   * 4. UI会更新显示"购买"按钮
   * 
   * @param course 要授权购买的课程对象
   */
  const handleCourseApprove = async (course: Course) => {
    await handleApprove(course, () => {
      // 授权成功后的回调：刷新所有课程的授权状态
      loadUserAllowances(courses);
    });
  };

  /**
   * 处理课程购买操作
   * 
   * Web3课程购买的第二步：在用户已授权的前提下执行实际购买
   * 
   * 购买流程：
   * 1. 调用CourseManager智能合约的购买方法
   * 2. 合约会扣除用户的YDToken并记录购买关系
   * 3. 更新本地状态，将课程添加到已购买列表
   * 4. 刷新课程数据和授权状态，确保UI显示正确
   * 
   * @param course 要购买的课程对象
   */
  const handleCoursePurchase = async (course: Course) => {
    await handlePurchase(course, () => {
      // 购买成功后的回调函数
      // 1. 立即更新本地已购买课程状态，避免UI闪烁
      setPurchasedCourses((prev) => new Set(prev).add(course.id));
      // 2. 重新加载课程列表，获取最新的链上数据
      loadCourses();
      // 3. 重新加载授权状态，清理已使用的授权
      loadUserAllowances(courses);
    });
  };

  /**
   * 处理开始学习课程操作
   * 
   * 用户购买课程后可以开始学习，这个操作会：
   * 1. 验证用户确实已购买该课程
   * 2. 从后端API获取完整的课程内容（包括视频、文档等）
   * 3. 打开课程详情模态框显示学习内容
   * 
   * 安全考虑：
   * - 只有已购买的课程才能获取完整内容
   * - 未购买用户只能看到课程基本信息和预览
   * 
   * @param course 要开始学习的课程对象
   */
  const handleCourseStartLearning = async (course: Course) => {
    await handleStartLearning(course, (courseWithContent: Course) => {
      // 学习操作成功后的回调：设置包含完整内容的课程为选中状态
      // 这会触发CourseDetailModal打开并显示学习内容
      setSelectedCourse(courseWithContent);
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              课程中心
            </h1>
            <p className="text-gray-300">探索区块链技术的无限可能</p>
            {isConnected && (
              <div className="mt-3 flex items-center gap-3">
                <Badge variant="warning" className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    {parseFloat(balance).toFixed(2)} YD
                  </span>
                </Badge>
              </div>
            )}
          </div>

          {isConnected && (
            <div className="flex gap-3">
              <Button
                variant="success"
                onClick={testBackendConnection}
                icon="🔗"
              >
                测试后端
              </Button>

              {isLoggedIn && (
                <Button variant="danger" onClick={handleLogout} icon="🚪">
                  登出
                </Button>
              )}

              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                icon="+"
              >
                创建课程
              </Button>
            </div>
          )}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coursesLoading ? (
            <div className="col-span-full text-center py-12">
              <LoadingSpinner size="lg" text="加载课程中..." />
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-500">📚</span>
              </div>
              <p className="text-gray-400">暂无课程，快来创建第一个课程吧！</p>
            </div>
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                userBalance={balance}
                purchasedCourses={purchasedCourses}
                approvedCourses={approvedCourses}
                loading={actionLoading}
                onApprove={handleCourseApprove}
                onPurchase={handleCoursePurchase}
                onStartLearning={handleCourseStartLearning}
                onClick={() => setSelectedCourse(course)}
              />
            ))
          )}
        </div>

        {/* Modals */}
        <CreateCourseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        <CourseDetailModal
          course={selectedCourse}
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          purchasedCourses={purchasedCourses}
          approvedCourses={approvedCourses}
          loading={actionLoading}
          onApprove={handleCourseApprove}
          onPurchase={handleCoursePurchase}
          onStartLearning={handleCourseStartLearning}
        />
      </div>
    </div>
  );
}
