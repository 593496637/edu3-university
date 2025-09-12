import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useAuthStore } from "../store/authStore";
import { useProfile } from "../features/profile/hooks/useProfile";
import { userApi } from "../services/api";
import { nonceService } from "../services/nonceService";

interface UserProfile {
  nickname: string;
  bio: string;
  wallet_address: string;
}

export default function Profile() {
  const { account, isConnected, balance } = useAuthStore();
  const {
    loading,
    purchasedCourses,
    createdCourses,
    isOwner,
    loadUserBalance,
    loadUserCourses,
    mintTokensToSelf,
  } = useProfile();

  const [profile, setProfile] = useState<UserProfile>({
    nickname: "",
    bio: "",
    wallet_address: account || "",
  });
  const [updating, setUpdating] = useState(false);
  const [mintAmount, setMintAmount] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // 手动刷新所有数据
  const handleRefreshData = async () => {
    if (account && isConnected) {
      try {
        await Promise.all([
          loadUserProfile(),
          loadUserBalance(),
          loadUserCourses(),
        ]);
        console.log("数据刷新完成");
      } catch (error) {
        console.error("刷新数据失败:", error);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const loadUserProfile = useCallback(async () => {
    if (!account) return;

    setProfileLoading(true);
    try {
      const userResponse = await userApi.getUser(account);

      if (userResponse.success) {
        const userData = userResponse.data as UserProfile;
        setProfile({
          nickname: userData.nickname || "",
          bio: userData.bio || "",
          wallet_address: userData.wallet_address || account,
        });
      } else {
        setProfile({
          nickname: "",
          bio: "",
          wallet_address: account,
        });
      }
    } catch (error) {
      console.error("加载用户数据失败:", error);
    }
    setProfileLoading(false);
  }, [account]);

  // 组件挂载时加载用户资料
  useEffect(() => {
    if (account && isConnected) {
      loadUserProfile();
    }
  }, [account, isConnected, loadUserProfile]);

  const updateProfile = async () => {
    if (!account || !window.ethereum) {
      alert("请先连接钱包");
      return;
    }

    setUpdating(true);
    try {
      let nonce: string | undefined;
      try {
        nonce = await nonceService.getNonce(account);
      } catch (error) {
        console.warn("获取nonce失败，将使用传统时间戳方式:", error);
      }

      const timestamp = Date.now();
      const message = nonce
        ? `Update profile with nonce ${nonce}: ${profile.nickname} - ${profile.bio} at ${timestamp}`
        : `Update profile: ${profile.nickname} - ${profile.bio} at ${timestamp}`;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      const response = await userApi.updateProfile(
        account,
        profile.nickname,
        profile.bio,
        signature,
        timestamp,
        nonce
      );

      if (nonce && response.success) {
        nonceService.consumeNonce(account);
      }

      if (response.success) {
        alert("资料更新成功！");
        await loadUserProfile();
      } else {
        alert("更新失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("更新资料失败:", error);
      alert(
        "更新失败: " + (error instanceof Error ? error.message : "未知错误")
      );
    }
    setUpdating(false);
  };

  const handleMintTokens = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      alert("请输入有效的数量");
      return;
    }

    try {
      await mintTokensToSelf(mintAmount);
      alert("代币发放成功！");
      setMintAmount("");
      await loadUserBalance();
    } catch (error: unknown) {
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
