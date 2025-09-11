import { authApi, courseApi } from '../services/api';

export interface UserSession {
  sessionToken: string;
  userAddress: string;
  expiresAt: number;
}

export interface CourseAccessCache {
  signature: string;
  timestamp: number;
  expiry: number;
  courseId: string;
  userAddress: string;
}

export class SignatureManager {
  private readonly ACCESS_TOKEN_DURATION = 2 * 60 * 60 * 1000; // 2小时
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24小时

  // 用户登录 - 创建会话
  async login(signer: any, userAddress: string): Promise<UserSession | null> {
    try {
      const timestamp = Date.now();
      const message = `Login to Web3 Education Platform at ${timestamp}`;
      
      console.log('🔐 请在MetaMask中确认登录签名...');
      const signature = await signer.signMessage(message);
      
      // 提交到后端验证并创建会话
      const response = await authApi.login(userAddress, signature, message, timestamp);
      
      if (response.success && response.data) {
        const session: UserSession = {
          sessionToken: response.data.sessionToken,
          userAddress: response.data.walletAddress,
          expiresAt: Date.now() + this.SESSION_DURATION,
        };
        
        // 保存到本地存储
        localStorage.setItem('user_session', JSON.stringify(session));
        console.log('✅ 登录成功，会话已创建');
        
        return session;
      }
      
      return null;
    } catch (error) {
      console.error('❌ 登录失败:', error);
      return null;
    }
  }

  // 获取当前用户会话
  getCurrentSession(): UserSession | null {
    try {
      const sessionStr = localStorage.getItem('user_session');
      if (!sessionStr) return null;
      
      const session: UserSession = JSON.parse(sessionStr);
      
      // 检查是否过期
      if (Date.now() >= session.expiresAt) {
        this.logout();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('获取会话失败:', error);
      return null;
    }
  }

  // 验证会话有效性
  async verifySession(): Promise<boolean> {
    const session = this.getCurrentSession();
    if (!session) return false;
    
    try {
      const response = await authApi.verifySession(session.sessionToken);
      return response.success;
    } catch (error) {
      console.error('验证会话失败:', error);
      return false;
    }
  }

  // 登出
  async logout(): Promise<void> {
    const session = this.getCurrentSession();
    
    if (session) {
      try {
        await authApi.logout(session.sessionToken);
      } catch (error) {
        console.error('后端登出失败:', error);
      }
    }
    
    // 清理本地存储
    localStorage.removeItem('user_session');
    
    // 清理所有课程访问缓存
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('course_access_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ 已登出并清理缓存');
  }

  // 获取课程访问权限（带缓存）
  async getCourseAccess(signer: any, userAddress: string, courseId: string): Promise<any> {
    const cacheKey = `course_access_${courseId}_${userAddress}`;
    
    try {
      // 1. 检查本地缓存
      const cachedAccess = this.getCachedCourseAccess(cacheKey);
      if (cachedAccess) {
        console.log(`✅ 使用缓存的课程访问权限: ${courseId}`);
        return await this.requestCourseDetails(courseId, userAddress, cachedAccess.signature, cachedAccess.timestamp);
      }
      
      // 2. 生成新的访问签名
      console.log(`🔐 生成课程 ${courseId} 的访问签名...`);
      const timestamp = Date.now();
      const expiry = timestamp + this.ACCESS_TOKEN_DURATION;
      const message = `Access course ${courseId} valid until ${expiry}`;
      
      const signature = await signer.signMessage(message);
      
      // 3. 缓存签名
      const accessCache: CourseAccessCache = {
        signature,
        timestamp,
        expiry,
        courseId,
        userAddress,
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(accessCache));
      
      // 4. 请求课程详情
      return await this.requestCourseDetails(courseId, userAddress, signature, timestamp);
      
    } catch (error) {
      console.error('❌ 获取课程访问权限失败:', error);
      throw error;
    }
  }

  // 检查缓存的课程访问权限
  private getCachedCourseAccess(cacheKey: string): CourseAccessCache | null {
    try {
      const cachedStr = localStorage.getItem(cacheKey);
      if (!cachedStr) return null;
      
      const cached: CourseAccessCache = JSON.parse(cachedStr);
      
      // 检查是否过期（提前10分钟刷新）
      const refreshThreshold = 10 * 60 * 1000;
      if (Date.now() >= (cached.expiry - refreshThreshold)) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return cached;
    } catch (error) {
      console.error('解析缓存失败:', error);
      return null;
    }
  }

  // 请求课程详情
  private async requestCourseDetails(courseId: string, userAddress: string, signature: string, timestamp: number) {
    try {
      const response = await courseApi.getCourseDetails(courseId, userAddress, signature, timestamp);
      
      if (!response.success) {
        // 如果签名验证失败，清理相关缓存
        const cacheKey = `course_access_${courseId}_${userAddress}`;
        localStorage.removeItem(cacheKey);
        throw new Error(response.error || '课程访问失败');
      }
      
      return response;
    } catch (error) {
      console.error('请求课程详情失败:', error);
      throw error;
    }
  }

  // 清理过期缓存
  cleanupExpiredCache(): void {
    const keys = Object.keys(localStorage);
    let cleanedCount = 0;
    
    keys.forEach(key => {
      if (key.startsWith('course_access_')) {
        try {
          const cached: CourseAccessCache = JSON.parse(localStorage.getItem(key) || '');
          if (Date.now() >= cached.expiry) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // 解析失败的也删除
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期的课程访问缓存`);
    }
  }
}

// 创建全局实例
export const signatureManager = new SignatureManager();

// 定期清理过期缓存（每5分钟）
setInterval(() => {
  signatureManager.cleanupExpiredCache();
}, 5 * 60 * 1000);