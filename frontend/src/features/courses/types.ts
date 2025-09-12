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

export interface CourseState {
  courses: Course[];
  loading: boolean;
  selectedCourse: Course | null;
}

export interface CourseActions {
  loadCourses: () => Promise<void>;
  selectCourse: (course: Course | null) => void;
  purchaseCourse: (courseId: number) => Promise<void>;
  approveCourse: (courseId: number) => Promise<void>;
}