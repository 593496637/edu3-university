import { Link, useLocation } from "react-router";
import { useWalletContext } from "../context/WalletContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
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
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderWalletButton = () => {
    if (loading) {
      return (
        <button 
          disabled
          className="bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
        >
          连接中...
        </button>
      );
    }

    if (isConnected && account) {
      if (!isCorrectNetwork) {
        return (
          <button 
            onClick={switchToSepolia}
            className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
          >
            切换到Sepolia
          </button>
        );
      }

      return (
        <div className="flex items-center space-x-2">
          <span className="text-green-600 text-sm">● {formatAddress(account)}</span>
          <button 
            onClick={disconnectWallet}
            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-600"
          >
            断开
          </button>
        </div>
      );
    }

    return (
      <button 
        onClick={connectWallet}
        className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
      >
        连接钱包
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                Web3 Edu
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                首页
              </Link>
              <Link
                to="/courses"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/courses")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                课程
              </Link>
              <Link
                to="/staking"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/staking")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                质押
              </Link>
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/profile")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                我的
              </Link>
              {renderWalletButton()}
            </div>
          </div>
        </div>
      </nav>

      {/* Network Warning */}
      {isConnected && !isCorrectNetwork && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              ⚠️
            </div>
            <div className="ml-3">
              <p className="text-sm">
                请切换到 Sepolia 测试网络以使用所有功能。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}