/**
 * Web3 教育平台主应用组件
 * 
 * 功能概述：
 * - 设置应用级错误边界和Toast通知系统
 * - 配置路由：课程(/courses)、质押(/staking)、个人资料(/profile)、调试(/debug)
 * - 提供统一的布局容器和导航结构
 * 
 * 技术栈：React Router + Toast Context + Error Boundaries
 */

import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import Courses from "./pages/Courses";
import Staking from "./pages/Staking";
import Profile from "./pages/Profile";
import Debug from "./pages/Debug";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  // 应用架构：错误边界 -> Toast系统 -> 路由 -> 布局 -> 页面内容
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/courses" replace />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
              <Route path="/debug" element={<Debug />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
