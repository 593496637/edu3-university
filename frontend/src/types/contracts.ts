import { ethers } from 'ethers';

// Course related types
export interface CourseData {
  id: number;
  instructor: string;
  title: string;
  description: string;
  price: string;
  isActive: boolean;
  createdAt: number;
}

// API response types
export interface ApiCourseData {
  course_id: string;
  instructor_address: string;
  title: string;
  description: string;
  price_yd: string;
  created_at: string;
}

export interface ApiResponse {
  success: boolean;
  data?: {
    courses: ApiCourseData[];
  };
  error?: string;
}

// Contract related types
export interface ContractInterface {
  parseLog(log: ethers.Log): ethers.LogDescription | null;
}

export type AbiFragment = ethers.InterfaceAbi;

// Staking related types
export interface StakeInfo {
  amount: string;
  startTime: number;
  isActive: boolean;
}

// Transaction result types
export interface CreateCourseResult {
  courseId: string | null;
  txHash: string;
}

// API request types
export interface CreateCourseApiRequest {
  courseId: string;
  title: string;
  description: string;
  price: string;
  instructorAddress: string;
  txHash: string;
}

export interface RecordPurchaseRequest {
  userAddress: string;
  courseId: string;
  txHash: string;
  pricePaid: string;
}