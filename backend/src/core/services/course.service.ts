import { courseRepository } from '../repositories/course.repository';
import { purchaseRepository } from '../repositories/purchase.repository';
import { CreateCourseDto, CourseWithPurchaseStatus } from '../models/Course';

interface CourseListResult {
  courses: CourseWithPurchaseStatus[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  userAddress?: string;
}

interface CourseAccessMessageData {
  message: string;
  timestamp: number;
  courseId: number;
  userAddress: string;
  expiresAt: string;
}

interface CourseDetailsData {
  courseId: number;
  title?: string;
  description?: string;
  price?: string;
  instructorAddress?: string;
  category?: string;
  coverImageUrl?: string;
  hasPurchased: boolean;
  content: {
    lessons: Array<{
      id: number;
      title: string;
      videoUrl: string;
      duration: string;
    }>;
    resources: Array<{
      name: string;
      url: string;
    }>;
  };
}

/**
 * 课程管理服务
 * 处理课程创建、查询、访问控制等功能
 */
export const courseService = {
  /**
   * 创建新课程
   * @param dto - 课程创建数据传输对象
   * @returns 创建的课程信息
   */
  async createCourse(dto: CreateCourseDto) {
    const result = await courseRepository.createOrUpdate(dto);
    return {
      id: result.insertId,
      courseId: dto.courseId,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      instructorAddress: dto.instructorAddress,
      category: dto.category,
      coverImageUrl: dto.coverImageUrl
    };
  },

  /**
   * 获取课程列表（带分页和购买状态）
   * @param page - 页码，从1开始
   * @param limit - 每页课程数量
   * @param userAddress - 可选的用户地址，用于查询购买状态
   * @returns 包含课程列表和分页信息的结果
   */
  async getCourseList(page: number, limit: number, userAddress?: string): Promise<CourseListResult> {
    const offset = (page - 1) * limit;
    
    // 获取课程和总数
    const [courses, total] = await Promise.all([
      courseRepository.findWithPagination(limit, offset),
      courseRepository.countAll()
    ]);

    // 如果用户已登录，获取购买记录
    let purchasedCourseIds = new Set<number>();
    if (userAddress) {
      const purchases = await purchaseRepository.findByUserAddress(userAddress.toLowerCase());
      purchasedCourseIds = new Set(purchases.map(p => p.course_id));
      console.log(`📋 用户 ${userAddress} 已购买课程: ${Array.from(purchasedCourseIds).join(', ')}`);
    }

    // 组装课程数据和购买状态
    const coursesWithStatus: CourseWithPurchaseStatus[] = courses.map(course => ({
      ...course,
      hasPurchased: userAddress ? purchasedCourseIds.has(course.course_id) : false,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      courses: coursesWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      userAddress
    };
  },

  /**
   * 获取课程额外信息
   * @param courseId - 课程ID
   * @returns 课程的额外信息（分类、封面图、交易哈希等）
   * @throws {Error} 课程不存在时抛出错误
   */
  async getCourseExtras(courseId: number) {
    const course = await courseRepository.findByCourseId(courseId);
    
    if (!course) {
      throw new Error('课程不存在');
    }

    return {
      courseId: course.course_id,
      category: course.category,
      coverImageUrl: course.cover_image_url,
      txHash: course.tx_hash,
      createdAt: course.created_at
    };
  },

  /**
   * 检查用户对课程的访问权限
   * @param userAddress - 用户钱包地址
   * @param courseId - 课程ID
   * @returns 访问权限信息（是否购买、是否为讲师、是否有权限）
   */
  async checkCourseAccess(userAddress: string, courseId: number): Promise<{
    isPurchased: boolean;
    isInstructor: boolean;
    hasAccess: boolean;
  }> {
    const [isPurchased, instructorCourse] = await Promise.all([
      purchaseRepository.exists(userAddress.toLowerCase(), courseId),
      courseRepository.findByCourseIdAndInstructor(courseId, userAddress.toLowerCase())
    ]);

    const isInstructor = !!instructorCourse;
    const hasAccess = isPurchased || isInstructor;

    console.log(`🎓 课程访问检查: 用户${userAddress}, 课程${courseId}, 身份: ${isInstructor ? '创建者' : isPurchased ? '购买者' : '无权限'}`);

    return {
      isPurchased,
      isInstructor,
      hasAccess
    };
  },

  /**
   * 获取课程详细信息（包含课程内容）
   * @param courseId - 课程ID
   * @returns 课程详细信息，包含课程内容和资源
   * @throws {Error} 课程不存在时抛出错误
   */
  async getCourseDetails(courseId: number): Promise<CourseDetailsData> {
    const course = await courseRepository.findByCourseId(courseId);
    
    if (!course) {
      throw new Error('课程不存在');
    }

    // 这里可以根据课程ID动态获取课程内容
    // 现在返回模拟数据
    return {
      courseId: course.course_id,
      title: course.title,
      description: course.description,
      price: course.price_yd,
      instructorAddress: course.instructor_address,
      category: course.category,
      coverImageUrl: course.cover_image_url,
      hasPurchased: true,
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
        ],
        resources: [
          {
            name: "课程资料.pdf",
            url: "https://example.com/materials.pdf"
          }
        ]
      }
    };
  },

  /**
   * 生成课程访问消息
   * 用于用户签名验证课程访问权限
   * @param courseId - 课程ID
   * @param userAddress - 用户钱包地址
   * @returns 课程访问消息数据，包含签名消息和过期时间
   */
  generateAccessMessage(courseId: number, userAddress: string): CourseAccessMessageData {
    console.log(`🔑 生成课程访问消息: 用户${userAddress}, 课程${courseId}`);
    
    const timestamp = Date.now();
    const expiry = timestamp + 2 * 60 * 60 * 1000; // 2小时有效期
    const message = `Access course ${courseId} valid until ${expiry}`;

    return {
      message,
      timestamp,
      courseId,
      userAddress,
      expiresAt: new Date(expiry).toISOString()
    };
  }
};