import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../core/services/session.service';

// 扩展Request接口添加user信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
      };
    }
  }
}

// 可选的身份验证中间件 - 如果有token则验证，没有也不报错
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.replace('Bearer ', '') || req.query.sessionToken as string;
    
    if (sessionToken) {
      const userAddress = await sessionService.validateSession(sessionToken);
      if (userAddress) {
        req.user = { address: userAddress };
      }
    }
    
    next();
  } catch (error) {
    // 可选验证失败不阻塞请求
    console.warn('Optional auth failed:', error);
    next();
  }
}

// 必需的身份验证中间件 - 必须有有效token
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.replace('Bearer ', '') || req.body.sessionToken || req.query.sessionToken as string;
    
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: '需要登录'
      });
    }
    
    const userAddress = await sessionService.validateSession(sessionToken);
    if (!userAddress) {
      return res.status(401).json({
        success: false,
        error: '会话已过期或无效'
      });
    }
    
    req.user = { address: userAddress };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: '身份验证失败'
    });
  }
}