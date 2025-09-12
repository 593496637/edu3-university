import { Router } from 'express';
import { courseController } from '../controllers/course.controller';
import { optionalAuth, requireAuth } from '../../middleware/auth';

const router: Router = Router();

// 创建课程 - 混合存储版本
router.post('/', courseController.create);

// 获取课程列表（结合链上和数据库数据）
router.get('/', optionalAuth, courseController.list);

// 根据课程ID获取数据库中的额外信息
router.get('/:courseId/extras', courseController.getExtras);

// 获取课程详情（需要签名验证）
router.post('/:courseId/details', courseController.getDetails);

// 生成课程访问签名消息
router.post('/:courseId/generate-access-message', requireAuth, courseController.generateAccessMessage);

export default router;