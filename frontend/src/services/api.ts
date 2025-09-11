// API基础配置
const API_BASE = 'http://localhost:3001/api'; // 后端API地址

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiRequest<T = unknown> {
  method: string;
  body?: T;
}

// 通用请求封装
class ApiService {
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      // 直接返回后端的响应，不再包装
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // GET请求
  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' });
  }

  // POST请求
  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT请求
  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();

// 具体的API调用函数
export const courseApi = {
  // 获取课程列表
  getCourses: async (page = 1, limit = 10) => {
    return apiService.get(`/courses?page=${page}&limit=${limit}`);
  },

  // 创建课程 - 混合存储版本
  createCourse: async (courseData: {
    courseId: number | string;
    title?: string;
    description?: string;
    price?: number | string;
    instructorAddress?: string;
    category?: string;
    coverImageUrl?: string;
    txHash?: string;
  }) => {
    return apiService.post('/courses', courseData);
  },

  // 获取课程额外信息
  getCourseExtras: async (courseId: string) => {
    return apiService.get(`/courses/${courseId}/extras`);
  },

  // 获取课程详情（需要签名验证）
  getCourseDetails: async (courseId: string, userAddress: string, signature: string, timestamp: number) => {
    return apiService.post(`/courses/${courseId}/details`, {
      userAddress,
      signature,
      timestamp,
    });
  },
};

export const userApi = {
  // 获取用户信息
  getUser: async (address: string) => {
    return apiService.get(`/users/${address}`);
  },

  // 更新用户资料（需要签名验证）
  updateProfile: async (
    userAddress: string,
    nickname: string,
    bio: string,
    signature: string,
    timestamp: number,
    nonce?: string
  ) => {
    return apiService.post('/users/profile', {
      userAddress,
      nickname,
      bio,
      signature,
      timestamp,
      ...(nonce && { nonce }),
    });
  },
};

export const purchaseApi = {
  // 记录购买
  recordPurchase: async (purchaseData: {
    userAddress: string;
    courseId: string;
    txHash: string;
    pricePaid: string;
  }) => {
    return apiService.post('/purchases', purchaseData);
  },

  // 获取用户购买记录
  getUserPurchases: async (address: string) => {
    return apiService.get(`/purchases/user/${address}`);
  },
};

// Nonce API
export const nonceApi = {
  // 生成nonce
  generate: async (walletAddress: string) => {
    return apiService.post('/nonce/generate', {
      walletAddress,
    });
  },

  // 获取nonce统计
  getStats: async () => {
    return apiService.get('/nonce/stats');
  },
};

// 认证API
export const authApi = {
  // 登录（支持nonce）
  login: async (walletAddress: string, signature: string, message: string, timestamp: number, nonce?: string) => {
    return apiService.post('/auth/login', {
      walletAddress,
      signature,
      message,
      timestamp,
      ...(nonce && { nonce }),
    });
  },

  // 验证会话
  verifySession: async (sessionToken: string) => {
    return apiService.post('/auth/verify-session', {
      sessionToken,
    });
  },

  // 登出
  logout: async (sessionToken: string) => {
    return apiService.post('/auth/logout', {
      sessionToken,
    });
  },
};

// 测试API
export const testApi = {
  // 测试后端连接
  testConnection: async () => {
    return apiService.get('/test');
  },
  
  // 健康检查
  healthCheck: async () => {
    return apiService.get('/health');
  },
};