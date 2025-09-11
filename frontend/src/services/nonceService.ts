import { nonceApi } from './api';

interface NonceData {
  nonce: string;
  expiresAt: number;
  walletAddress: string;
}

class NonceService {
  private nonceCache: Map<string, NonceData> = new Map();

  /**
   * 获取或生成nonce
   */
  async getNonce(walletAddress: string): Promise<string> {
    try {
      // 检查缓存中是否有有效的nonce
      const cached = this.nonceCache.get(walletAddress.toLowerCase());
      if (cached && Date.now() < cached.expiresAt) {
        console.log(`使用缓存的nonce: ${cached.nonce.slice(0, 8)}...`);
        return cached.nonce;
      }

      // 从服务器获取新的nonce
      const response = await nonceApi.generate(walletAddress);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '获取nonce失败');
      }

      const { nonce, expiresIn } = response.data;
      const expiresAt = Date.now() + (expiresIn * 1000); // 转换为毫秒

      // 缓存nonce
      this.nonceCache.set(walletAddress.toLowerCase(), {
        nonce,
        expiresAt,
        walletAddress: walletAddress.toLowerCase()
      });

      console.log(`获取新nonce成功: ${nonce.slice(0, 8)}...`);
      return nonce;

    } catch (error) {
      console.error('获取nonce失败:', error);
      throw error;
    }
  }

  /**
   * 消费nonce（使用后从缓存中删除）
   */
  consumeNonce(walletAddress: string): void {
    const key = walletAddress.toLowerCase();
    if (this.nonceCache.has(key)) {
      console.log(`消费nonce: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
      this.nonceCache.delete(key);
    }
  }

  /**
   * 清理过期的nonce缓存
   */
  cleanupExpiredNonces(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, data] of this.nonceCache.entries()) {
      if (now >= data.expiresAt) {
        this.nonceCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`清理了 ${cleanedCount} 个过期的nonce缓存`);
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { totalCached: number; validCount: number } {
    const now = Date.now();
    let validCount = 0;

    for (const data of this.nonceCache.values()) {
      if (now < data.expiresAt) {
        validCount++;
      }
    }

    return {
      totalCached: this.nonceCache.size,
      validCount
    };
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.nonceCache.clear();
    console.log('已清空所有nonce缓存');
  }
}

// 创建单例实例
export const nonceService = new NonceService();

// 每2分钟清理一次过期缓存
setInterval(() => {
  nonceService.cleanupExpiredNonces();
}, 2 * 60 * 1000);