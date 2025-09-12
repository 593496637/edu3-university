export interface Course {
  id: number;
  course_id: number;
  title?: string;
  description?: string;
  price_yd?: string;
  instructor_address?: string;
  category?: string;
  cover_image_url?: string;
  tx_hash?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCourseDto {
  courseId: number;
  title?: string;
  description?: string;
  price?: number;
  instructorAddress?: string;
  category?: string;
  coverImageUrl?: string;
  txHash?: string;
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  coverImageUrl?: string;
  txHash?: string;
}

export interface CourseWithPurchaseStatus extends Course {
  hasPurchased?: boolean;
}