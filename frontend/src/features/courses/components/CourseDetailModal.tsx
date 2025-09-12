import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';
import type { CourseDetailModalProps } from '../../../types/course';

export default function CourseDetailModal({
  course,
  isOpen,
  onClose,
  purchasedCourses,
  approvedCourses,
  loading,
  onApprove,
  onPurchase,
  onStartLearning
}: CourseDetailModalProps) {
  const { account } = useAuthStore();
  
  if (!course) return null;

  const isOwner = account?.toLowerCase() === course.instructor.toLowerCase();
  const isPurchased = course.hasPurchased || purchasedCourses.has(course.id);
  const isApproved = approvedCourses.has(course.id);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={course.title}
      maxWidth="2xl"
    >
      {/* Course Content */}
      {course.courseContent ? (
        // 签名验证成功后显示实际课程内容
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-emerald-400">课程内容</h3>
            </div>
            
            {/* 课程章节 */}
            <div className="space-y-3">
              {course.courseContent.lessons?.map((lesson) => (
                <div key={lesson.id} className="bg-gray-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{lesson.title}</h4>
                      {lesson.duration && (
                        <p className="text-gray-400 text-sm">时长: {lesson.duration}</p>
                      )}
                    </div>
                    <Button variant="success" size="sm">
                      播放
                    </Button>
                  </div>
                </div>
              )) || (
                <div className="text-gray-400 text-center py-4">暂无课程内容</div>
              )}
            </div>
            
            {/* 课程资源 */}
            {course.courseContent.resources && course.courseContent.resources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h4 className="text-white font-medium mb-2">课程资源</h4>
                <div className="space-y-2">
                  {course.courseContent.resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700/20 rounded p-2">
                      <span className="text-gray-300 text-sm">{resource.name}</span>
                      <Button variant="ghost" size="sm">
                        下载
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : isOwner ? (
        // 课程创建者界面
        <div className="text-center py-8">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6">
            <div className="text-orange-400 mb-3">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍🏫</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-orange-400 mb-2">我的课程</h3>
            <p className="text-gray-400 mb-4">作为课程创建者，点击下方按钮查看课程内容</p>
            <Button 
              variant="secondary"
              onClick={() => onStartLearning(course)}
              icon="🔍"
            >
              查看课程内容
            </Button>
          </div>
        </div>
      ) : isPurchased ? (
        // 已购买但未验证签名的状态
        <div className="text-center py-8">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <div className="text-blue-400 mb-3">
              <div className="w-12 h-12 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
            </div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">课程已购买</h3>
            <p className="text-gray-400 mb-4">点击下方按钮验证签名并查看课程内容</p>
            <Button 
              variant="primary"
              onClick={() => onStartLearning(course)}
              icon="🔐"
            >
              验证签名并开始学习
            </Button>
          </div>
        </div>
      ) : (
        // 未购买用户的购买界面
        <div className="text-center py-8">
          <div className="bg-gray-700/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">购买课程解锁内容</h3>
            <div className="text-2xl font-bold text-yellow-400 mb-4">
              {parseFloat(course.price).toFixed(2)} YD
            </div>
            <div className="space-y-3">
              <Button 
                variant="success"
                onClick={() => onApprove(course)}
                disabled={loading || isApproved}
                loading={loading && !isApproved}
                className="w-full"
              >
                {isApproved ? '✓ 已授权' : '1. 授权代币'}
              </Button>
              <Button 
                variant="primary"
                onClick={() => onPurchase(course)}
                disabled={loading || !isApproved}
                loading={loading && isApproved}
                className="w-full"
              >
                {!isApproved ? '2. 购买课程 (需先授权)' : '2. 购买课程'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}