import { Request, Response, NextFunction } from 'express';
import { nonceService } from '../core/services/nonce.service';

/**
 * Nonce验证中间件
 * 用于验证请求中的nonce参数，增强安全性
 */
export const nonceValidator = (req: Request, res: Response, next: NextFunction) => {
  const { nonce, walletAddress, userAddress } = req.body;
  
  // 如果没有提供nonce，跳过验证（nonce是可选的）
  if (!nonce) {
    return next();
  }

  // 确定要验证的钱包地址
  const addressToVerify = walletAddress || userAddress;
  
  if (!addressToVerify) {
    return res.status(400).json({
      success: false,
      error: '提供nonce时必须包含钱包地址'
    });
  }

  // 验证nonce
  const nonceValid = nonceService.validateAndConsumeNonce(nonce, addressToVerify);
  
  if (!nonceValid) {
    return res.status(401).json({
      success: false,
      error: 'Nonce验证失败或已过期'
    });
  }

  // 验证通过，继续处理请求
  next();
};