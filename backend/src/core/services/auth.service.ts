import { ethers } from 'ethers';
import { sessionService } from './session.service';

interface LoginDto {
  walletAddress: string;
  signature: string;
  message: string;
  timestamp: number;
  nonce?: string;
}

interface LoginResult {
  sessionToken: string;
  walletAddress: string;
  expiresIn: number;
}

export const authService = {
  async login(dto: LoginDto): Promise<LoginResult> {
    // 验证时间戳 (5分钟内有效)
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - dto.timestamp);
    
    if (timeDiff > 5 * 60 * 1000) {
      throw new Error('登录请求已过期');
    }

    // 验证签名
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(dto.message, dto.signature);
    } catch (signatureError) {
      console.error('签名验证错误:', signatureError);
      throw new Error('签名格式无效');
    }
    
    if (recoveredAddress.toLowerCase() !== dto.walletAddress.toLowerCase()) {
      throw new Error('签名验证失败');
    }

    // 创建用户会话 (24小时有效期)
    const sessionToken = await sessionService.createSession(dto.walletAddress, 24);

    return {
      sessionToken,
      walletAddress: dto.walletAddress.toLowerCase(),
      expiresIn: 24 * 60 * 60 * 1000 // 24小时，毫秒
    };
  },

  async verifySession(sessionToken: string): Promise<{ userAddress: string; isValid: boolean }> {
    const userAddress = await sessionService.validateSession(sessionToken);
    
    return {
      userAddress: userAddress || '',
      isValid: !!userAddress
    };
  },

  async logout(sessionToken?: string): Promise<void> {
    if (sessionToken) {
      await sessionService.deleteSession(sessionToken);
    }
  }
};