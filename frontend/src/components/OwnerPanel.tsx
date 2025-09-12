import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { courseService } from '../services/courseService';

interface OwnerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OwnerPanel({ isOpen, onClose }: OwnerPanelProps) {
  const [userAddress, setUserAddress] = useState('');
  const [ydAmount, setYdAmount] = useState('');
  const { isConnected } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleMintTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }
    
    if (!userAddress || !ydAmount) {
      alert('请填写用户地址和代币数量');
      return;
    }

    // 验证用户地址格式
    if (!userAddress.startsWith('0x') || userAddress.length !== 42) {
      alert('请输入有效的以太坊地址');
      return;
    }

    // 验证代币数量
    const amount = parseFloat(ydAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效的代币数量');
      return;
    }

    try {
      const txHash = await tokenOperations.mintExchangeTokens(userAddress, amount);
      alert(`代币发放成功！\n\n交易哈希: ${txHash}\n用户地址: ${userAddress}\n代币数量: ${amount} YD`);
      setUserAddress('');
      setYdAmount('');
    } catch (error: unknown) {
      console.error('发放代币失败:', error);
      const errorMessage = error instanceof Error ? error.message : '请检查权限和参数';
      alert(`发放失败: ${errorMessage}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
            Owner 管理面板
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleMintTokens} className="space-y-6">
          
          {/* 用户地址输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              用户地址
            </label>
            <input
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="输入要发放代币的用户地址"
              className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
              required
            />
          </div>

          {/* YD代币数量输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              YD 代币数量
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={ydAmount}
                onChange={(e) => setYdAmount(e.target.value)}
                placeholder="输入要发放的 YD 代币数量"
                className="w-full px-4 py-4 pr-16 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                required
              />
              <div className="absolute right-4 top-4 text-gray-400 font-medium">YD</div>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="p-4 rounded-xl border bg-orange-500/10 border-orange-500/20">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2"></div>
              <div>
                <p className="text-orange-300 text-sm font-medium mb-1">Owner 专用功能</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  为用户手动发放 YD 代币。通常用于处理 ETH 兑换请求或奖励发放。
                </p>
              </div>
            </div>
          </div>

          {/* 连接状态提示 */}
          {!isConnected && (
            <div className="p-4 rounded-xl border bg-red-500/10 border-red-500/20">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                <p className="text-red-300 text-sm">请先连接钱包</p>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading || !isConnected}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
              loading || !isConnected
                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 shadow-lg hover:shadow-orange-500/25'
            }`}
          >
            {loading ? '发放中...' : !isConnected ? '请先连接钱包' : '发放 YD 代币'}
          </button>
        </form>
      </div>
    </div>
  );
}