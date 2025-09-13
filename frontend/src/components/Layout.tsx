/**
 * 应用主布局组件
 * 
 * 功能概述：
 * - 科技风格背景动画和响应式导航栏
 * - 网络状态警告和合约所有者权限检查
 * - 钱包连接状态管理和页面路由导航
 * 
 * 架构：背景动画 + 导航栏 + 网络提示 + 页面内容 + 管理面板
 */

import { Link, useLocation } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../hooks/useWallet";
import { useAuthStore } from "../store/authStore";
import { useContracts } from "../hooks/useContracts";
import OwnerPanel from "./OwnerPanel";
import WalletButton from "./WalletButton";

interface LayoutProps {
  children: React.ReactNode;
}
export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isOwner, setIsOwner] = useState(false);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  const { account, isConnected, isCorrectNetwork } = useAuthStore();
  const { getYDTokenContract } = useContracts();
  
  useWallet();
  
  const isActive = (path: string) => location.pathname === path;

  // 检查当前用户是否为合约所有者
  const checkOwnerPermission = useCallback(async () => {
    if (!isConnected || !account) {
      setIsOwner(false);
      return;
    }
    
    try {
      const contract = await getYDTokenContract();
      const ownerAddress = await contract.owner();
      setIsOwner(account.toLowerCase() === ownerAddress.toLowerCase());
    } catch (error) {
      console.error('检查owner权限失败:', error);
      setIsOwner(false);
    }
  }, [isConnected, account, getYDTokenContract]);

  useEffect(() => {
    checkOwnerPermission();
  }, [isConnected, account, getYDTokenContract, checkOwnerPermission]);


  // 布局结构：科技背景 + 导航栏 + 网络提示 + 页面内容 + 管理面板
  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-x-hidden">
      {/* 科技风格网格背景动画 */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-px animate-pulse" style={{ top: '20%' }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px animate-pulse" style={{ top: '40%', animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent h-px animate-pulse" style={{ top: '60%', animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500 to-transparent w-px animate-pulse" style={{ left: '20%' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500 to-transparent w-px animate-pulse" style={{ left: '50%', animationDelay: '1.5s' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500 to-transparent w-px animate-pulse" style={{ left: '80%', animationDelay: '0.5s' }}></div>
      </div>

      {/* 顶部导航栏 */}
      <nav className="relative bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo区域 */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">W3</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Web3 Edu
                </span>
              </Link>
            </div>
            
            {/* 导航菜单和功能按钮 */}
            <div className="flex items-center space-x-8">
              <Link
                to="/courses"
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive("/courses") || isActive("/")
                    ? "text-cyan-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                课程
                {(isActive("/courses") || isActive("/")) && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                )}
              </Link>
              <Link
                to="/staking"
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive("/staking")
                    ? "text-cyan-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                质押
                {isActive("/staking") && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                )}
              </Link>
              <Link
                to="/profile"
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive("/profile")
                    ? "text-cyan-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                我的
                {isActive("/profile") && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                )}
              </Link>
              
              {/* 合约所有者管理入口 */}
              {isOwner && (
                <button
                  onClick={() => setShowOwnerPanel(true)}
                  className="relative px-4 py-2 text-sm font-medium transition-all duration-300 text-orange-400 hover:text-orange-300 flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  管理
                </button>
              )}
              
              <WalletButton />
            </div>
          </div>
        </div>
      </nav>

      {/* 网络状态警告提示 */}
      {isConnected && !isCorrectNetwork && (
        <div className="relative bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-3"></div>
              </div>
              <div className="flex-1">
                <p className="text-yellow-300 text-sm">
                  请切换到 Sepolia 测试网络以使用所有功能。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="relative">
        {children}
      </main>

      <OwnerPanel 
        isOpen={showOwnerPanel} 
        onClose={() => setShowOwnerPanel(false)} 
      />
    </div>
  );
}