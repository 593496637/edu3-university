/**
 * 通用按钮组件 - 提供一致的视觉设计和交互体验
 * 
 * 核心特性：
 * 1. 多种视觉变体 - primary/secondary/danger/success/ghost 五种风格
 * 2. 三种尺寸规格 - sm/md/lg 适配不同使用场景
 * 3. 加载状态支持 - 内置加载动画和禁用逻辑
 * 4. 图标支持 - 灵活的图标位置和展示
 * 5. 完整的可访问性 - 键盘导航、焦点管理、屏幕阅读器支持
 * 
 * 设计理念：
 * - 使用渐变背景和阴影创造科技感视觉效果
 * - 流畅的过渡动画提升用户体验
 * - 一致的视觉语言保持界面统一性
 * - 状态反馈帮助用户理解操作结果
 * 
 * 使用场景：
 * - primary: 主要操作按钮（提交、确认、购买等）
 * - secondary: 次要操作按钮（取消、重置等）
 * - danger: 危险操作按钮（删除、清空等）
 * - success: 成功操作按钮（保存、完成等）
 * - ghost: 轻量化按钮（链接式操作）
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * 按钮组件属性接口
 * 
 * 扩展了原生button元素的所有HTML属性，并添加了自定义属性
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮视觉样式变体 */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  /** 按钮尺寸大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示加载状态 - 显示时会禁用按钮并显示加载动画 */
  loading?: boolean;
  /** 按钮图标 - 显示在文本前面 */
  icon?: ReactNode;
  /** 按钮内容 - 通常是文本 */
  children: ReactNode;
}

export default function Button({ 
  variant = 'primary',    // 默认使用主要样式
  size = 'md',           // 默认使用中等尺寸
  loading = false,       // 默认非加载状态
  icon,
  children,
  className = '',
  disabled,
  ...props               // 传递所有其他HTML button属性
}: ButtonProps) {
  // === 样式类定义 ===
  
  // 基础样式类 - 所有按钮共享的核心样式
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // 变体样式类 - 不同按钮类型的特定样式
  const variantClasses = {
    // 主要按钮：青色到蓝色渐变，用于最重要的操作
    primary: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg hover:shadow-cyan-500/25 focus:ring-cyan-500/50',
    // 次要按钮：灰色背景带边框，用于辅助操作
    secondary: 'bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-600/50 hover:text-white focus:ring-gray-500/50',
    // 危险按钮：红色到粉色渐变，用于删除等危险操作
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500 shadow-lg hover:shadow-red-500/25 focus:ring-red-500/50',
    // 成功按钮：绿色到青色渐变，用于确认和保存操作
    success: 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-500 hover:to-teal-500 shadow-lg hover:shadow-green-500/25 focus:ring-green-500/50',
    // 幽灵按钮：透明背景，用于轻量化操作
    ghost: 'text-gray-300 hover:text-white hover:bg-gray-700/30 focus:ring-gray-500/50'
  };
  
  // 尺寸样式类 - 不同大小按钮的内边距和字体设置
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',    // 小尺寸：适合工具栏和紧凑布局
    md: 'px-4 py-3 text-sm',    // 中尺寸：最常用的默认大小
    lg: 'px-6 py-4 text-base'   // 大尺寸：适合重要的行动召唤按钮
  };

  // === 按钮渲染 ===
  return (
    <button
      // 组合所有样式类：基础 + 变体 + 尺寸 + 自定义
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      // 在加载状态或明确禁用时禁用按钮
      disabled={disabled || loading}
      // 传递所有其他属性（onClick、type等）
      {...props}
    >
      {/* 根据加载状态渲染不同内容 */}
      {loading ? (
        /* 加载状态：显示加载动画和文本 */
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" color="white" />
          {children}
        </div>
      ) : (
        /* 正常状态：显示图标和文本 */
        <div className="flex items-center gap-2">
          {/* 如果有图标则显示，图标在文本前面 */}
          {icon && <span className="text-lg">{icon}</span>}
          {children}
        </div>
      )}
    </button>
  );
}