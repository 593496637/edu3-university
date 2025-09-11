import { Router } from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router: Router = Router();

// 记录购买
router.post('/', async (req, res) => {
  try {
    const { userAddress, courseId, txHash, pricePaid } = req.body;

    // 参数验证
    if (!userAddress || !courseId || !txHash) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    // 检查是否已经记录过此交易
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM purchases WHERE tx_hash = ?',
      [txHash]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: '交易已记录'
      });
    }

    // 检查课程是否存在
    const [courses] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        error: '课程不存在'
      });
    }

    // 确保用户存在
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE wallet_address = ?',
      [userAddress]
    );

    if (users.length === 0) {
      // 自动创建用户
      await pool.execute<ResultSetHeader>(
        'INSERT INTO users (wallet_address) VALUES (?)',
        [userAddress]
      );
    }

    // 记录购买
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO purchases (user_address, course_id, tx_hash, price_paid) VALUES (?, ?, ?, ?)',
      [userAddress, courseId, txHash, pricePaid]
    );

    res.json({
      success: true,
      message: '购买记录成功',
      data: {
        id: result.insertId,
        userAddress,
        courseId,
        txHash
      }
    });

  } catch (error) {
    console.error('记录购买失败:', error);
    res.status(500).json({
      success: false,
      error: '记录购买失败'
    });
  }
});

// 获取用户购买记录
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: '缺少用户地址'
      });
    }

    const [purchases] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, c.title, c.description, c.price_yd 
       FROM purchases p 
       LEFT JOIN courses c ON p.course_id = c.course_id 
       WHERE p.user_address = ? 
       ORDER BY p.created_at DESC`,
      [address]
    );

    res.json({
      success: true,
      data: purchases
    });

  } catch (error) {
    console.error('获取购买记录失败:', error);
    res.status(500).json({
      success: false,
      error: '获取购买记录失败'
    });
  }
});

export default router;