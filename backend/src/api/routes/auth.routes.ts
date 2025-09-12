import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router: Router = Router();

// 登录接口 - 钱包签名验证 (支持nonce机制)
router.post('/login', authController.login);

// 验证会话接口
router.post('/verify-session', authController.verifySession);

// 登出接口
router.post('/logout', authController.logout);

export default router;