import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
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

    // 课程表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        course_id VARCHAR(50) NOT NULL,
        instructor_address VARCHAR(42) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        price_yd DECIMAL(18,8) NOT NULL,
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_instructor (instructor_address),
        INDEX idx_course_id (course_id)
      )
    `);

    // 购买记录表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS purchases (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_address VARCHAR(42) NOT NULL,
        course_id VARCHAR(50) NOT NULL,
        tx_hash VARCHAR(66) NOT NULL,
        price_paid DECIMAL(18,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_course (user_address, course_id)
      )
    `);

    console.log('✅ 数据库表创建成功');
    return true;
  } catch (error) {
    console.error('❌ 创建数据库表失败:', error);
    return false;
  }
}