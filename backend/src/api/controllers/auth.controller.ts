import { Request, Response, NextFunction } from 'express';
import { authService } from '../../core/services/auth.service';
import { nonceService } from '../../core/services/nonce.service';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletAddress, signature, message, timestamp, nonce } = req.body;

      if (!walletAddress || !signature || !message || !timestamp) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数'
        });
      }

      // 如果提供了nonce，进行nonce验证（增强安全性）
      if (nonce) {
        const nonceValid = nonceService.validateAndConsumeNonce(nonce, walletAddress);
        if (!nonceValid) {
          return res.status(401).json({
            success: false,
            error: 'Nonce验证失败或已过期'
          });
        }
      }

      const result = await authService.login({
        walletAddress,
        signature,
        message,
        timestamp,
        nonce
      });

      res.json({
        success: true,
        data: result,
        message: '登录成功'
      });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '登录请求已过期') {
          return res.status(400).json({
            success: false,
            error: error.message
          });
        }
        if (error.message === '签名验证失败' || error.message === '签名格式无效') {
          return res.status(401).json({
            success: false,
            error: error.message
          });
        }
      }
      console.error('登录失败:', error);
      next(error);
    }
  },

  async verifySession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(400).json({
          success: false,
          error: '缺少session token'
        });
      }

      const result = await authService.verifySession(sessionToken);

      if (!result.isValid) {
        return res.status(401).json({
          success: false,
          error: '会话已过期或无效'
        });
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('验证会话失败:', error);
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionToken } = req.body;

      await authService.logout(sessionToken);

      res.json({
        success: true,
        message: '登出成功'
      });

    } catch (error) {
      console.error('登出失败:', error);
      next(error);
    }
  }
};