import { Request, Response, NextFunction } from 'express';
import { userService } from '../../core/services/user.service';
import { BaseController } from './BaseController';

/**
 * 用户管理控制器
 * 处理用户信息获取和资料更新功能
 */
class UserController extends BaseController {

  /**
   * 获取用户信息（如果不存在则自动创建）
   * @param req - 包含用户地址的请求
   * @param res - 响应对象
   * @param next - 下一个中间件函数
   */
  getUser = this.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { address } = req.params;

    if (!address) {
      return this.error(res, 400, '缺少用户地址');
    }

    try {
      const user = await userService.getOrCreateUser(address);
      this.success(res, user);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      this.handleServiceError(error, res, next);
    }
  });

  /**
   * 更新用户资料
   * @param req - 包含用户资料信息的请求
   * @param res - 响应对象
   * @param next - 下一个中间件函数
   */
  updateProfile = this.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userAddress, nickname, bio, signature, timestamp, nonce } = req.body;

    // 验证必需参数
    if (!this.validateRequiredFields(req, res, ['userAddress', 'signature', 'timestamp'])) {
      return;
    }

    // 验证时间戳
    if (!this.validateTimestamp(res, timestamp)) {
      return;
    }

    try {
      await userService.updateProfile({
        userAddress,
        nickname,
        bio,
        signature,
        timestamp,
        nonce
      });

      this.success(res, undefined, '用户资料更新成功');
    } catch (error) {
      console.error('更新用户资料失败:', error);
      this.handleServiceError(error, res, next);
    }
  });
}

// 导出控制器实例
export const userController = new UserController();