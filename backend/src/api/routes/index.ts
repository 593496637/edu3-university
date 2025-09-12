import { Router } from 'express';
import authRoutes from './auth.routes';
import coursesRoutes from './courses.routes';
import nonceRoutes from './nonce.routes';
import purchasesRoutes from './purchases.routes';
import usersRoutes from './users.routes';

const router: Router = Router();

// 组装所有路由
router.use('/auth', authRoutes);
router.use('/courses', coursesRoutes);
router.use('/nonce', nonceRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/users', usersRoutes);

export default router;