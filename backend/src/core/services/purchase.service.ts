import { purchaseRepository } from '../repositories/purchase.repository';
import { courseRepository } from '../repositories/course.repository';
import { userRepository } from '../repositories/user.repository';
import { CreatePurchaseDto } from '../models/Purchase';

interface PurchaseWithCourseInfo {
  id: number;
  user_address: string;
  course_id: number;
  tx_hash: string;
  price_paid?: string;
  created_at: Date;
  title?: string;
  description?: string;
  price_yd?: string;
}

export const purchaseService = {
  async createPurchase(dto: CreatePurchaseDto) {
    // 检查是否已经记录过此交易
    const existingPurchase = await purchaseRepository.findByTxHash(dto.txHash);
    if (existingPurchase) {
      throw new Error('交易已记录');
    }

    // 检查课程是否存在
    const course = await courseRepository.findByCourseId(dto.courseId);
    if (!course) {
      throw new Error('课程不存在');
    }

    // 确保用户存在
    let user = await userRepository.findByWalletAddress(dto.userAddress);
    if (!user) {
      // 自动创建用户
      await userRepository.create({
        walletAddress: dto.userAddress
      });
    }

    // 记录购买
    const result = await purchaseRepository.create(dto);

    return {
      id: result.insertId,
      userAddress: dto.userAddress,
      courseId: dto.courseId,
      txHash: dto.txHash
    };
  },

  async getUserPurchases(userAddress: string): Promise<PurchaseWithCourseInfo[]> {
    // 这个查询需要联表，我们在repository层实现
    // 但为了保持分离，我们在service层组合数据
    const purchases = await purchaseRepository.findByUserAddress(userAddress);
    
    // 获取每个购买记录对应的课程信息
    const purchasesWithCourseInfo: PurchaseWithCourseInfo[] = [];
    
    for (const purchase of purchases) {
      const course = await courseRepository.findByCourseId(purchase.course_id);
      purchasesWithCourseInfo.push({
        ...purchase,
        title: course?.title,
        description: course?.description,
        price_yd: course?.price_yd
      });
    }

    return purchasesWithCourseInfo;
  },

  async checkPurchaseExists(userAddress: string, courseId: number): Promise<boolean> {
    return purchaseRepository.exists(userAddress, courseId);
  },

  async getPurchaseByTxHash(txHash: string) {
    return purchaseRepository.findByTxHash(txHash);
  },

  async getCoursePurchases(courseId: number) {
    return purchaseRepository.findByCourseId(courseId);
  }
};