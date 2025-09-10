import { Router } from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// 获取课程列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM courses ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    );

    const [countResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM courses'
    );

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        courses: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取课程列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取课程列表失败'
    });
  }
});

// 创建课程
router.post('/', async (req, res) => {
  try {
    const { courseId, title, description, price, instructorAddress, txHash } = req.body;

    // 参数验证
    if (!courseId || !title || !price || !instructorAddress) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    // 检查课程ID是否已存在
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: '课程ID已存在'
      });
    }

    // 插入课程数据
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO courses (course_id, instructor_address, title, description, price_yd, tx_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [courseId, instructorAddress, title, description, price, txHash]
    );

    res.json({
      success: true,
      message: '课程创建成功',
      data: {
        id: result.insertId,
        courseId
      }
    });

  } catch (error) {
    console.error('创建课程失败:', error);
    res.status(500).json({
      success: false,
      error: '创建课程失败'
    });
  }
});

// 获取课程详情（需要签名验证）
router.post('/:courseId/details', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userAddress, signature, timestamp } = req.body;

    // 基础参数验证
    if (!userAddress || !signature || !timestamp) {
      return res.status(400).json({
        success: false,
        error: '缺少签名验证参数'
      });
    }

    // 验证时间戳（5分钟内有效）
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return res.status(400).json({
        success: false,
        error: '签名已过期'
      });
    }

    // 检查用户是否购买了该课程
    const [purchases] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM purchases WHERE user_address = ? AND course_id = ?',
      [userAddress, courseId]
    );

    if (purchases.length === 0) {
      return res.status(403).json({
        success: false,
        error: '您尚未购买此课程'
      });
    }

    // 获取课程详细信息
    const [courses] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        error: '课程不存在'
      });
    }

    const course = courses[0];

    // 返回课程详情（这里可以包含更多敏感信息）
    res.json({
      success: true,
      data: {
        ...course,
        // 只有购买用户才能看到的额外信息
        content: {
          videoUrls: [
            'https://example.com/video1.mp4',
            'https://example.com/video2.mp4'
          ],
          materials: [
            { name: '课件1.pdf', url: 'https://example.com/material1.pdf' },
            { name: '代码示例.zip', url: 'https://example.com/code.zip' }
          ],
          assignments: [
            { title: '作业1', description: '完成智能合约开发' },
            { title: '作业2', description: '部署到测试网络' }
          ]
        }
      }
    });

  } catch (error) {
    console.error('获取课程详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取课程详情失败'
    });
  }
});

export default router;