import { useState, useEffect } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { useContracts } from '../hooks/useContracts';

interface StakeInfo {
  amount: string;
  startTime: number;
  isActive: boolean;
}

export default function Staking() {
  const { account, isConnected } = useWalletContext();
  const { tokenOperations, stakingOperations, loading, isReady } = useContracts();
  
  const [stakeAmount, setStakeAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [stakeInfo, setStakeInfo] = useState<StakeInfo>({ amount: '0', startTime: 0, isActive: false });
  const [reward, setReward] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [dailyRate, setDailyRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 加载用户数据
  useEffect(() => {
    if (account && isReady) {
      loadUserData();
      const interval = setInterval(loadUserData, 30000); // 每30秒刷新一次
      return () => clearInterval(interval);
    }
  }, [account, isReady]);

  const loadUserData = async () => {
    if (!account) return;
    
    try {
      const [userBalance, userStakeInfo, userReward, totalStakedAmount, rewardRate] = await Promise.all([
        tokenOperations.getBalance(account),
        stakingOperations.getStakeInfo(account),
        stakingOperations.calculateReward(account),
        stakingOperations.getTotalStaked(),
        stakingOperations.getDailyRewardRate()
      ]);
      
      setBalance(userBalance);
      setStakeInfo(userStakeInfo);
      setReward(userReward);
      setTotalStaked(totalStakedAmount);
      setDailyRate(rewardRate / 100); // 转换为百分比
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  };

  const handleStake = async () => {
    if (!account || !stakeAmount || parseFloat(stakeAmount) <= 0) {
      setMessage('请输入有效的质押数量');
      return;
    }

    if (parseFloat(stakeAmount) > parseFloat(balance)) {
      setMessage('余额不足');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      // 1. 先授权质押合约
      setMessage('授权中...');
      await tokenOperations.approve('0xf5924164C4685f650948bf4a51124f0CB24DA026', stakeAmount);
      
      // 2. 执行质押
      setMessage('质押中...');
      await stakingOperations.stake(stakeAmount);
      
      setMessage('质押成功！');
      setStakeAmount('');
      await loadUserData(); // 刷新数据
    } catch (error: any) {
      console.error('质押失败:', error);
      setMessage(`质押失败: ${error.message || '未知错误'}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUnstake = async () => {
    if (!account || !stakeInfo.isActive) {
      setMessage('当前没有质押');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      setMessage('取消质押中...');
      await stakingOperations.unstake();
      
      setMessage('取消质押成功，本金和收益已返还！');
      await loadUserData(); // 刷新数据
    } catch (error: any) {
      console.error('取消质押失败:', error);
      setMessage(`取消质押失败: ${error.message || '未知错误'}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return '未质押';
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const calculateDaysStaked = (startTime: number) => {
    if (!startTime) return 0;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, Math.floor((now - startTime) / 86400));
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">请先连接钱包</h2>
          <p className="text-gray-500">需要连接MetaMask钱包才能使用质押功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
            YD代币质押
          </h1>
          <p className="text-gray-300 text-xl">
            质押您的YD代币，获得丰厚的每日收益
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{(dailyRate * 365).toFixed(0)}%</div>
            <div className="text-gray-400">APY年化收益率</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{dailyRate}%</div>
            <div className="text-gray-400">每日收益率</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">{parseFloat(totalStaked).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</div>
            <div className="text-gray-400">总质押量 YD</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staking Info Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">我的质押信息</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">当前质押金额</span>
                <span className="font-bold text-2xl bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                  {parseFloat(stakeInfo.amount).toFixed(2)} YD
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">待领取收益</span>
                <span className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {parseFloat(reward).toFixed(4)} YD
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">质押时间</span>
                <span className="font-bold text-lg text-purple-400">
                  {formatDateTime(stakeInfo.startTime)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">已质押天数</span>
                <span className="font-bold text-lg text-orange-400">
                  {calculateDaysStaked(stakeInfo.startTime)} 天
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">钱包余额</span>
                <span className="font-bold text-lg text-blue-400">
                  {parseFloat(balance).toFixed(2)} YD
                </span>
              </div>
            </div>
          </div>

          {/* Staking Actions Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">质押操作</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  质押数量 (YD)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="输入质押数量"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    disabled={isLoading || loading}
                    className="w-full px-4 py-4 pr-16 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 disabled:opacity-50"
                  />
                  <div className="absolute right-4 top-4 text-gray-400">YD</div>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-400">
                  <span>可用余额: {parseFloat(balance).toFixed(2)} YD</span>
                  <button 
                    type="button"
                    onClick={() => setStakeAmount(balance)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    全部
                  </button>
                </div>
              </div>

              {/* 状态提示 */}
              {message && (
                <div className={`p-4 rounded-xl text-sm ${
                  message.includes('成功') 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                    : message.includes('失败') || message.includes('不足') 
                    ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                    : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                }`}>
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <button 
                  onClick={handleStake}
                  disabled={isLoading || loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-6 rounded-xl hover:from-green-500 hover:to-teal-500 transition-all duration-300 shadow-lg hover:shadow-green-500/25 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '处理中...' : '质押代币'}
                </button>
                
                <button 
                  onClick={handleUnstake}
                  disabled={isLoading || loading || !stakeInfo.isActive}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-red-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-red-500/25 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '处理中...' : '取消质押'}
                </button>
              </div>

              {/* Info Note */}
              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></div>
                  <div>
                    <p className="text-blue-300 text-sm font-medium mb-1">质押说明</p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      质押后每日可获得1%收益，收益每天自动计算。取消质押无锁定期，本金和收益将一起返还到钱包。
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      注意：质押和取消质押需要支付少量ETH作为gas费用
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}