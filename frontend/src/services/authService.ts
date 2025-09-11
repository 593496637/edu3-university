import { ethers } from 'ethers';
import { nonceService } from './nonceService';
import { authApi } from './api';

const API_BASE_URL = 'http://localhost:3001/api';

export interface LoginResponse {
  success: boolean;
  data?: {
    sessionToken: string;
    walletAddress: string;
    expiresIn: number;
  };
  error?: string;
}

export interface CourseAccessMessage {
  message: string;
  timestamp: number;
  courseId: number;
  userAddress: string;
  expiresAt: string;
}

class AuthService {
  private sessionToken: string | null = null;
  private signatureCache: Map<number, {signature: string, timestamp: number, expiresAt: number}> = new Map();

  constructor() {
    // 从localStorage恢复session
    this.sessionToken = localStorage.getItem('sessionToken');
    // 从localStorage恢复签名缓存
    const cachedSignatures = localStorage.getItem('signatureCache');
    if (cachedSignatures) {
      try {
        const cache = JSON.parse(cachedSignatures);
        this.signatureCache = new Map(Object.entries(cache).map(([key, value]) => [parseInt(key), value as any]));
        console.log('📦 恢复签名缓存:', this.signatureCache.size, '个签名');
      } catch (error) {
        console.warn('恢复签名缓存失败:', error);
      }
    }
  }

  // 登录（生成session，支持nonce机制）
  async login(walletAddress: string, signer: ethers.Signer): Promise<LoginResponse> {
    try {
      // 获取nonce以增强安全性
      let nonce: string | undefined;
      try {
        nonce = await nonceService.getNonce(walletAddress);
      } catch (error) {
        console.warn('获取nonce失败，将使用传统时间戳方式:', error);
      }

      const timestamp = Date.now();
      const message = nonce 
        ? `Login to Web3 Course Platform with nonce ${nonce} at ${timestamp}`
        : `Login to Web3 Course Platform at ${timestamp}`;
      
      // 用户签名
      const signature = await signer.signMessage(message);
      
      // 使用新的API服务
      const result = await authApi.login(walletAddress, signature, message, timestamp, nonce);

      // 如果使用了nonce，在成功后消费它
      if (nonce && result.success) {
        nonceService.consumeNonce(walletAddress);
      }
      
      if (result.success && result.data?.sessionToken) {
        this.sessionToken = result.data.sessionToken;
        localStorage.setItem('sessionToken', this.sessionToken);
      }

      return result;
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // 登出
  async logout(): Promise<void> {
    try {
      if (this.sessionToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionToken: this.sessionToken
          }),
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      this.sessionToken = null;
      this.signatureCache.clear();
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('signatureCache');
      console.log('🗑️ 清理所有缓存数据');
    }
  }

  // 验证session
  async verifySession(): Promise<boolean> {
    if (!this.sessionToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: this.sessionToken
        }),
      });

      const result = await response.json();
      if (!result.success) {
        this.sessionToken = null;
        localStorage.removeItem('sessionToken');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session verification failed:', error);
      this.sessionToken = null;
      localStorage.removeItem('sessionToken');
      return false;
    }
  }

  // 获取课程访问签名消息
  async generateCourseAccessMessage(courseId: number): Promise<CourseAccessMessage | null> {
    if (!this.sessionToken) {
      throw new Error('请先登录');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/generate-access-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`
        },
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '生成访问消息失败');
      }

      return result.data;
    } catch (error) {
      console.error('Generate access message failed:', error);
      throw error;
    }
  }

  // 检查是否有有效的缓存签名
  private getCachedSignature(courseId: number): {signature: string, timestamp: number} | null {
    const cached = this.signatureCache.get(courseId);
    if (!cached) return null;
    
    // 检查是否过期（提前5分钟过期以确保安全）
    const now = Date.now();
    if (now >= cached.expiresAt - 5 * 60 * 1000) {
      this.signatureCache.delete(courseId);
      this.saveSignatureCache();
      return null;
    }
    
    console.log('🎯 使用缓存签名:', courseId, '剩余有效期:', Math.round((cached.expiresAt - now) / 1000 / 60), '分钟');
    return {
      signature: cached.signature,
      timestamp: cached.timestamp
    };
  }
  
  // 保存签名到缓存
  private saveSignature(courseId: number, signature: string, timestamp: number, expiresAt: number) {
    this.signatureCache.set(courseId, { signature, timestamp, expiresAt });
    this.saveSignatureCache();
    console.log('💾 保存签名到缓存:', courseId, '有效期至:', new Date(expiresAt).toLocaleTimeString());
  }
  
  // 持久化签名缓存
  private saveSignatureCache() {
    try {
      const cacheObject = Object.fromEntries(this.signatureCache.entries());
      localStorage.setItem('signatureCache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('保存签名缓存失败:', error);
    }
  }

  // 访问课程详情（带签名验证）
  async accessCourseDetails(courseId: number, userAddress: string, signature: string, timestamp: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          signature,
          timestamp
        }),
      });

      const result = await response.json();
      
      // 如果验证成功，保存签名到缓存
      if (result.success) {
        // 从访问消息中提取过期时间（2小时后）
        const expiresAt = timestamp + 2 * 60 * 60 * 1000;
        this.saveSignature(courseId, signature, timestamp, expiresAt);
      }
      
      return result;
    } catch (error) {
      console.error('Access course details failed:', error);
      throw error;
    }
  }
  
  // 智能课程访问 - 优先使用缓存签名
  async accessCourseWithCache(courseId: number, userAddress: string, signer: any) {
    // 1. 先检查缓存签名
    const cachedSig = this.getCachedSignature(courseId);
    if (cachedSig) {
      console.log('🚀 使用缓存签名直接访问课程');
      return await this.accessCourseDetails(courseId, userAddress, cachedSig.signature, cachedSig.timestamp);
    }
    
    // 2. 缓存签名无效，生成新签名
    console.log('🔑 生成新的课程访问签名');
    const accessMessage = await this.generateCourseAccessMessage(courseId);
    const signature = await signer.signMessage(accessMessage.message);
    
    // 3. 使用新签名访问
    return await this.accessCourseDetails(courseId, userAddress, signature, accessMessage.timestamp);
  }

  // 获取当前session token
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    return !!this.sessionToken;
  }

  // 优化方法：登录并直接访问课程（减少签名次数）
  async loginAndAccessCourse(courseId: number, walletAddress: string, signer: ethers.Signer) {
    try {
      // 1. 先完成登录
      const loginResult = await this.login(walletAddress, signer);
      if (!loginResult.success) {
        return {
          success: false,
          error: '登录失败: ' + loginResult.error,
          needsNewSignature: false
        };
      }

      // 2. 检查是否有缓存签名（登录后可能有之前的缓存）
      const cachedSig = this.getCachedSignature(courseId);
      if (cachedSig) {
        console.log('🚀 登录后使用缓存签名访问课程');
        return await this.accessCourseDetails(courseId, walletAddress, cachedSig.signature, cachedSig.timestamp);
      }

      // 3. 无缓存签名，需要新的课程访问签名
      console.log('🔑 登录后生成课程访问签名');
      const accessMessage = await this.generateCourseAccessMessage(courseId);
      const signature = await signer.signMessage(accessMessage.message);
      
      return await this.accessCourseDetails(courseId, walletAddress, signature, accessMessage.timestamp);
    } catch (error) {
      console.error('登录并访问课程失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        needsNewSignature: false
      };
    }
  }
}

export const authService = new AuthService();