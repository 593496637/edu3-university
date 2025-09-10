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

      return {
        success: true,
        data,
      };
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

  // 创建课程
  createCourse: async (courseData: {
    courseId: string;
    title: string;
    description: string;
    price: string;
    instructorAddress: string;
    txHash: string;
  }) => {
    return apiService.post('/courses', courseData);
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
    timestamp: number
  ) => {
    return apiService.post('/users/profile', {
      userAddress,
      nickname,
      bio,
      signature,
      timestamp,
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
};