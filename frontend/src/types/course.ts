// 课程详细结构类型
export interface Course {
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
  courseContent?: CourseContent;
}

// 课程内容结构
export interface CourseContent {
  lessons: CourseLesson[];
  resources?: CourseResource[];
}

// 课程章节
export interface CourseLesson {
  id: number;
  title: string;
  videoUrl?: string;
  duration?: string;
}

// 课程资源
export interface CourseResource {
  name: string;
  url: string;
}

// 课程详情模态框 Props
export interface CourseDetailModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  purchasedCourses: Set<number>;
  approvedCourses: Set<number>;
  loading: boolean;
  onApprove: (course: Course) => void;
  onPurchase: (course: Course) => void;
  onStartLearning: (course: Course) => void;
}

// 课程卡片 Props
export interface CourseCardProps {
  course: Course;
  hasPurchased?: boolean;
  onLearnMore: (course: Course) => void;
  onStartLearning?: (course: Course) => void;
}

// 课程管理相关类型
export interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: CreateCourseFormData) => void;
  loading?: boolean;
}

export interface CreateCourseFormData {
  title: string;
  description: string;
  price: string;
}