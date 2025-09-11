import { useState } from 'react';
import { useCourses } from '../hooks/useCourses';
import { testApi } from '../services/api';
import { useWalletContext } from '../context/WalletContext';
import { useToastContext } from '../context/ToastContext';
import CourseCard from '../components/business/CourseCard';
import CourseDetailModal from '../components/business/CourseDetailModal';
import CreateCourseModal from '../components/CreateCourseModal';
import CourseManagementModal from '../components/CourseManagementModal';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';

export default function CoursesOptimized() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [managingCourse, setManagingCourse] = useState<any>(null);
  const { isConnected } = useWalletContext();
  const { toast } = useToastContext();
  
  const {
    courses,
    coursesLoading,
    selectedCourse,
    purchasedCourses,
    approvedCourses,
    userBalance,
    isLoggedIn,
    // isLoggingIn,
    loading,
    setSelectedCourse,
    // handleLogin,
    handleLogout,
    handleApprove,
    handlePurchase,
    handleStartLearning,
    loadCourses,
    loadUserData
  } = useCourses();

  const handleCreateSuccess = () => {
    console.log('课程创建成功');
    loadUserData();
    loadCourses();
  };

  const testBackendConnection = async () => {
    try {
      console.log('测试后端连接...');
      const result = await testApi.testConnection();
      console.log('后端连接测试结果:', result);
      if (result.success) {
        toast.success('后端连接成功！');
      } else {
        toast.error('后端连接失败: ' + result.error);
      }
    } catch (error) {
      console.error('后端连接测试失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error('后端连接测试失败: ' + errorMessage);
    }
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
                <Badge variant="warning" className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">{parseFloat(userBalance).toFixed(2)} YD</span>
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
                <Button
                  variant="danger"
                  onClick={handleLogout}
                  icon="🚪"
                >
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
                userBalance={userBalance}
                purchasedCourses={purchasedCourses}
                approvedCourses={approvedCourses}
                loading={loading}
                onApprove={handleApprove}
                onPurchase={handlePurchase}
                onStartLearning={handleStartLearning}
                onManage={setManagingCourse}
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
          onBalanceUpdate={loadUserData}
        />

        <CourseManagementModal
          isOpen={!!managingCourse}
          onClose={() => setManagingCourse(null)}
          course={managingCourse}
        />

        <CourseDetailModal
          course={selectedCourse}
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          purchasedCourses={purchasedCourses}
          approvedCourses={approvedCourses}
          loading={loading}
          onApprove={handleApprove}
          onPurchase={handlePurchase}
          onStartLearning={handleStartLearning}
        />
      </div>
    </div>
  );
}