import { Request, Response, NextFunction } from 'express';
import { authService } from '../../core/services/auth.service';
import { BaseController } from './BaseController';

/**
 * 用户认证控制器
 * 处理用户登录、会话验证和登出功能
 */
class AuthController extends BaseController {
  
  /**
   * 用户登录
   * @param req - 包含登录信息的请求
   * @param res - 响应对象
   * @param next - 下一个中间件函数
   */
  login = this.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { walletAddress, signature, message, timestamp, nonce } = req.body;

    // 验证必需参数
    if (!this.validateRequiredFields(req, res, ['walletAddress', 'signature', 'message', 'timestamp'])) {
      return;
    }

    // 验证时间戳
    if (!this.validateTimestamp(res, timestamp)) {
      return;
    }

    try {
      const result = await authService.login({
        walletAddress,
        signature,
        message,
        timestamp,
        nonce
      });

      this.success(res, result, '登录成功');
    } catch (error) {
      console.error('登录失败:', error);
      this.handleServiceError(error, res, next);
    }
  });

  /**
   * 验证用户会话
   * @param req - 包含sessionToken的请求
   * @param res - 响应对象
   * @param next - 下一个中间件函数
   */
  verifySession = this.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionToken } = req.body;

    // 验证必需参数
    if (!this.validateRequiredFields(req, res, ['sessionToken'])) {
      return;
    }

    try {
      const result = await authService.verifySession(sessionToken);

      if (!result.isValid) {
        return this.error(res, 401, '会话已过期或无效');
      }

      this.success(res, result);
    } catch (error) {
      console.error('验证会话失败:', error);
      this.handleServiceError(error, res, next);
    }
  });

  /**
   * 用户登出
   * @param req - 可选包含sessionToken的请求
   * @param res - 响应对象
   * @param next - 下一个中间件函数
   */
  logout = this.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionToken } = req.body;

    try {
      await authService.logout(sessionToken);
      this.success(res, undefined, '登出成功');
    } catch (error) {
      console.error('登出失败:', error);
      this.handleServiceError(error, res, next);
    }
  });
}

// 导出控制器实例
export const authController = new AuthController();