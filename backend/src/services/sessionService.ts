import { pool } from '../database';
import crypto from 'crypto';
import { ethers } from 'ethers';

export interface SessionData {
  sessionToken: string;
  userAddress: string;
  expiresAt: Date;
}

export interface CourseAccessToken {
  userAddress: string;
  courseId: number;
  signature: string;
  signedMessage: string;
  expiresAt: Date;
}

export class SessionService {
  // 生成随机session token
  private generateSessionToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // 创建用户会话
  async createSession(userAddress: string, durationHours: number = 24): Promise<string> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    try {
      // 先删除该用户的旧session
      await pool.execute(
        'DELETE FROM user_sessions WHERE user_address = ?',
        [userAddress.toLowerCase()]
      );

      // 创建新session
      await pool.execute(
        'INSERT INTO user_sessions (user_address, session_token, expires_at) VALUES (?, ?, ?)',
        [userAddress.toLowerCase(), sessionToken, expiresAt]
      );

      console.log(`✅ 为用户 ${userAddress} 创建会话，有效期至: ${expiresAt}`);
      return sessionToken;
    } catch (error) {
      console.error('创建用户会话失败:', error);
      throw new Error('Failed to create session');
    }
  }

  // 验证session token
  async validateSession(sessionToken: string): Promise<string | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT user_address, expires_at FROM user_sessions WHERE session_token = ? AND expires_at > NOW()',
        [sessionToken]
      ) as any;

      if (rows.length === 0) {
        return null;
      }

      const { user_address } = rows[0];
      return user_address;
    } catch (error) {
      console.error('验证session失败:', error);
      return null;
    }
  }

  // 删除session
  async deleteSession(sessionToken: string): Promise<void> {
    try {
      await pool.execute(
        'DELETE FROM user_sessions WHERE session_token = ?',
        [sessionToken]
      );
    } catch (error) {
      console.error('删除session失败:', error);
    }
  }

  // 存储课程访问签名
  async storeCourseAccessToken(
    userAddress: string,
    courseId: number,
    signature: string,
    signedMessage: string,
    durationHours: number = 2
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    try {
      // 使用 REPLACE INTO 来处理重复记录
      await pool.execute(`
        REPLACE INTO course_access_tokens 
        (user_address, course_id, signature, signed_message, expires_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [userAddress.toLowerCase(), courseId, signature, signedMessage, expiresAt]);

      console.log(`✅ 存储课程 ${courseId} 访问令牌，用户: ${userAddress}, 有效期至: ${expiresAt}`);
    } catch (error) {
      console.error('存储课程访问令牌失败:', error);
      throw new Error('Failed to store course access token');
    }
  }

  // 验证课程访问签名
  async validateCourseAccess(
    userAddress: string,
    courseId: number,
    signature: string,
    timestamp: number
  ): Promise<boolean> {
    try {
      // 1. 检查数据库中的缓存签名
      const [rows] = await pool.execute(`
        SELECT signature, signed_message, expires_at 
        FROM course_access_tokens 
        WHERE user_address = ? AND course_id = ? AND expires_at > NOW()
      `, [userAddress.toLowerCase(), courseId]) as any;

      if (rows.length > 0) {
        const { signature: storedSignature } = rows[0];
        if (storedSignature === signature) {
          console.log(`✅ 使用缓存的课程访问令牌: ${userAddress} -> ${courseId}`);
          return true;
        }
      }

      // 2. 验证新的签名
      const currentTime = Date.now();
      const timeDiff = Math.abs(currentTime - timestamp);
      const maxAge = 5 * 60 * 1000; // 5分钟

      if (timeDiff > maxAge) {
        console.log(`❌ 签名时间戳过期: ${timeDiff}ms > ${maxAge}ms`);
        return false;
      }

      // 3. 验证签名格式和地址
      const expiry = timestamp + 2 * 60 * 60 * 1000; // 2小时有效期
      const expectedMessage = `Access course ${courseId} valid until ${expiry}`;
      
      try {
        const recoveredAddress = ethers.verifyMessage(expectedMessage, signature);
        if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
          console.log(`❌ 签名地址不匹配: ${recoveredAddress} vs ${userAddress}`);
          return false;
        }

        // 4. 存储有效的新签名到数据库
        await this.storeCourseAccessToken(userAddress, courseId, signature, expectedMessage, 2);
        return true;
      } catch (signatureError) {
        console.log('❌ 签名验证失败:', signatureError);
        return false;
      }
    } catch (error) {
      console.error('验证课程访问失败:', error);
      return false;
    }
  }

  // 清理过期的token
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // 清理过期的session
      const [sessionResult] = await pool.execute(
        'DELETE FROM user_sessions WHERE expires_at <= NOW()'
      ) as any;

      // 清理过期的课程访问令牌
      const [tokenResult] = await pool.execute(
        'DELETE FROM course_access_tokens WHERE expires_at <= NOW()'
      ) as any;

      console.log(`🧹 清理过期令牌: ${sessionResult.affectedRows} 个session, ${tokenResult.affectedRows} 个访问令牌`);
    } catch (error) {
      console.error('清理过期令牌失败:', error);
    }
  }
}

export const sessionService = new SessionService();

// 定期清理过期token (每小时执行一次)
setInterval(() => {
  sessionService.cleanupExpiredTokens();
}, 60 * 60 * 1000);