import { Request, Response, NextFunction } from 'express';
import { purchaseService } from '../../core/services/purchase.service';

export const purchaseController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { userAddress, courseId, txHash, pricePaid } = req.body;

      // 参数验证
      if (!userAddress || !courseId || !txHash) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数'
        });
      }

      const result = await purchaseService.createPurchase({
        userAddress,
        courseId,
        txHash,
        pricePaid
      });

      res.json({
        success: true,
        message: '购买记录成功',
        data: result
      });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '交易已记录') {
          return res.status(400).json({
            success: false,
            error: error.message
          });
        }
        if (error.message === '课程不存在') {
          return res.status(404).json({
            success: false,
            error: error.message
          });
        }
      }
      console.error('记录购买失败:', error);
      next(error);
    }
  },

  async getUserPurchases(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: '缺少用户地址'
        });
      }

      const purchases = await purchaseService.getUserPurchases(address);

      res.json({
        success: true,
        data: purchases
      });

    } catch (error) {
      console.error('获取购买记录失败:', error);
      next(error);
    }
  }
};