import { Request, Response, NextFunction } from 'express';
import { courseService } from '../../core/services/course.service';
import { sessionService } from '../../core/services/session.service';

export const courseController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        courseId,
        title = '',
        description = '',
        price = 0,
        instructorAddress = '',
        category = 'Web3',
        coverImageUrl = '',
        txHash = ''
      } = req.body;

      // 参数验证
      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数: courseId'
        });
      }

      const result = await courseService.createCourse({
        courseId,
        title,
        description,
        price,
        instructorAddress,
        category,
        coverImageUrl,
        txHash
      });

      res.status(201).json({
        success: true,
        message: '课程创建成功',
        data: result
      });

    } catch (error) {
      console.error('创建课程失败:', error);
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📋 收到获取课程列表请求');
      
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
      const userAddress = req.user?.address;

      const result = await courseService.getCourseList(page, limit, userAddress);
      
      res.json({
        success: true,
        data: {
          courses: result.courses.map(course => ({
            courseId: course.course_id,
            title: course.title,
            description: course.description,
            price: course.price_yd,
            instructorAddress: course.instructor_address,
            category: course.category,
            coverImageUrl: course.cover_image_url,
            txHash: course.tx_hash,
            createdAt: course.created_at,
            hasPurchased: course.hasPurchased || false,
          })),
          pagination: result.pagination,
          userAddress: userAddress || null
        }
      });
      
      console.log('✅ 课程列表返回成功');
    } catch (error) {
      console.error('获取课程列表失败:', error);
      next(error);
    }
  },

  async getExtras(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      
      const result = await courseService.getCourseExtras(parseInt(courseId));

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      if (error instanceof Error && error.message === '课程不存在') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      console.error('获取课程额外信息失败:', error);
      next(error);
    }
  },

  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const { userAddress, signature, timestamp } = req.body;

      if (!userAddress || !signature || !timestamp) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数: userAddress, signature, timestamp'
        });
      }

      console.log(`🔐 开始验证课程 ${courseId} 访问权限，用户: ${userAddress}`);

      // 1. 检查用户是否有访问权限
      const accessCheck = await courseService.checkCourseAccess(userAddress, parseInt(courseId));

      if (!accessCheck.hasAccess) {
        return res.status(403).json({
          success: false,
          error: '您尚未购买此课程',
          hasPurchased: accessCheck.isPurchased,
          isInstructor: accessCheck.isInstructor
        });
      }

      // 2. 验证签名
      const isValidSignature = await sessionService.validateCourseAccess(
        userAddress,
        parseInt(courseId),
        signature,
        timestamp
      );

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          error: '签名验证失败，请重新生成访问签名',
          hasPurchased: true,
          needsNewSignature: true
        });
      }

      console.log(`✅ 签名验证成功，用户 ${userAddress} 可以访问课程 ${courseId}`);

      // 3. 获取课程详情
      const courseDetails = await courseService.getCourseDetails(parseInt(courseId));

      res.json({
        success: true,
        data: courseDetails
      });

    } catch (error) {
      if (error instanceof Error && error.message === '课程不存在') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      console.error('获取课程详情失败:', error);
      next(error);
    }
  },

  async generateAccessMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const userAddress = req.user!.address;

      // 检查用户是否有访问权限
      const accessCheck = await courseService.checkCourseAccess(userAddress, parseInt(courseId));

      if (!accessCheck.hasAccess) {
        return res.status(403).json({
          success: false,
          error: '您尚未购买此课程',
          hasPurchased: accessCheck.isPurchased,
          isInstructor: accessCheck.isInstructor
        });
      }

      const result = courseService.generateAccessMessage(parseInt(courseId), userAddress);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('生成课程访问消息失败:', error);
      next(error);
    }
  }
};