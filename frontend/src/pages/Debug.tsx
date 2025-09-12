import { useState, useEffect } from 'react';
import { courseService } from '../services/courseService';
import { useAuthStore } from '../store/authStore';
import type { CourseData } from '../types/contracts';

export default function Debug() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account, isConnected } = useAuthStore();

  const testApiCall = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('开始测试API调用...');
      const result = await courseService.getCoursesFromAPI();
      console.log('API调用结果:', result);
      setCourses(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      console.error('API调用失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const testContractCall = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('开始测试合约调用...');
      const result = await courseService.getCoursesFromContract();
      console.log('合约调用结果:', result);
      setCourses(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      console.error('合约调用失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const testPurchaseStatus = async () => {
    if (!account || courses.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('开始测试购买状态检查...');
      for (const course of courses) {
        if (course.id) {
          const hasPurchased = await courseService.hasPurchased(account, course.id);
          console.log(`课程 ${course.title} (ID: ${course.id}) 购买状态:`, hasPurchased);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      console.error('购买状态检查失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testApiCall();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">调试页面</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">连接状态</h2>
          <div className="space-y-2 text-gray-300">
            <div>账户: {account || '未连接'}</div>
            <div>连接状态: {isConnected ? '已连接' : '未连接'}</div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">测试按钮</h2>
          <div className="space-x-4">
            <button
              onClick={testApiCall}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              测试API调用
            </button>
            <button
              onClick={testContractCall}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              测试合约调用
            </button>
            <button
              onClick={testPurchaseStatus}
              disabled={loading || !account || courses.length === 0}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              测试购买状态
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-yellow-800 p-4 rounded-lg mb-6">
            <div className="text-yellow-200">加载中...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-800 p-4 rounded-lg mb-6">
            <div className="text-red-200">错误: {error}</div>
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">课程数据 ({courses.length})</h2>
          {courses.length === 0 ? (
            <div className="text-gray-400">没有课程数据</div>
          ) : (
            <div className="space-y-4">
              {courses.map((course, index) => (
                <div key={course.id || index} className="bg-gray-700 p-4 rounded">
                  <h3 className="text-white font-semibold">{course.title}</h3>
                  <div className="text-gray-300 text-sm mt-2 space-y-1">
                    <div>ID: {course.id}</div>
                    <div>讲师: {course.instructor}</div>
                    <div>价格: {course.price} YD</div>
                    <div>描述: {course.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}