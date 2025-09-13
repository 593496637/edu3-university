/**
 * React 应用入口文件
 * 
 * 使用 React 18 的 createRoot API，在严格模式下挂载应用到 DOM
 * 严格模式帮助在开发环境中检测潜在问题和不安全的生命周期
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
