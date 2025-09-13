/**
 * 用户个人中心页面 - 综合性的用户管理和数据展示页面
 * 
 * 核心功能：
 * 1. 用户资料管理 - 支持昵称和个人简介的编辑更新
 * 2. 数字资产展示 - 显示YDToken余额和实时更新
 * 3. 学习数据统计 - 展示已购买和已创建的课程数量
 * 4. 合约所有者权限 - 为合约owner提供代币铸造功能
 * 5. Web3签名认证 - 使用钱包签名验证用户身份
 * 6. 数据安全保护 - 采用nonce机制防止重放攻击
 * 
 * 技术实现：
 * - 集成Web3钱包签名进行用户身份验证
 * - 使用ethers.js进行消息签名和验证
 * - 实现防重放攻击的nonce机制
 * - 响应式布局适配多设备访问
 * - 实时数据加载和状态同步
 * 
 * 安全特性：
 * - 消息签名包含时间戳和随机nonce
 * - 服务端验证签名的合法性和有效期
 * - 敏感操作需要重新签名确认
 * 
 * 数据流：
 * 钱包连接 → 加载用户资料 → 显示资产统计 → 支持编辑更新 → 签名验证 → 同步到后端
 */

// React核心hooks
import { useState, useEffect, useCallback } from "react";
// Web3库，用于钱包交互和消息签名
import { ethers } from "ethers";
// 全局状态管理
import { useAuthStore } from "../store/authStore";
// 用户资料相关的自定义hook
import { useProfile } from "../features/profile/hooks/useProfile";
// API服务层
import { userApi } from "../services/api";              // 用户资料API
import { nonceService } from "../services/nonceService"; // 防重放攻击服务

/**
 * 用户资料数据结构定义
 * 
 * 这个接口定义了用户可以编辑的基本资料字段
 * 与后端API的用户表结构保持一致
 */
interface UserProfile {
  nickname: string;        // 用户昵称，用于显示友好的用户标识
  bio: string;            // 个人简介，用户可以描述自己的背景和兴趣
  wallet_address: string; // 钱包地址，作为用户的唯一标识符
}

export default function Profile() {
  // === 全局状态获取 ===
  // 从认证状态管理中获取钱包连接信息和代币余额
  const { account, isConnected, balance } = useAuthStore();
  
  // === 用户数据管理 ===
  // 从useProfile hook中获取用户相关数据和操作函数
  const {
    loading,              // 数据加载状态
    purchasedCourses,    // 用户购买的课程列表
    createdCourses,      // 用户创建的课程列表
    isOwner,             // 是否为合约所有者（可以铸造代币）
    loadUserBalance,     // 刷新用户代币余额
    loadUserCourses,     // 刷新用户课程数据
    mintTokensToSelf,    // 为自己铸造代币（仅owner）
  } = useProfile();

  // === 本地状态管理 ===
  // 用户资料表单数据，初始化时使用当前钱包地址
  const [profile, setProfile] = useState<UserProfile>({
    nickname: "",                    // 昵称初始为空
    bio: "",                        // 简介初始为空
    wallet_address: account || "",  // 钱包地址使用当前连接的账户
  });
  
  // 资料更新操作的加载状态
  const [updating, setUpdating] = useState(false);
  
  // 代币铸造数量输入值（仅owner可见）
  const [mintAmount, setMintAmount] = useState("");
  
  // 用户资料加载状态（区别于课程数据加载）
  const [profileLoading, setProfileLoading] = useState(false);

  /**
   * 手动刷新所有用户数据
   * 
   * 这个函数会并发执行多个数据加载操作，提高页面响应速度：
   * 1. 重新加载用户资料（从后端API）
   * 2. 重新加载代币余额（从区块链）
   * 3. 重新加载课程数据（从后端API和区块链）
   * 
   * 使用场景：
   * - 用户点击刷新按钮
   * - 数据可能过期时的主动更新
   * - 执行操作后确保数据同步
   * 
   * @async
   */
  const handleRefreshData = async () => {
    // 只有在钱包已连接且有账户地址时才执行刷新
    if (account && isConnected) {
      try {
        // 使用Promise.all并发执行多个异步操作，提高性能
        await Promise.all([
          loadUserProfile(),    // 加载用户基本资料
          loadUserBalance(),    // 加载代币余额
          loadUserCourses(),    // 加载课程数据
        ]);
        console.log("数据刷新完成");
      } catch (error) {
        console.error("刷新数据失败:", error);
      }
    }
  };

  /**
   * 格式化钱包地址显示
   * 
   * 将完整的以太坊地址（42个字符）缩短为易读格式
   * 例如：0x742d35Cc6635C0532925a3b8D7389...8f4E → 0x742d...8f4E
   * 
   * @param address 完整的以太坊地址
   * @returns 格式化后的短地址
   */
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * 从后端API加载用户资料数据
   * 
   * 这个函数负责：
   * 1. 根据当前钱包地址查询用户资料
   * 2. 处理新用户（数据库中不存在）的情况
   * 3. 更新本地表单状态以供用户编辑
   * 4. 处理API调用失败的容错逻辑
   * 
   * 数据来源：后端数据库中的用户表
   * 容错机制：如果用户不存在或API失败，使用默认空值
   * 
   * @async
   */
  const loadUserProfile = useCallback(async () => {
    // 没有钱包地址时直接返回
    if (!account) return;

    setProfileLoading(true);
    try {
      // 调用后端API获取用户资料
      const userResponse = await userApi.getUser(account);

      if (userResponse.success) {
        // API调用成功，使用返回的用户数据
        const userData = userResponse.data as UserProfile;
        setProfile({
          nickname: userData.nickname || "",                    // 昵称可能为空
          bio: userData.bio || "",                            // 简介可能为空
          wallet_address: userData.wallet_address || account,  // 确保地址不为空
        });
      } else {
        // API调用失败或用户不存在，使用默认值
        setProfile({
          nickname: "",
          bio: "",
          wallet_address: account,  // 至少保证钱包地址正确
        });
      }
    } catch (error) {
      // 网络错误或其他异常，记录错误但不中断用户体验
      console.error("加载用户数据失败:", error);
    }
    setProfileLoading(false);
  }, [account]); // 依赖钱包地址，地址变化时重新加载

  /**
   * 组件挂载和钱包连接状态变化时加载用户资料
   * 
   * 触发条件：
   * 1. 组件首次挂载
   * 2. 用户切换钱包账户
   * 3. 钱包连接状态变化
   * 
   * 这确保了用户看到的始终是当前钱包对应的资料数据
   */
  useEffect(() => {
    if (account && isConnected) {
      loadUserProfile();
    }
  }, [account, isConnected, loadUserProfile]);

  /**
   * 更新用户资料到后端数据库
   * 
   * 这是一个安全的Web3用户认证更新流程：
   * 
   * 安全机制：
   * 1. 获取防重放攻击的nonce（如果服务可用）
   * 2. 构造包含时间戳和用户数据的消息
   * 3. 使用用户的私钥对消息进行数字签名
   * 4. 后端验证签名的有效性和消息的完整性
   * 5. 验证通过后更新数据库并消费nonce
   * 
   * 更新流程：
   * 1. 检查钱包连接状态
   * 2. 尝试获取nonce（增强安全性）
   * 3. 构造待签名消息
   * 4. 请求用户签名确认
   * 5. 发送签名数据到后端验证
   * 6. 处理更新结果和用户反馈
   * 
   * 容错处理：
   * - nonce服务不可用时降级到时间戳模式
   * - 签名被拒绝时给出友好提示
   * - 网络错误时保持用户输入数据
   * 
   * @async
   */
  const updateProfile = async () => {
    // 前置检查：确保钱包已连接
    if (!account || !window.ethereum) {
      alert("请先连接钱包");
      return;
    }

    setUpdating(true);
    try {
      // === 第一步：获取安全nonce ===
      let nonce: string | undefined;
      try {
        // 尝试从nonce服务获取一次性随机数，防止重放攻击
        nonce = await nonceService.getNonce(account);
      } catch (error) {
        // nonce服务不可用时，降级到传统时间戳模式
        console.warn("获取nonce失败，将使用传统时间戳方式:", error);
      }

      // === 第二步：构造签名消息 ===
      const timestamp = Date.now();
      // 根据是否有nonce构造不同格式的消息
      const message = nonce
        ? `Update profile with nonce ${nonce}: ${profile.nickname} - ${profile.bio} at ${timestamp}`
        : `Update profile: ${profile.nickname} - ${profile.bio} at ${timestamp}`;

      // === 第三步：用户数字签名 ===
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      // 请求用户对消息进行签名（会弹出MetaMask签名确认窗口）
      const signature = await signer.signMessage(message);

      // === 第四步：发送到后端验证 ===
      const response = await userApi.updateProfile(
        account,
        profile.nickname,
        profile.bio,
        signature,
        timestamp,
        nonce
      );

      // === 第五步：处理nonce消费 ===
      if (nonce && response.success) {
        // 更新成功后标记nonce已使用，防止重复使用
        nonceService.consumeNonce(account);
      }

      // === 第六步：处理更新结果 ===
      if (response.success) {
        alert("资料更新成功！");
        // 重新加载资料确保数据同步
        await loadUserProfile();
      } else {
        alert("更新失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      // 处理各种可能的错误：网络错误、签名拒绝、API错误等
      console.error("更新资料失败:", error);
      alert(
        "更新失败: " + (error instanceof Error ? error.message : "未知错误")
      );
    }
    setUpdating(false);
  };

  /**
   * 处理代币铸造操作（仅合约所有者可用）
   * 
   * 这是一个强大的管理功能，允许合约所有者：
   * 1. 为自己或平台铸造新的YDToken
   * 2. 用于平台运营、奖励发放等场景
   * 3. 铸造后立即更新余额显示
   * 
   * 安全检查：
   * - 前端检查用户是否为合约owner
   * - 智能合约层面也会验证调用者权限
   * - 输入验证确保数量为正数
   * 
   * 流程说明：
   * 1. 验证输入的代币数量
   * 2. 调用智能合约的mint函数
   * 3. 等待区块链交易确认
   * 4. 更新用户余额显示
   * 5. 清空输入框准备下次操作
   * 
   * @async
   */
  const handleMintTokens = async () => {
    // 输入验证：确保用户输入了有效的正数
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      alert("请输入有效的数量");
      return;
    }

    try {
      // 调用合约的mint函数铸造代币
      await mintTokensToSelf(mintAmount);
      alert("代币发放成功！");
      
      // 操作成功后清空输入框
      setMintAmount("");
      
      // 立即刷新余额显示，让用户看到最新数据
      await loadUserBalance();
    } catch (error: unknown) {
      // 处理各种可能的错误：权限不足、交易失败、网络错误等
      console.error("发放代币失败:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      alert("发放失败: " + errorMessage);
    }
  };

  if (!isConnected || !account) {
    return (
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              个人中心
            </h1>
            <p className="text-gray-300 text-xl">管理您的账户信息和学习进度</p>
          </div>

          <div className="max-w-md mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🦊</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">连接钱包</h2>
            <p className="text-gray-300 mb-6">
              请先连接您的MetaMask钱包以查看个人信息和资产。
            </p>
            <button
              onClick={() => (window.location.href = "/courses")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
            >
              返回课程页面
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              个人中心
            </h1>
            <button
              onClick={handleRefreshData}
              disabled={loading}
              className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="刷新数据"
            >
              <svg
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-300 text-xl">管理您的账户信息和学习进度</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Account Info Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-8">
              <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">账户信息</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  钱包地址
                </label>
                <div className="p-4 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-400 font-mono text-sm">
                  {formatAddress(account)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  昵称
                </label>
                <input
                  type="text"
                  placeholder="输入昵称"
                  value={profile.nickname}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                  disabled={profileLoading}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  个人简介
                </label>
                <textarea
                  placeholder="输入个人简介"
                  rows={4}
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  disabled={profileLoading}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 resize-none disabled:opacity-50"
                />
              </div>

              <button
                onClick={updateProfile}
                disabled={updating || profileLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "更新中..." : "更新资料"}
              </button>
            </div>
          </div>

          {/* Assets Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-8">
              <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">我的资产</h2>
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">YD代币余额</span>
                <span className="font-bold text-2xl bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {parseFloat(balance).toFixed(4)} YD
                </span>
              </div>

              {isOwner && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <h3 className="text-green-300 font-semibold mb-3">
                    Owner功能
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="发放数量"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 text-sm"
                    />
                    <button
                      onClick={handleMintTokens}
                      disabled={loading || !mintAmount}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 text-sm"
                    >
                      发放
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                学习统计
                {loading && (
                  <span className="ml-2 text-xs text-gray-400">
                    (加载中...)
                  </span>
                )}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">已购买课程</span>
                  <span className="text-pink-400 font-semibold">
                    {loading ? "..." : `${purchasedCourses.length} 门`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">已创建课程</span>
                  <span className="text-cyan-400 font-semibold">
                    {loading ? "..." : `${createdCourses.length} 门`}
                  </span>
                </div>
                {!loading &&
                  purchasedCourses.length === 0 &&
                  createdCourses.length === 0 && (
                    <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-300 text-sm mb-2">
                        暂无课程数据，请点击右上角刷新按钮重新加载
                      </p>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>账户: {account || "未连接"}</div>
                        <div>连接状态: {isConnected ? "已连接" : "未连接"}</div>
                        <div>账户余额: {balance} YD</div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Purchased Courses */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-xl font-semibold text-white">已购买课程</h2>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">加载中...</p>
              </div>
            ) : purchasedCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">暂无购买记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchasedCourses.slice(0, 3).map((course, index) => (
                  <div
                    key={course.id || index}
                    className="p-3 bg-gray-700/30 rounded-lg"
                  >
                    <h3 className="text-white font-medium text-sm">
                      {course.title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {course.price} YD
                    </p>
                  </div>
                ))}
                {purchasedCourses.length > 3 && (
                  <p className="text-gray-400 text-sm text-center">
                    还有 {purchasedCourses.length - 3} 门课程...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Created Courses */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-xl font-semibold text-white">已创建课程</h2>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">加载中...</p>
              </div>
            ) : createdCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">暂无创建记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {createdCourses.slice(0, 3).map((course, index) => (
                  <div
                    key={course.id || index}
                    className="p-3 bg-gray-700/30 rounded-lg"
                  >
                    <h3 className="text-white font-medium text-sm">
                      {course.title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {course.price} YD
                    </p>
                  </div>
                ))}
                {createdCourses.length > 3 && (
                  <p className="text-gray-400 text-sm text-center">
                    还有 {createdCourses.length - 3} 门课程...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
