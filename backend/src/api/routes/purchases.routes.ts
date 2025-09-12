import { Router } from 'express';
import { purchaseController } from '../controllers/purchase.controller';

const router: Router = Router();

// 记录购买
router.post('/', purchaseController.create);

// 获取用户购买记录
router.get('/user/:address', purchaseController.getUserPurchases);

export default router;