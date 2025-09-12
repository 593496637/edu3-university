import { Request, Response, NextFunction } from 'express';
import { userService } from '../../core/services/user.service';
import { nonceService } from '../../core/services/nonce.service';

export const userController = {
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: '缺少用户地址'
        });
      }

      const user = await userService.getOrCreateUser(address);

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('获取用户信息失败:', error);
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userAddress, nickname, bio, signature, timestamp, nonce } = req.body;

      // 参数验证
      if (!userAddress || !signature || !timestamp) {
        return res.status(400).json({
          success: false,
          error: '缺少签名验证参数'
        });
      }

      // 如果提供了nonce，进行nonce验证（增强安全性）
      if (nonce) {
        const nonceValid = nonceService.validateAndConsumeNonce(nonce, userAddress);
        if (!nonceValid) {
          return res.status(401).json({
            success: false,
            error: 'Nonce验证失败或已过期'
          });
        }
      }

      await userService.updateProfile({
        userAddress,
        nickname,
        bio,
        signature,
        timestamp,
        nonce
      });

      res.json({
        success: true,
        message: '用户资料更新成功'
      });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '签名已过期') {
          return res.status(400).json({
            success: false,
            error: error.message
          });
        }
        if (error.message === '用户不存在') {
          return res.status(404).json({
            success: false,
            error: error.message
          });
        }
      }
      console.error('更新用户资料失败:', error);
      next(error);
    }
  }
};