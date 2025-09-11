import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307'),
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'app_pass123',
  database: process.env.DB_NAME || 'web3_course_platform',
};

async function resetDatabase() {
  let connection;
  
  try {
    // 创建连接
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 删除现有表
    console.log('🗑️ 删除现有表...');
    await connection.execute('DROP TABLE IF EXISTS purchases');
    await connection.execute('DROP TABLE IF EXISTS courses');
    await connection.execute('DROP TABLE IF EXISTS users');
    console.log('✅ 现有表已删除');

    // 重新创建表
    console.log('📊 创建新的数据库表结构...');
    
    // 用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        nickname VARCHAR(50),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_wallet (wallet_address)
      )
    `);

    // 课程表 - 混合存储：核心字段冗余存储 + 扩展字段
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        course_id BIGINT NOT NULL UNIQUE,
        -- 从智能合约冗余存储的核心字段（便于查询展示）
        title VARCHAR(200),
        description TEXT,
        price_yd DECIMAL(18,8),
        instructor_address VARCHAR(42),
        -- 数据库独有的扩展字段
        category VARCHAR(50) DEFAULT 'Web3',
        cover_image_url VARCHAR(500),
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_course_id (course_id),
        INDEX idx_category (category),
        INDEX idx_instructor (instructor_address)
      )
    `);

    // 购买记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS purchases (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_address VARCHAR(42) NOT NULL,
        course_id BIGINT NOT NULL UNIQUE,
        tx_hash VARCHAR(66) NOT NULL,
        price_paid DECIMAL(18,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_course (user_address, course_id)
      )
    `);

    console.log('✅ 新的数据库表创建成功');
    console.log('🎉 数据库重置完成！');

  } catch (error) {
    console.error('❌ 数据库重置失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行重置
resetDatabase();