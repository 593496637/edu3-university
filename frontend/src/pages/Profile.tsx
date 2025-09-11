import { useState, useEffect } from "react";
import { useWalletContext } from "../context/WalletContext";
import { useContracts } from "../hooks/useContracts";
import { userApi, purchaseApi } from "../services/api";
import { nonceService } from "../services/nonceService";

interface UserProfile {
  nickname: string;
  bio: string;
  wallet_address: string;
}

interface PurchaseRecord {
  id: number;
  user_address: string;
  course_id: number;
  tx_hash: string;
  price_paid: string;
  created_at: string;
  title: string;
  description: string;
  price_yd: string;
}

export default function Profile() {
  const { account, isConnected, formatAddress } = useWalletContext();
  const { tokenOperations, stakingOperations } = useContracts();

  // 状态管理
  const [profile, setProfile] = useState<UserProfile>({
    nickname: "",
    bio: "",
    wallet_address: "",
  });
  const [balance, setBalance] = useState("0");
  const [stakeInfo, setStakeInfo] = useState({ amount: "0", reward: "0" });
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // 加载用户数据
  useEffect(() => {
    if (isConnected && account) {
      loadUserData();
    }
  }, [isConnected, account]);

  const loadUserData = async () => {
    if (!account) {
      return;
    }

    setLoading(true);
    try {
      const [userResponse, balanceResult, purchasesResponse] =
        await Promise.allSettled([
          userApi.getUser(account),
          tokenOperations.getBalance(account),
          purchaseApi.getUserPurchases(account),
        ]);

      // 单独加载质押数据
      await loadStakeData();

      // 处理用户资料
      if (userResponse.status === "fulfilled" && userResponse.value.success) {
        const userData = userResponse.value.data as UserProfile;
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

      // 处理余额
      if (balanceResult.status === "fulfilled") {
        setBalance(balanceResult.value);
      } else {
        setBalance("0");
      }

      // 处理购买记录
      if (
        purchasesResponse.status === "fulfilled" &&
        purchasesResponse.value.success
      ) {
        const purchaseData = purchasesResponse.value.data;
        if (Array.isArray(purchaseData)) {
          setPurchases(purchaseData as PurchaseRecord[]);
        } else {
          setPurchases([]);
        }
      } else {
        setPurchases([]);
      }
    } catch (error) {
      console.error("加载用户数据失败:", error);
    }
    setLoading(false);
  };

  const loadStakeData = async () => {
    if (!account) return { amount: "0", reward: "0" };

    try {
      const [stakeInfo, reward] = await Promise.all([
        stakingOperations.getStakeInfo(account),
        stakingOperations.calculateReward(account),
      ]);

      const stakeData = {
        amount: stakeInfo.amount,
        reward,
      };
      setStakeInfo(stakeData);
      return stakeData;
    } catch (error) {
      console.error("加载质押数据失败:", error);
      return { amount: "0", reward: "0" };
    }
  };

  const updateProfile = async () => {
    if (!account || !window.ethereum) {
      alert("请先连接钱包");
      return;
    }

    setUpdating(true);
    try {
      // 获取nonce以增强安全性
      let nonce: string | undefined;
      try {
        nonce = await nonceService.getNonce(account);
      } catch (error) {
        console.warn('获取nonce失败，将使用传统时间戳方式:', error);
      }

      // 创建签名消息
      const timestamp = Date.now();
      const message = nonce 
        ? `Update profile with nonce ${nonce}: ${profile.nickname} - ${profile.bio} at ${timestamp}`
        : `Update profile: ${profile.nickname} - ${profile.bio} at ${timestamp}`;

      // 获取签名
      const provider = new (await import("ethers")).BrowserProvider(
        window.ethereum
      );
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // 提交到后端
      const response = await userApi.updateProfile(
        account,
        profile.nickname,
        profile.bio,
        signature,
        timestamp,
        nonce
      );

      // 如果使用了nonce，在成功后消费它
      if (nonce && response.success) {
        nonceService.consumeNonce(account);
      }

      if (response.success) {
        alert("资料更新成功！");
        // 重新加载用户数据
        await loadUserData();
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

  // 如果钱包未连接，显示连接提示
  if (!isConnected || !account) {
    return (
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              个人中心
            </h1>
            <p className="text-gray-300 text-xl">管理您的账户信息和学习进度</p>
          </div>

          {/* 连接钱包提示 */}
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
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            个人中心
          </h1>
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
                  {isConnected && account
                    ? formatAddress(account)
                    : "请连接钱包"}
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
                  disabled={!isConnected || loading}
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
                  disabled={!isConnected || loading}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 resize-none disabled:opacity-50"
                />
              </div>

              <button
                onClick={updateProfile}
                disabled={!isConnected || updating || loading}
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
                  {loading
                    ? "..."
                    : `${parseFloat(balance || "0").toFixed(4)} YD`}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">质押中</span>
                <span className="font-bold text-xl text-green-400">
                  {loading
                    ? "..."
                    : `${parseFloat(stakeInfo.amount || "0").toFixed(4)} YD`}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">待领取收益</span>
                <span className="font-bold text-xl text-blue-400">
                  {loading
                    ? "..."
                    : `${parseFloat(stakeInfo.reward || "0").toFixed(4)} YD`}
                </span>
              </div>
            </div>

            {/* Learning Progress */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                学习进度
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">已完成课程</span>
                  <span className="text-pink-400 font-semibold">
                    {purchases.length} 门
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">学习时长</span>
                  <span className="text-cyan-400 font-semibold">0 小时</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchased Courses */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
          <div className="flex items-center mb-8">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
            <h2 className="text-2xl font-semibold text-white">已购买课程</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">加载中...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-500">📚</span>
              </div>
              <p className="text-gray-400">暂无购买记录</p>
              <p className="text-gray-500 text-sm mt-2">
                购买课程后将在这里显示
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(purchases) &&
                purchases.map((purchase, index) => (
                  <div
                    key={purchase.id || index}
                    className="p-4 bg-gray-700/30 border border-gray-600/30 rounded-xl"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {purchase.title || `课程 #${purchase.course_id}`}
                      </h3>
                      <span className="text-sm text-purple-400 font-medium">
                        {parseFloat(purchase.price_paid || "0").toFixed(4)} YD
                      </span>
                    </div>
                    {purchase.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {purchase.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>
                        购买时间:{" "}
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${purchase.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        查看交易 ↗
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
