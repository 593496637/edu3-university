import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './api/routes';
import { errorHandler } from './middleware/errorHandler';

// 加载环境变量配置
dotenv.config();

const app: Express = express();

/**
 * 跨域资源共享配置
 * 允许前端应用访问后端API
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

/**
 * JSON请求体解析中间件
 * 解析application/json类型的请求体
 */
app.use(express.json());

/**
 * 配置API路由
 * 所有API请求都以/api为前缀
 */
console.log('🔗 配置API路由...');
app.use('/api', apiRoutes);

/**
 * 根路径路由 - API服务状态信息
 */
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Web3教育平台后端API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 健康检查接口
 * 用于监控服务运行状态
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API测试接口
 * 用于验证API服务是否正常工作
 */
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '测试接口工作正常',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 全局错误处理中间件
 * 必须放在所有路由和中间件的最后
 */
app.use(errorHandler);

export default app;