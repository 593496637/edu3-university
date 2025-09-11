import { useWalletContext } from '../context/WalletContext';

export default function WalletButton() {
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    loading, 
    connectWallet, 
    switchToSepolia, 
    disconnectWallet,
    formatAddress 
  } = useWalletContext();

  if (loading) {
    return (
      <button 
        disabled
        className="bg-gray-600/50 text-gray-300 px-6 py-2 rounded-xl text-sm font-medium cursor-not-allowed border border-gray-600/50 flex items-center gap-2"
      >
        <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-300 rounded-full animate-spin"></div>
        连接中...
      </button>
    );
  }

  if (isConnected && account) {
    if (!isCorrectNetwork) {
      return (
        <button 
          onClick={switchToSepolia}
          className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:from-red-500 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-red-500/25"
        >
          切换到Sepolia
        </button>
      );
    }

    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          <span className="text-green-400 text-sm font-mono">{formatAddress(account)}</span>
        </div>
        <button 
          onClick={disconnectWallet}
          className="bg-gradient-to-r from-red-600/80 to-pink-600/80 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-red-500 hover:to-pink-500 transition-all duration-300 border border-red-500/30"
        >
          断开
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={connectWallet}
      className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 border border-cyan-500/30"
    >
      连接钱包
    </button>
  );
}