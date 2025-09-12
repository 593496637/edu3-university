import app from './app';
import { testConnection, createTables } from './config/database';

const PORT = process.env.PORT || 3001;

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    console.log('🔗 正在连接数据库...');
    const dbConnected = await testConnection();

    if (dbConnected) {
      // 确保数据库表已创建
      await createTables();
    }

    // 启动服务器
    const server = app.listen(PORT, () => {
      const address = server.address();
      const actualPort = typeof address === 'string' ? address : address?.port || PORT;
      
      console.log(`🚀 服务器运行在 http://localhost:${actualPort}`);
      console.log(`📱 前端地址: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`💾 数据库状态: ${dbConnected ? '已连接' : '连接失败'}`);
      console.log(`⚡ Node.js 版本: ${process.version}`);
      console.log(`🏷️  环境模式: ${process.env.NODE_ENV || 'development'}`);
    });

    /**
     * 优雅关闭服务器处理函数
     * @param signal - 接收到的系统信号
     */
    const gracefulShutdown = (signal: string) => {
      console.log(`🔄 收到${signal}信号，正在关闭服务器...`);
      server.close((err) => {
        if (err) {
          console.error('❌ 关闭服务器失败:', err);
          process.exit(1);
        }
        console.log('✅ 服务器已关闭');
        process.exit(0);
      });
    };

    // 监听系统信号进行优雅关闭
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();