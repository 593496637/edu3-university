// 签名管理使用示例

import { signatureManager } from '../utils/signatureManager';
import { useWallet } from '../hooks/useWallet';

// 示例1：用户登录
export const loginExample = async () => {
  const { signer, account } = useWallet();
  
  if (!signer || !account) {
    throw new Error('请先连接钱包');
  }
  
  try {
    // 登录并创建会话
    const session = await signatureManager.login(signer, account);
    
    if (session) {
      console.log('✅ 登录成功');
      console.log('会话Token:', session.sessionToken);
      console.log('用户地址:', session.userAddress);
      return session;
    } else {
      throw new Error('登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

// 示例2：访问课程内容
export const accessCourseExample = async (courseId: string) => {
  const { signer, account } = useWallet();
  
  if (!signer || !account) {
    throw new Error('请先连接钱包');
  }
  
  try {
    // 获取课程访问权限（自动处理缓存）
    const courseDetails = await signatureManager.getCourseAccess(
      signer, 
      account, 
      courseId
    );
    
    if (courseDetails.success) {
      console.log('✅ 课程访问成功');
      console.log('课程内容:', courseDetails.data.content);
      return courseDetails.data;
    } else {
      throw new Error(courseDetails.error || '课程访问失败');
    }
  } catch (error) {
    console.error('课程访问失败:', error);
    throw error;
  }
};

// 示例3：React组件中的完整使用流程
export const CourseDetailPageExample = () => {
  const { signer, account, isConnected } = useWallet();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canAccess, setCanAccess] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    const checkSession = async () => {
      const session = signatureManager.getCurrentSession();
      if (session) {
        const isValid = await signatureManager.verifySession();
        if (!isValid) {
          // 会话无效，需要重新登录
          await signatureManager.logout();
        }
      }
    };
    
    if (isConnected) {
      checkSession();
    }
  }, [isConnected]);

  // 访问课程
  const handleAccessCourse = async (courseId: string) => {
    if (!isConnected || !signer || !account) {
      alert('请先连接钱包');
      return;
    }

    setLoading(true);
    
    try {
      // 检查是否已登录
      let session = signatureManager.getCurrentSession();
      if (!session) {
        console.log('🔐 需要登录，请在MetaMask中确认签名...');
        session = await signatureManager.login(signer, account);
        
        if (!session) {
          throw new Error('登录失败');
        }
      }

      // 访问课程内容
      console.log('📚 获取课程访问权限...');
      const courseDetails = await signatureManager.getCourseAccess(
        signer, 
        account, 
        courseId
      );

      if (courseDetails.success) {
        setCourseData(courseDetails.data);
        setCanAccess(true);
      } else {
        throw new Error(courseDetails.error || '课程访问失败');
      }
    } catch (error: any) {
      console.error('操作失败:', error);
      alert(error.message || '操作失败');
      setCanAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const handleLogout = async () => {
    await signatureManager.logout();
    setCourseData(null);
    setCanAccess(false);
    console.log('✅ 已登出');
  };

  return {
    courseData,
    loading,
    canAccess,
    handleAccessCourse,
    handleLogout
  };
};

// 示例4：自动清理缓存
export const cleanupCacheExample = () => {
  // 手动清理过期缓存
  signatureManager.cleanupExpiredCache();
  
  // 或者在页面卸载时清理
  window.addEventListener('beforeunload', () => {
    signatureManager.cleanupExpiredCache();
  });
};

// 示例5：错误处理最佳实践
export const errorHandlingExample = async (courseId: string) => {
  const { signer, account } = useWallet();
  
  try {
    const courseDetails = await signatureManager.getCourseAccess(
      signer, 
      account, 
      courseId
    );
    
    return courseDetails.data;
  } catch (error: any) {
    // 根据错误类型进行不同处理
    if (error.message?.includes('User rejected')) {
      // 用户拒绝签名
      throw new Error('用户取消签名，无法访问课程');
    } else if (error.message?.includes('expired')) {
      // 签名过期
      throw new Error('访问权限已过期，请重新获取');
    } else if (error.message?.includes('not purchased')) {
      // 未购买课程
      throw new Error('您尚未购买此课程');
    } else {
      // 其他错误
      throw new Error('课程访问失败，请稍后重试');
    }
  }
};