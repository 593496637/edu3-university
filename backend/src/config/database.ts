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

// 创建连接池
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 测试数据库连接
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

// 创建数据库表
export async function createTables() {
  try {
    // 用户表
    await pool.execute(`
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
    await pool.execute(`
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
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS purchases (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_address VARCHAR(42) NOT NULL,
        course_id BIGINT NOT NULL,
        tx_hash VARCHAR(66) NOT NULL,
        price_paid DECIMAL(18,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_course (user_address, course_id)
      )
    `);

    // 用户会话表 - 存储访问token
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_address VARCHAR(42) NOT NULL,
        session_token VARCHAR(128) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_address (user_address),
        INDEX idx_token (session_token),
        INDEX idx_expires (expires_at)
      )
    `);

    // 课程访问令牌表 - 存储课程访问签名
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS course_access_tokens (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_address VARCHAR(42) NOT NULL,
        course_id BIGINT NOT NULL,
        signature TEXT NOT NULL,
        signed_message TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_course (user_address, course_id),
        INDEX idx_expires (expires_at)
      )
    `);

    console.log('✅ 数据库表创建成功');
    return true;
  } catch (error) {
    console.error('❌ 创建数据库表失败:', error);
    return false;
  }
}