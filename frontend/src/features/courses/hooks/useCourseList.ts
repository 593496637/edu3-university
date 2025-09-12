import { useState, useCallback, useEffect } from 'react';
import { courseService } from '../../../services/courseService';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../store/authStore';
import type { Course } from '../types';
import { API_BASE_URL } from '../../../config/constants';

export const useCourseList = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasedCourses, setPurchasedCourses] = useState<Set<number>>(new Set());
  
  const { isConnected, isCorrectNetwork, isLoggedIn } = useAuthStore();
  const isReady = isConnected && isCorrectNetwork;

  const loadCourses = useCallback(async () => {
    if (!isReady) return;
    
    try {
      setLoading(true);
      
      let url = `${API_BASE_URL}/courses`;
      if (authService.isLoggedIn()) {
        url += `?sessionToken=${authService.getSessionToken()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data.courses) {
        const coursesData = data.data.courses.map((apiCourse: any) => ({
          id: apiCourse.courseId,
          title: apiCourse.title || `课程 #${apiCourse.courseId}`,
          description: apiCourse.description || `分类: ${apiCourse.category}`,
          price: apiCourse.price ? apiCourse.price.toString() : "0",
          instructor: apiCourse.instructorAddress || "0x0000",
          isActive: true,
          createdAt: new Date(apiCourse.createdAt).getTime() / 1000,
          category: apiCourse.category,
          coverImageUrl: apiCourse.coverImageUrl,
          hasPurchased: apiCourse.hasPurchased || false
        }));
        setCourses(coursesData);
        
        const purchased = new Set<number>();
        coursesData.forEach((course: Course) => {
          if (course.hasPurchased) {
            purchased.add(course.id);
          }
        });
        setPurchasedCourses(purchased);
      }
    } catch (error) {
      console.error('加载课程失败:', error);
      try {
        const fallbackCourses = await courseService.getCoursesFromContract();
        setCourses(fallbackCourses);
      } catch (fallbackError) {
        console.error('备用课程加载失败:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      loadCourses();
    }
  }, [isReady, isLoggedIn, loadCourses]);

  return {
    courses,
    loading,
    purchasedCourses,
    loadCourses,
    setPurchasedCourses
  };
};