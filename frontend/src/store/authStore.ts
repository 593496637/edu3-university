/**
 * 认证状态管理Store - 使用Zustand管理全局的用户认证和钱包状态
 * 
 * 核心功能：
 * 1. Web3钱包连接状态管理 - 账户地址、连接状态、网络检查
 * 2. 用户认证状态跟踪 - 后端API登录状态管理
 * 3. 资产信息存储 - YDToken余额实时更新和显示
 * 4. 区块链网络信息 - chainId跟踪和网络切换检测
 * 5. 本地数据持久化 - 自动保存关键信息到localStorage
 * 
 * 数据持久化策略：
 * - 保存：账户地址、登录状态、链网络 ID
 * - 不保存：连接状态、网络正确性、代币余额（需要实时查询）
 * 
 * 使用场景：
 * - 所有需要检查用户认证状态的组件
 * - 钱包连接和断开连接的操作
 * - 网络切换和状态监听
 * - 用户余额和资产显示
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 认证状态接口定义
 * 
 * 包含所有与Web3认证和用户状态相关的数据字段
 */
export interface AuthState {
  account: string | null;      // 当前连接的以太坊账户地址
  isConnected: boolean;        // 钱包是否已连接
  isCorrectNetwork: boolean;   // 是否在正确的网络（Sepolia测试网）
  isLoggedIn: boolean;        // 是否已登录后端API
  balance: string;            // YDToken余额（字符串避免精度问题）
  chainId: number | null;     // 当前的区块链网络 ID
}

/**
 * 认证操作函数接口
 * 
 * 定义所有可以修改认证状态的操作函数
 */
interface AuthActions {
  setAccount: (account: string | null) => void;      // 设置账户地址
  setConnected: (connected: boolean) => void;        // 设置连接状态
  setCorrectNetwork: (correct: boolean) => void;     // 设置网络正确性
  setLoggedIn: (loggedIn: boolean) => void;         // 设置登录状态
  setBalance: (balance: string) => void;            // 设置代币余额
  setChainId: (chainId: number | null) => void;     // 设置网络 ID
  reset: () => void;                               // 重置所有状态到初始值
}

/**
 * 完整的认证Store类型
 * 
 * 结合状态数据和操作函数，形成完整的store接口
 */
export type AuthStore = AuthState & AuthActions;

/**
 * 认证状态的初始值配置
 * 
 * 定义了应用启动时的默认状态，也用于reset操作
 */
const initialState: AuthState = {
  account: null,              // 初始时未连接任何账户
  isConnected: false,         // 初始时钱包未连接
  isCorrectNetwork: false,    // 初始时不在正确网络
  isLoggedIn: false,         // 初始时未登录后端API
  balance: '0',              // 初始余额为0
  chainId: null,             // 初始时未知网络 ID
};

/**
 * 创建认证Store实例
 * 
 * 使用Zustand的create和persist中间件：
 * 1. create - 创建全局状态store
 * 2. persist - 自动持久化部分状态到localStorage
 * 
 * 持久化策略说明：
 * - 保存到localStorage的数据：账户地址、登录状态、链 ID
 * - 不保存的数据：连接状态、网络正确性、余额（需要实时查询）
 * 
 * 这样设计的目的：
 * - 用户刷新页面后不需要重新连接钱包
 * - 保持上次会话的登录状态
 * - 但实时数据（如余额）始终从区块链重新获取
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // 展开初始状态作为默认值
      ...initialState,
      
      // 状态更新函数 - 使用Zustand的set函数更新对应字段
      setAccount: (account) => set({ account }),
      setConnected: (isConnected) => set({ isConnected }),
      setCorrectNetwork: (isCorrectNetwork) => set({ isCorrectNetwork }),
      setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setBalance: (balance) => set({ balance }),
      setChainId: (chainId) => set({ chainId }),
      
      // 重置函数 - 恢复所有状态到初始值（用于登出等操作）
      reset: () => set(initialState),
    }),
    {
      // localStorage中的存储键名
      name: 'auth-storage',
      // 部分持久化配置 - 只保存需要持久化的字段
      partialize: (state) => ({ 
        account: state.account,        // 保存账户地址
        isLoggedIn: state.isLoggedIn, // 保存登录状态
        chainId: state.chainId        // 保存网络 ID
      }),
    }
  )
);