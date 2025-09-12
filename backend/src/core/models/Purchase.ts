export interface Purchase {
  id: number;
  user_address: string;
  course_id: number;
  tx_hash: string;
  price_paid?: string;
  created_at: Date;
}

export interface CreatePurchaseDto {
  userAddress: string;
  courseId: number;
  txHash: string;
  pricePaid?: number;
}