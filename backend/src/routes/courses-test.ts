import { Router } from 'express';

const router: Router = Router();

// 简单测试路由
router.get('/', (req, res) => {
  console.log('✅ 测试路由收到请求');
  res.json({
    success: true,
    message: '测试路由工作正常'
  });
});

export default router;