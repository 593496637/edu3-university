import { create } from 'zustand';

interface Course {
  id: string;
  title: string;
  description: string;
  price: string;
  instructor: string;
  createdAt: string;
}

interface User {
  walletAddress: string;
  nickname: string;
  bio: string;
  purchasedCourses: Course[];
}

interface AppState {
  // 用户状态
  user: User | null;
  setUser: (user: User | null) => void;

  // 课程状态
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;

  // UI状态
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // 模态框状态
  isCreateCourseModalOpen: boolean;
  setCreateCourseModalOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // 用户状态
  user: null,
  setUser: (user) => set({ user }),

  // 课程状态
  courses: [],
  setCourses: (courses) => set({ courses }),
  addCourse: (course) => set((state) => ({
    courses: [course, ...state.courses]
  })),

  // UI状态
  loading: false,
  setLoading: (loading) => set({ loading }),

  // 模态框状态
  isCreateCourseModalOpen: false,
  setCreateCourseModalOpen: (open) => set({ isCreateCourseModalOpen: open }),
}));