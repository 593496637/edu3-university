import { userRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto, User } from '../models/User';

interface UpdateProfileDto {
  userAddress: string;
  nickname?: string;
  bio?: string;
  signature: string;
  timestamp: number;
  nonce?: string;
}

export const userService = {
  async getOrCreateUser(walletAddress: string): Promise<User> {
    // 查询用户信息
    let user = await userRepository.findByWalletAddress(walletAddress);

    if (!user) {
      // 用户不存在，自动创建
      const result = await userRepository.create({
        walletAddress
      });

      // 返回新创建的用户信息
      user = {
        id: result.insertId,
        wallet_address: walletAddress,
        nickname: null,
        bio: null,
        created_at: new Date(),
        updated_at: new Date()
      };
    }

    return user;
  },

  async getUserByAddress(walletAddress: string): Promise<User | null> {
    return userRepository.findByWalletAddress(walletAddress);
  },

  async updateProfile(dto: UpdateProfileDto): Promise<void> {
    // 验证时间戳（5分钟内有效）
    const now = Date.now();
    const timestampMs = dto.timestamp;
    const timeDiff = Math.abs(now - timestampMs) / 1000; // 转换为秒进行比较
    
    if (timeDiff > 300) { // 5分钟 = 300秒
      throw new Error('签名已过期');
    }

    // 检查用户是否存在
    const user = await userRepository.findByWalletAddress(dto.userAddress);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 更新用户资料
    await userRepository.update(dto.userAddress, {
      nickname: dto.nickname,
      bio: dto.bio
    });
  },

  async createUser(dto: CreateUserDto): Promise<User> {
    const result = await userRepository.create(dto);
    
    return {
      id: result.insertId,
      wallet_address: dto.walletAddress,
      nickname: dto.nickname || null,
      bio: dto.bio || null,
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async updateUser(walletAddress: string, dto: UpdateUserDto): Promise<void> {
    await userRepository.update(walletAddress, dto);
  },

  async deleteUser(walletAddress: string): Promise<void> {
    await userRepository.delete(walletAddress);
  }
};