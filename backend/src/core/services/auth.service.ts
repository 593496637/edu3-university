import { ethers } from 'ethers';
import { sessionService } from './session.service';
import { ValidationUtils } from '../../utils/validation';

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
  /**
   * 用户登录验证
   * @param dto - 登录数据传输对象
   * @returns 登录结果，包含会话token和用户信息
   * @throws {Error} 当时间戳过期或签名验证失败时抛出错误
   */
  async login(dto: LoginDto): Promise<LoginResult> {
    // 验证时间戳 (5分钟内有效)
    if (!ValidationUtils.validateTimestamp(dto.timestamp, 5)) {
      throw new Error('登录请求已过期');
    }

    // 标准化钱包地址
    const normalizedAddress = ValidationUtils.normalizeWalletAddress(dto.walletAddress);

    // 验证签名
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(dto.message, dto.signature);
    } catch (signatureError) {
      console.error('签名验证错误:', signatureError);
      throw new Error('签名格式无效');
    }
    
    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      throw new Error('签名验证失败');
    }

    // 创建用户会话 (24小时有效期)
    const sessionToken = await sessionService.createSession(normalizedAddress, 24);

    return {
      sessionToken,
      walletAddress: normalizedAddress,
      expiresIn: 24 * 60 * 60 * 1000 // 24小时，毫秒
    };
  },

  /**
   * 验证用户会话token
   * @param sessionToken - 会话token
   * @returns 验证结果，包含用户地址和验证状态
   */
  async verifySession(sessionToken: string): Promise<{ userAddress: string; isValid: boolean }> {
    const userAddress = await sessionService.validateSession(sessionToken);
    
    return {
      userAddress: userAddress || '',
      isValid: !!userAddress
    };
  },

  /**
   * 用户登出，删除会话token
   * @param sessionToken - 可选的会话token，如果提供则删除对应会话
   */
  async logout(sessionToken?: string): Promise<void> {
    if (sessionToken) {
      await sessionService.deleteSession(sessionToken);
    }
  }
};