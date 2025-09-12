/**
 * 通用验证工具类
 * 提供各种验证功能，减少代码重复
 */
export class ValidationUtils {
  
  /**
   * 验证时间戳是否在有效范围内
   * @param timestamp - 要验证的时间戳（毫秒）
   * @param maxAgeMinutes - 最大有效时间（分钟），默认5分钟
   * @returns 是否有效
   */
  static validateTimestamp(timestamp: number, maxAgeMinutes: number = 5): boolean {
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - timestamp);
    const maxAge = maxAgeMinutes * 60 * 1000; // 转换为毫秒
    
    return timeDiff <= maxAge;
  }

  /**
   * 验证必需参数是否存在
   * @param params - 要验证的参数对象
   * @param requiredFields - 必需字段数组
   * @returns {isValid: boolean, missingFields: string[]}
   */
  static validateRequiredFields(
    params: Record<string, any>, 
    requiredFields: string[]
  ): { isValid: boolean; missingFields: string[] } {
    const missingFields = requiredFields.filter(field => 
      params[field] === undefined || params[field] === null || params[field] === ''
    );
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * 验证钱包地址格式
   * @param address - 钱包地址
   * @returns 是否为有效格式
   */
  static isValidWalletAddress(address: string): boolean {
    return typeof address === 'string' && 
           address.length === 42 && 
           address.startsWith('0x') &&
           /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * 标准化钱包地址（转换为小写）
   * @param address - 钱包地址
   * @returns 标准化后的地址
   */
  static normalizeWalletAddress(address: string): string {
    if (!this.isValidWalletAddress(address)) {
      throw new Error('Invalid wallet address format');
    }
    return address.toLowerCase();
  }
}