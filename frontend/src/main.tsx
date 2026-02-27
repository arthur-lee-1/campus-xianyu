// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
// 导入路由配置
import router from './router/index.tsx';
// 导入全局样式（Tailwind 生效必备）
import './index.css';

// 挂载路由到根节点
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);