import { Request, Response, NextFunction } from 'express';
import { nonceService } from '../../core/services/nonce.service';

export const nonceController = {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: '缺少钱包地址参数'
        });
      }

      // 验证钱包地址格式
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({
          success: false,
          error: '无效的钱包地址格式'
        });
      }

      const nonce = nonceService.generateNonce(walletAddress);

      res.json({
        success: true,
        data: {
          nonce,
          expiresIn: 5 * 60, // 5分钟，单位：秒
          message: `请使用此nonce进行签名验证: ${nonce}`
        }
      });

    } catch (error) {
      console.error('生成nonce失败:', error);
      next(error);
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = nonceService.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取nonce统计失败:', error);
      next(error);
    }
  }
};