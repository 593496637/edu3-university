import { Request, Response, NextFunction } from 'express';
import { ValidationUtils } from '../../utils/validation';

/**
 * 控制器基类
 * 提供通用的响应和错误处理方法
 */
export abstract class BaseController {
  
  /**
   * 成功响应的标准格式
   * @param res - Express响应对象
   * @param data - 响应数据
   * @param message - 响应消息
   */
  protected success(res: Response, data?: any, message?: string) {
    return res.json({
      success: true,
      data,
      message
    });
  }

  /**
   * 错误响应的标准格式
   * @param res - Express响应对象
   * @param statusCode - HTTP状态码
   * @param error - 错误消息
   */
  protected error(res: Response, statusCode: number, error: string) {
    return res.status(statusCode).json({
      success: false,
      error
    });
  }

  /**
   * 验证必需参数
   * @param req - Express请求对象
   * @param res - Express响应对象
   * @param requiredFields - 必需字段数组
   * @returns 验证是否通过
   */
  protected validateRequiredFields(
    req: Request, 
    res: Response, 
    requiredFields: string[]
  ): boolean {
    const validation = ValidationUtils.validateRequiredFields(req.body, requiredFields);
    
    if (!validation.isValid) {
      this.error(res, 400, `缺少必要参数: ${validation.missingFields.join(', ')}`);
      return false;
    }
    
    return true;
  }

  /**
   * 验证时间戳
   * @param res - Express响应对象
   * @param timestamp - 时间戳
   * @param maxAgeMinutes - 最大有效时间（分钟）
   * @returns 验证是否通过
   */
  protected validateTimestamp(
    res: Response, 
    timestamp: number, 
    maxAgeMinutes: number = 5
  ): boolean {
    if (!ValidationUtils.validateTimestamp(timestamp, maxAgeMinutes)) {
      this.error(res, 400, '请求时间戳已过期');
      return false;
    }
    
    return true;
  }

  /**
   * 异步处理器包装器，自动处理未捕获的错误
   * @param fn - 异步处理函数
   */
  protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * 处理常见的服务错误
   * @param error - 错误对象
   * @param res - Express响应对象
   * @param next - Express next函数
   */
  protected handleServiceError(error: any, res: Response, next: NextFunction) {
    if (error instanceof Error) {
      // 处理已知的业务错误
      const knownErrors: Record<string, number> = {
        '登录请求已过期': 400,
        '签名已过期': 400,
        '签名验证失败': 401,
        '签名格式无效': 401,
        '会话已过期或无效': 401,
        '用户不存在': 404,
        '课程不存在': 404,
      };

      const statusCode = knownErrors[error.message];
      if (statusCode) {
        return this.error(res, statusCode, error.message);
      }
    }
    
    // 未知错误交给全局错误处理器
    next(error);
  }
}