import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './api/routes';
import { errorHandler } from './middleware/errorHandler';

// 加载环境变量
dotenv.config();

const app: Express = express();

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// API路由
console.log('🔗 配置API路由...');
app.use('/api', apiRoutes);

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Web3教育平台后端API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

// 测试接口
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '测试接口工作正常',
    timestamp: new Date().toISOString(),
  });
});

// 全局错误处理中间件（放在最后）
app.use(errorHandler);

export default app;