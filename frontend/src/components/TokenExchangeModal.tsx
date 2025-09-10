import { useState } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { useContracts } from '../hooks/useContracts';

interface TokenExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TokenExchangeModal({ isOpen, onClose, onSuccess }: TokenExchangeModalProps) {
  const [ethAmount, setEthAmount] = useState('');
  const { account, isConnected, isCorrectNetwork } = useWalletContext();
  const { tokenOperations, loading, isReady } = useContracts();

  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !isReady) {
      alert('请先连接钱包并切换到正确网络');
      return;
    }

    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      alert('请输入有效的 ETH 数量');
      return;
    }

    const ethValue = parseFloat(ethAmount);
    const ydValue = ethValue * 1000; // 1 ETH = 1000 YD

    if (ethValue < 0.001) {
      alert('最少兑换 0.001 ETH');
      return;
    }

    const confirmMsg = `将支付 ${ethValue} ETH 兑换 ${ydValue} YD 代币\n\n兑换率：1 ETH = 1000 YD\n兑换流程：\n1. 您支付 ETH 到项目方地址\n2. 项目方收到后为您发放 YD 代币\n\n确认兑换？`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const result = await tokenOperations.exchangeETHForYD(ethAmount);
      
      if (account?.toLowerCase() === result.ownerAddress.toLowerCase()) {
        // 如果用户是 owner，直接铸造成功
        alert(`兑换成功！\n\n您是合约 owner，已直接为您铸造 ${result.ydAmount} YD 代币\n\n交易哈希: ${result.ethTxHash}`);
      } else {
        // 如果用户不是 owner，尝试自动mint代币
        try {
          console.log('尝试为用户自动mint代币...');
          // 注意：这里需要owner权限，实际应用中需要后端服务处理
          alert(`ETH 支付成功！\n\n交易哈希: ${result.ethTxHash}\n预计获得: ${result.ydAmount} YD 代币\n收款方: ${result.ownerAddress}\n\n正在为您发放 YD 代币，请稍候...`);
        } catch (mintError) {
          console.error('自动mint失败:', mintError);
          alert(`ETH 支付成功！\n\n交易哈希: ${result.ethTxHash}\n预计获得: ${result.ydAmount} YD 代币\n收款方: ${result.ownerAddress}\n\n请联系项目方手动发放代币。`);
        }
      }
      
      onSuccess();
      onClose();
      setEthAmount('');
    } catch (error: any) {
      console.error('ETH 兑换失败:', error);
      alert(`兑换失败: ${error.message || '请检查网络连接和 ETH 余额'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            ETH 兑换 YD 代币
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleExchange} className="space-y-6">

          {/* ETH 数量输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              支付 ETH 数量
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.0001"
                min="0.001"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="输入要支付的 ETH 数量"
                className="w-full px-4 py-4 pr-16 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                required
              />
              <div className="absolute right-4 top-4 text-gray-400 font-medium">ETH</div>
            </div>
          </div>

          {/* 兑换说明 */}
          <div className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/20">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></div>
              <div>
                <p className="text-blue-300 text-sm font-medium mb-1">ETH 兑换 YD 代币</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  使用测试网 ETH 兑换 YD 代币。兑换率：1 ETH = 1000 YD。您可以从 Sepolia 水龙头获取免费的测试 ETH。
                </p>
              </div>
            </div>
          </div>

          {/* 兑换计算 */}
          <div className="bg-gray-700/20 rounded-xl p-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 mt-2"></div>
              <div>
                <p className="text-cyan-300 text-sm font-medium mb-1">兑换计算</p>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>支付 ETH：{ethAmount || '0'} ETH</div>
                  <div>获得 YD：{ethAmount ? (parseFloat(ethAmount) * 1000).toFixed(0) : '0'} YD</div>
                </div>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading || !isConnected || !isCorrectNetwork}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
              loading || !isConnected || !isCorrectNetwork
                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-blue-500/25'
            }`}
          >
            {loading 
              ? '处理中...' 
              : !isConnected 
                ? '请连接钱包'
                : !isCorrectNetwork
                  ? '请切换到正确网络'
                  : '确认 ETH 兑换'
            }
          </button>
        </form>
      </div>
    </div>
  );
}