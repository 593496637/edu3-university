import { Router } from 'express';
import { nonceController } from '../controllers/nonce.controller';

const router: Router = Router();

// 获取nonce接口
router.post('/generate', nonceController.generate);

// 获取nonce服务状态
router.get('/stats', nonceController.getStats);

export default router;