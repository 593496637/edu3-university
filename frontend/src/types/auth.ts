// 认证服务相关类型
export interface LoginResponse {
  success: boolean;
  data?: {
    sessionToken: string;
    walletAddress: string;
    expiresIn: number;
  };
  error?: string;
}

export interface CourseAccessMessage {
  message: string;
  timestamp: number;
  courseId: number;
  userAddress: string;
  expiresAt: string;
}

// 签名缓存类型
export interface SignatureCache {
  signature: string;
  timestamp: number;
  expiresAt: number;
}

// 验证相关类型
export interface SessionVerifyResponse {
  success: boolean;
  error?: string;
}

export interface AccessMessageResponse {
  success: boolean;
  data?: CourseAccessMessage;
  error?: string;
}

export interface CourseAccessResponse {
  success: boolean;
  data?: {
    course: {
      id: number;
      title: string;
      description: string;
      content?: string;
    };
  };
  error?: string;
  needsNewSignature?: boolean;
}