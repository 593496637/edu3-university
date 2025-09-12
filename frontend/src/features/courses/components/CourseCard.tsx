import Button from '@components/ui/Button';
import Badge from '@components/ui/Badge';
import Card from '@components/ui/Card';
import { useAuthStore } from '@store/authStore';

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
}

interface CourseCardProps {
  course: Course;
  userBalance: string;
  purchasedCourses: Set<number>;
  approvedCourses: Set<number>;
  loading: boolean;
  onApprove: (course: Course, event?: React.MouseEvent) => void;
  onPurchase: (course: Course, event?: React.MouseEvent) => void;
  onStartLearning: (course: Course) => void;
  onManage?: (course: Course) => void;
  onClick: (course: Course) => void;
}

export default function CourseCard({
  course,
  // userBalance, // 暂时未使用
  purchasedCourses,
  approvedCourses,
  loading,
  onApprove,
  onPurchase,
  onStartLearning,
  onManage,
  onClick
}: CourseCardProps) {
  const { account } = useAuthStore();
  const isOwner = account?.toLowerCase() === course.instructor.toLowerCase();
  const isPurchased = course.hasPurchased || purchasedCourses.has(course.id);
  const isApproved = approvedCourses.has(course.id);

  const handleCardClick = () => {
    onClick(course);
  };

  return (
    <Card clickable onClick={handleCardClick} className="group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
          <span className="text-blue-400 text-sm font-medium">课程 #{course.id}</span>
          <span className="mx-2 text-gray-500">•</span>
          <Badge variant="warning" size="sm">
            {course.category}
          </Badge>
        </div>
        {isOwner && onManage && (
          <Button 
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onManage(course);
            }}
          >
            管理
          </Button>
        )}
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">
        {course.title}
      </h3>
      <p className="text-gray-400 mb-6 leading-relaxed line-clamp-3">
        {course.description}
      </p>

      {/* Actions */}
      <div className="flex justify-between items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {/* Approve Button - 只对未购买且非自己创建的课程显示 */}
        {!isPurchased && !isOwner && (
          <Button
            variant="success"
            size="sm"
            onClick={(e) => onApprove(course, e)}
            disabled={loading || isApproved}
          >
            {isApproved ? '已授权' : 'Approve'}
          </Button>
        )}

        {/* Price */}
        <div className="flex items-center">
          <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {parseFloat(course.price).toFixed(2)}
          </span>
          <span className="text-gray-400 ml-1 text-sm">YD</span>
        </div>

        {/* Main Action Button */}
        {isPurchased ? (
          <Button
            variant="success"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStartLearning(course);
            }}
          >
            开始学习
          </Button>
        ) : isOwner ? (
          <div className="flex items-center gap-2">
            <Badge variant="warning">👨‍🏫 我的课程</Badge>
            <Button
              variant="success"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStartLearning(course);
              }}
            >
              查看内容
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => onPurchase(course, e)}
            disabled={loading || !isApproved}
          >
            {!isApproved ? '需要授权' : loading ? '处理中...' : '购买课程'}
          </Button>
        )}
      </div>
    </Card>
  );
}