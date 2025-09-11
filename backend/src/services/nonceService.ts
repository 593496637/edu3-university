import crypto from 'crypto';

interface NonceRecord {
  nonce: string;
  walletAddress: string;
  timestamp: number;
  expiresAt: number;
}

class NonceService {
  private usedNonces: Map<string, NonceRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // 每5分钟清理过期的nonce
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredNonces();
    }, 5 * 60 * 1000);
  }

  /**
   * 生成新的nonce
   */
  generateNonce(walletAddress: string): string {
    const nonce = crypto.randomUUID();
    const timestamp = Date.now();
    const expiresAt = timestamp + 5 * 60 * 1000; // 5分钟过期

    this.usedNonces.set(nonce, {
      nonce,
      walletAddress: walletAddress.toLowerCase(),
      timestamp,
      expiresAt
    });

    return nonce;
  }

  /**
   * 验证并消费nonce
   */
  validateAndConsumeNonce(nonce: string, walletAddress: string): boolean {
    const record = this.usedNonces.get(nonce);
    
    if (!record) {
      console.log(`Nonce validation failed: nonce not found - ${nonce}`);
      return false;
    }

    // 检查钱包地址是否匹配
    if (record.walletAddress !== walletAddress.toLowerCase()) {
      console.log(`Nonce validation failed: wallet address mismatch - ${nonce}`);
      return false;
    }

    // 检查是否过期
    if (Date.now() > record.expiresAt) {
      console.log(`Nonce validation failed: expired - ${nonce}`);
      this.usedNonces.delete(nonce);
      return false;
    }

    // 验证成功，删除nonce（一次性使用）
    this.usedNonces.delete(nonce);
    console.log(`Nonce validated and consumed: ${nonce}`);
    return true;
  }

  /**
   * 清理过期的nonce
   */
  private cleanupExpiredNonces(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [nonce, record] of this.usedNonces.entries()) {
      if (now > record.expiresAt) {
        this.usedNonces.delete(nonce);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired nonces`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): { totalNonces: number; expiredCount: number } {
    const now = Date.now();
    let expiredCount = 0;

    for (const record of this.usedNonces.values()) {
      if (now > record.expiresAt) {
        expiredCount++;
      }
    }

    return {
      totalNonces: this.usedNonces.size,
      expiredCount
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.usedNonces.clear();
  }
}

export const nonceService = new NonceService();