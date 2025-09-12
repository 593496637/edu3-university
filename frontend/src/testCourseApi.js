// 测试课程API调用
import { courseService } from './services/courseService.js';

async function testCourseApi() {
  try {
    console.log('开始测试课程API...');
    
    // 测试从API获取课程
    const courses = await courseService.getCoursesFromAPI();
    console.log('从API获取的课程数据:', courses);
    console.log('课程数量:', courses.length);
    
    if (courses.length > 0) {
      console.log('第一个课程:', courses[0]);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 在控制台中可以调用 testCourseApi()
window.testCourseApi = testCourseApi;