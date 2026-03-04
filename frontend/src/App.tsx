import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from '@arco-design/web-react';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import { router } from '@/router';

/**
 * App 根组件
 *
 * - 负责挂载路由（React Router v6）
 * - 负责挂载 UI 框架的全局配置（这里使用 Arco 的中文语言包）
 *
 * 说明：
 * - 本项目按 README 约定使用 React + TS + Vite + React Router v6
 * - 登录态控制交给路由守卫（见 `src/router/index.tsx`）
 */
function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;