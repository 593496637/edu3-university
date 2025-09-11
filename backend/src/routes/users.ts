import { Router } from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { nonceService } from '../services/nonceService';

const router: Router = Router();

// 获取用户信息
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: '缺少用户地址'
      });
    }

    // 查询用户信息
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE wallet_address = ?',
      [address]
    );

    if (users.length === 0) {
      // 用户不存在，自动创建
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO users (wallet_address) VALUES (?)',
        [address]
      );

      return res.json({
        success: true,
        data: {
          id: result.insertId,
          wallet_address: address,
          nickname: null,
          bio: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    });
  }
});

// 更新用户资料（需要签名验证，支持nonce机制）
router.post('/profile', async (req, res) => {
  try {
    const { userAddress, nickname, bio, signature, timestamp, nonce } = req.body;

    // 参数验证
    if (!userAddress || !signature || !timestamp) {
      return res.status(400).json({
        success: false,
        error: '缺少签名验证参数'
      });
    }

    // 如果提供了nonce，进行nonce验证（增强安全性）
    if (nonce) {
      const nonceValid = nonceService.validateAndConsumeNonce(nonce, userAddress);
      if (!nonceValid) {
        return res.status(401).json({
          success: false,
          error: 'Nonce验证失败或已过期'
        });
      }
    }

    // 验证时间戳（5分钟内有效）
    const now = Date.now(); // 保持毫秒格式
    const timestampMs = typeof timestamp === 'number' ? timestamp : parseInt(timestamp);
    const timeDiff = Math.abs(now - timestampMs) / 1000; // 转换为秒进行比较
    
    if (timeDiff > 300) { // 5分钟 = 300秒
      return res.status(400).json({
        success: false,
        error: '签名已过期'
      });
    }

    // 这里应该验证签名，简化处理先跳过
    // TODO: 实现签名验证逻辑

    // 检查用户是否存在
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE wallet_address = ?',
      [userAddress]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 更新用户资料
    await pool.execute(
      'UPDATE users SET nickname = ?, bio = ?, updated_at = CURRENT_TIMESTAMP WHERE wallet_address = ?',
      [nickname, bio, userAddress]
    );

    res.json({
      success: true,
      message: '用户资料更新成功'
    });

  } catch (error) {
    console.error('更新用户资料失败:', error);
    res.status(500).json({
      success: false,
      error: '更新用户资料失败'
    });
  }
});

export default router;