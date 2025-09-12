import { userRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto, User } from '../models/User';
import { ValidationUtils } from '../../utils/validation';

interface UpdateProfileDto {
  userAddress: string;
  nickname?: string;
  bio?: string;
  signature: string;
  timestamp: number;
  nonce?: string;
}

export const userService = {
  /**
   * 获取或创建用户
   * 如果用户不存在则自动创建新用户
   * @param walletAddress - 用户的钱包地址
   * @returns 用户信息对象
   */
  async getOrCreateUser(walletAddress: string): Promise<User> {
    // 标准化钱包地址
    const normalizedAddress = ValidationUtils.normalizeWalletAddress(walletAddress);
    
    // 查询用户信息
    let user = await userRepository.findByWalletAddress(normalizedAddress);

    if (!user) {
      // 用户不存在，自动创建
      const result = await userRepository.create({
        walletAddress: normalizedAddress
      });

      // 返回新创建的用户信息
      user = {
        id: result.insertId,
        wallet_address: normalizedAddress,
        nickname: null,
        bio: null,
        created_at: new Date(),
        updated_at: new Date()
      };
    }

    return user;
  },

  /**
   * 根据钱包地址获取用户信息
   * @param walletAddress - 用户的钱包地址
   * @returns 用户信息对象，如果不存在则返回null
   */
  async getUserByAddress(walletAddress: string): Promise<User | null> {
    const normalizedAddress = ValidationUtils.normalizeWalletAddress(walletAddress);
    return userRepository.findByWalletAddress(normalizedAddress);
  },

  /**
   * 更新用户资料
   * @param dto - 包含用户资料更新信息的对象
   * @throws {Error} 当签名过期或用户不存在时抛出错误
   */
  async updateProfile(dto: UpdateProfileDto): Promise<void> {
    // 验证时间戳（5分钟内有效）
    if (!ValidationUtils.validateTimestamp(dto.timestamp, 5)) {
      throw new Error('签名已过期');
    }

    // 标准化钱包地址
    const normalizedAddress = ValidationUtils.normalizeWalletAddress(dto.userAddress);

    // 检查用户是否存在
    const user = await userRepository.findByWalletAddress(normalizedAddress);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 更新用户资料
    await userRepository.update(normalizedAddress, {
      nickname: dto.nickname,
      bio: dto.bio
    });
  },

  /**
   * 创建新用户
   * @param dto - 创建用户数据传输对象
   * @returns 新创建的用户信息
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    const normalizedAddress = ValidationUtils.normalizeWalletAddress(dto.walletAddress);
    const result = await userRepository.create({
      ...dto,
      walletAddress: normalizedAddress
    });
    
    return {
      id: result.insertId,
      wallet_address: normalizedAddress,
      nickname: dto.nickname || null,
      bio: dto.bio || null,
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  /**
   * 更新用户信息
   * @param walletAddress - 用户钱包地址
   * @param dto - 更新用户数据传输对象
   */
  async updateUser(walletAddress: string, dto: UpdateUserDto): Promise<void> {
    const normalizedAddress = ValidationUtils.normalizeWalletAddress(walletAddress);
    await userRepository.update(normalizedAddress, dto);
  },

  /**
   * 删除用户
   * @param walletAddress - 用户钱包地址
   */
  async deleteUser(walletAddress: string): Promise<void> {
    const normalizedAddress = ValidationUtils.normalizeWalletAddress(walletAddress);
    await userRepository.delete(normalizedAddress);
  }
};