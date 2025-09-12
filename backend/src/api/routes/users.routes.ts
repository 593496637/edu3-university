import { Router } from 'express';
import { userController } from '../controllers/user.controller';

const router: Router = Router();

// 获取用户信息
router.get('/:address', userController.getUser);

// 更新用户资料（需要签名验证，支持nonce机制）
router.post('/profile', userController.updateProfile);

export default router;