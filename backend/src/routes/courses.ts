import { Router } from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
// import { sessionService } from '../services/sessionService';

const router: Router = Router();

// 创建课程 - 混合存储版本
router.post('/', async (req, res) => {
  try {
    const { 
      courseId,              // 智能合约返回的课程ID
      title = '',            // 课程标题（冗余存储）
      description = '',      // 课程描述（冗余存储）
      price = 0,             // 课程价格（冗余存储）
      instructorAddress = '',// 讲师地址（冗余存储）
      category = 'Web3',     // 课程分类（扩展字段）
      coverImageUrl = '',    // 封面图片URL（扩展字段）
      txHash = ''            // 交易哈希
    } = req.body;

    // 参数验证
    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: courseId'
      });
    }

    // 使用 INSERT ... ON DUPLICATE KEY UPDATE 避免重复插入错误
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO courses (
        course_id, title, description, price_yd, instructor_address,
        category, cover_image_url, tx_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        price_yd = VALUES(price_yd),
        instructor_address = VALUES(instructor_address),
        category = VALUES(category),
        cover_image_url = VALUES(cover_image_url),
        tx_hash = VALUES(tx_hash),
        updated_at = CURRENT_TIMESTAMP`,
      [
        courseId, title, description, price, instructorAddress,
        category, coverImageUrl, txHash
      ]
    );

    res.json({
      success: true,
      message: '课程创建成功',
      data: {
        id: result.insertId,
        courseId,
        title,
        description,
        price,
        instructorAddress,
        category,
        coverImageUrl
      }
    });

  } catch (error) {
    console.error('创建课程失败:', error);
    res.status(500).json({
      success: false,
      error: '创建课程失败: ' + (error instanceof Error ? error.message : '未知错误')
    });
  }
});

// 获取课程列表（结合链上和数据库数据）
router.get('/', async (req, res) => {
  try {
    console.log('📋 收到获取课程列表请求');
    
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
    const offset = (page - 1) * limit;
    
    // 获取总数
    const [countResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM courses'
    );
    const total = countResult[0].total;
    
    // 获取数据库中的课程额外信息
    const query = `SELECT * FROM courses ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const [courses] = await pool.execute<RowDataPacket[]>(query);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        courses: courses.map(course => ({
          // 完整的课程数据（包含冗余存储和扩展字段）
          courseId: course.course_id,
          title: course.title,
          description: course.description,
          price: course.price_yd,
          instructorAddress: course.instructor_address,
          category: course.category,
          coverImageUrl: course.cover_image_url,
          txHash: course.tx_hash,
          createdAt: course.created_at,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
    
    console.log('✅ 课程列表返回成功');
  } catch (error) {
    console.error('获取课程列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取课程列表失败' + (error instanceof Error ? `: ${error.message}` : '')
    });
  }
});

// 根据课程ID获取数据库中的额外信息
router.get('/:courseId/extras', async (req, res) => {
  try {
    const { courseId } = req.params;
    
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
    res.json({
      success: true,
      data: {
        courseId: course.course_id,
        category: course.category,
        coverImageUrl: course.cover_image_url,
        txHash: course.tx_hash,
        createdAt: course.created_at
      }
    });

  } catch (error) {
    console.error('获取课程额外信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取课程额外信息失败'
    });
  }
});

// 获取课程详情（需要签名验证）- 临时简化版本
router.post('/:courseId/details', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userAddress, signature, timestamp } = req.body;

    if (!userAddress || !signature || !timestamp) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    // 临时跳过签名验证，直接检查购买状态
    console.log('🔐 临时版本：跳过签名验证，直接检查购买状态');

    // 检查用户是否已购买课程
    const [purchases] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM purchases WHERE user_address = ? AND course_id = ?',
      [userAddress.toLowerCase(), courseId]
    );

    if (purchases.length === 0) {
      return res.status(403).json({
        success: false,
        error: '您尚未购买此课程',
        hasPurchased: false
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

    // 返回课程详情和学习内容
    res.json({
      success: true,
      data: {
        courseId: course.course_id,
        title: course.title,
        description: course.description,
        price: course.price_yd,
        instructorAddress: course.instructor_address,
        category: course.category,
        coverImageUrl: course.cover_image_url,
        hasPurchased: true,
        // 这里可以添加实际的课程学习内容
        content: {
          lessons: [
            {
              id: 1,
              title: "课程介绍",
              videoUrl: "https://example.com/lesson1.mp4",
              duration: "10:30"
            },
            {
              id: 2,
              title: "基础概念",
              videoUrl: "https://example.com/lesson2.mp4",
              duration: "15:45"
            }
            // 更多课程内容...
          ],
          resources: [
            {
              name: "课程资料.pdf",
              url: "https://example.com/materials.pdf"
            }
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