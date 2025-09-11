import { Router } from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sessionService } from '../services/sessionService';
import { optionalAuth, requireAuth } from '../middleware/auth';

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
router.get('/', optionalAuth, async (req, res) => {
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
    const [coursesList] = await pool.execute<RowDataPacket[]>(query);
    
    // 如果用户已登录，检查购买状态
    let purchasedCourseIds: number[] = [];
    if (req.user?.address) {
      const [purchases] = await pool.execute<RowDataPacket[]>(
        'SELECT DISTINCT course_id FROM purchases WHERE user_address = ?',
        [req.user.address.toLowerCase()]
      );
      purchasedCourseIds = purchases.map(p => p.course_id);
      console.log(`📋 用户 ${req.user.address} 已购买课程: ${purchasedCourseIds.join(', ')}`);
    }
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        courses: coursesList.map(course => ({
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
          // 添加购买状态
          hasPurchased: req.user?.address ? purchasedCourseIds.includes(course.course_id) : false,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages
        },
        // 添加用户登录状态
        userAddress: req.user?.address || null
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
    
    const [courseInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (courseInfo.length === 0) {
      return res.status(404).json({
        success: false,
        error: '课程不存在'
      });
    }

    const course = courseInfo[0];
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

// 获取课程详情（需要签名验证）
router.post('/:courseId/details', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userAddress, signature, timestamp } = req.body;

    if (!userAddress || !signature || !timestamp) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: userAddress, signature, timestamp'
      });
    }

    console.log(`🔐 开始验证课程 ${courseId} 访问权限，用户: ${userAddress}`);

    // 1. 检查用户是否已购买课程或者是课程创建者
    const [purchases] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM purchases WHERE user_address = ? AND course_id = ?',
      [userAddress.toLowerCase(), courseId]
    );

    // 检查用户是否是课程创建者
    const [instructorCourses] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM courses WHERE course_id = ? AND instructor_address = ?',
      [courseId, userAddress.toLowerCase()]
    );

    const isPurchased = purchases.length > 0;
    const isInstructor = instructorCourses.length > 0;

    if (!isPurchased && !isInstructor) {
      return res.status(403).json({
        success: false,
        error: '您尚未购买此课程',
        hasPurchased: false,
        isInstructor: false
      });
    }

    console.log(`🎓 课程详情访问: 用户${userAddress}, 课程${courseId}, 身份: ${isInstructor ? '创建者' : '购买者'}`);

    // 2. 验证签名
    const isValidSignature = await sessionService.validateCourseAccess(
      userAddress,
      parseInt(courseId),
      signature,
      timestamp
    );

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: '签名验证失败，请重新生成访问签名',
        hasPurchased: true,
        needsNewSignature: true
      });
    }

    console.log(`✅ 签名验证成功，用户 ${userAddress} 可以访问课程 ${courseId}`);

    // 获取课程详细信息
    const [courseDetails] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (courseDetails.length === 0) {
      return res.status(404).json({
        success: false,
        error: '课程不存在'
      });
    }

    const course = courseDetails[0];

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

// 生成课程访问签名消息
router.post('/:courseId/generate-access-message', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userAddress = req.user!.address;

    // 检查用户是否已购买课程或者是课程创建者
    const [purchases] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM purchases WHERE user_address = ? AND course_id = ?',
      [userAddress.toLowerCase(), courseId]
    );

    // 检查用户是否是课程创建者
    const [ownerCourses] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM courses WHERE course_id = ? AND instructor_address = ?',
      [courseId, userAddress.toLowerCase()]
    );

    const isPurchased = purchases.length > 0;
    const isInstructor = ownerCourses.length > 0;

    if (!isPurchased && !isInstructor) {
      return res.status(403).json({
        success: false,
        error: '您尚未购买此课程',
        hasPurchased: false,
        isInstructor: false
      });
    }

    console.log(`🔑 生成课程访问消息: 用户${userAddress}, 课程${courseId}, 身份: ${isInstructor ? '创建者' : '购买者'}`);

    // 生成访问消息和时间戳
    const timestamp = Date.now();
    const expiry = timestamp + 2 * 60 * 60 * 1000; // 2小时有效期
    const message = `Access course ${courseId} valid until ${expiry}`;

    res.json({
      success: true,
      data: {
        message,
        timestamp,
        courseId: parseInt(courseId),
        userAddress,
        expiresAt: new Date(expiry).toISOString()
      }
    });

  } catch (error) {
    console.error('生成课程访问消息失败:', error);
    res.status(500).json({
      success: false,
      error: '生成访问消息失败'
    });
  }
});

export default router;