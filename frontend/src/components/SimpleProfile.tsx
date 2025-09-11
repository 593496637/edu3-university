import { useWalletContext } from '../context/WalletContext';

export default function SimpleProfile() {
  console.log('SimpleProfile组件渲染');
  const { account, isConnected, formatAddress } = useWalletContext();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">个人中心测试</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-white mb-4">钱包状态</h2>
          <div className="space-y-2 text-gray-300">
            <p>连接状态: {isConnected ? '已连接' : '未连接'}</p>
            <p>账户地址: {account ? formatAddress(account) : '无'}</p>
            <p>完整地址: {account || '无'}</p>
          </div>
          
          {!isConnected && (
            <div className="mt-4 p-4 bg-yellow-600/20 border border-yellow-500/30 rounded">
              <p className="text-yellow-300">请连接您的MetaMask钱包</p>
            </div>
          )}
          
          {isConnected && (
            <div className="mt-4 p-4 bg-green-600/20 border border-green-500/30 rounded">
              <p className="text-green-300">钱包已连接，个人中心功能可用</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}