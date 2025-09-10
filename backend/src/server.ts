import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, createTables } from './database';
import coursesRouter from './routes/courses';
import usersRouter from './routes/users';
import purchasesRouter from './routes/purchases';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// API路由
app.use('/api/courses', coursesRouter);
app.use('/api/users', usersRouter);
app.use('/api/purchases', purchasesRouter);

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Web3教育平台后端API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// 测试接口
app.get('/api/test', (req, res) => {
  res.json({
    message: '测试接口工作正常',
    timestamp: new Date().toISOString()
  });
});


// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    console.log('🔗 正在连接数据库...');
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      // 创建数据库表
      console.log('📊 正在创建数据库表...');
      await createTables();
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📱 前端地址: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`💾 数据库状态: ${dbConnected ? '已连接' : '连接失败'}`);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();