/**
 * API服务模块 - 统一的HTTP客户端和后端接口封装
 * 
 * 核心功能：
 * 1. 统一的API请求封装和错误处理
 * 2. 标准化的响应格式和类型定义
 * 3. 用户认证和资料管理API
 * 4. 课程数据和操作API接口
 * 5. 开发环境的连接测试功能
 * 
 * 技术实现：
 * - 基于原生fetch API，保持轻量化
 * - TypeScript泛型支持，提供类型安全
 * - 统一错误处理和用户友好的错误信息
 * - 支持GET/POST/PUT/DELETE等HTTP方法
 * - 自动JSON序列化和反序列化
 * 
 * 架构设计：
 * - ApiService基础类提供通用请求能力
 * - 特定业务API类继承基础功能
 * - 响应数据统一格式化处理
 * - 错误信息标准化输出
 */

// API服务器基础地址配置
const API_BASE = 'http://localhost:3001/api';

/**
 * 标准化API响应格式
 * 
 * 所有后端API都应该返回这种统一格式，确保前端能够一致处理：
 * - success: 操作是否成功
 * - data: 成功时返回的具体数据
 * - error: 失败时的错误信息
 * - message: 可选的附加消息
 */
interface ApiResponse<T = unknown> {
  success: boolean;    // 请求是否成功
  data?: T;           // 响应数据，泛型支持不同数据类型
  error?: string;     // 错误信息，失败时提供
  message?: string;   // 可选的额外信息
}

/**
 * API请求参数接口
 * 
 * 用于类型化API请求的参数结构
 */
export interface ApiRequest<T = unknown> {
  method: string;     // HTTP方法
  body?: T;          // 请求体数据
}

/**
 * 通用API服务基础类
 * 
 * 提供所有API调用的基础功能：
 * 1. 统一的请求格式化和错误处理
 * 2. 自动添加必要的HTTP头部
 * 3. JSON数据的序列化和反序列化
 * 4. 网络错误和HTTP状态码处理
 * 5. 类型安全的响应数据处理
 * 
 * 设计特点：
 * - 使用泛型确保类型安全
 * - 统一的错误处理避免重复代码
 * - 支持请求拦截和响应拦截
 * - 兼容现代浏览器的fetch API
 */
class ApiService {
  /**
   * 核心请求方法 - 所有API调用的基础
   * 
   * 功能说明：
   * 1. 构造完整的请求URL
   * 2. 设置标准HTTP头部（Content-Type等）
   * 3. 发送请求并处理响应
   * 4. 统一错误处理和响应格式化
   * 5. 提供类型安全的数据返回
   * 
   * 错误处理策略：
   * - 网络错误：返回标准化错误响应
   * - HTTP错误状态码：抛出带有错误信息的异常
   * - 解析错误：返回通用错误信息
   * - 未知错误：提供fallback错误信息
   * 
   * @param url API端点路径（相对于API_BASE）
   * @param options fetch选项，包含method、headers、body等
   * @returns Promise包装的标准化API响应
   * @template T 响应数据的类型
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // 发送HTTP请求到完整的API地址
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          // 默认设置JSON内容类型
          'Content-Type': 'application/json',
          // 合并用户自定义的头部
          ...options.headers,
        },
        // 传递所有其他fetch选项
        ...options,
      });

      // 解析JSON响应体
      const data = await response.json();

      // 检查HTTP状态码，非2xx状态码视为错误
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      // 返回后端的标准化响应格式
      return data;
    } catch (error) {
      // 记录错误信息便于调试
      console.error('API request failed:', error);
      // 返回标准化的错误响应格式
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * GET请求封装
   * 
   * 用于获取数据的HTTP GET请求，通常用于：
   * - 查询用户信息
   * - 获取课程列表
   * - 检查服务状态
   * - 读取配置数据
   * 
   * @param url API端点路径
   * @returns Promise包装的响应数据
   * @template T 预期的响应数据类型
   */
  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST请求封装
   * 
   * 用于提交数据的HTTP POST请求，通常用于：
   * - 用户注册和登录
   * - 创建新课程
   * - 更新用户资料
   * - 提交表单数据
   * 
   * @param url API端点路径
   * @param data 要提交的数据对象（会自动序列化为JSON）
   * @returns Promise包装的响应数据
   * @template T 预期的响应数据类型
   */
  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      // 只有在有数据时才序列化body
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