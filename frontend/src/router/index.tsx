// src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';

// 导入所有页面组件（补全 index.tsx 后缀，确保路径100%匹配）
import Home from '../pages/Home/index.tsx';
import Login from '../pages/login/index.tsx';
import Register from '../pages/register/index.tsx';
import Publish from '../pages/publish/index.tsx';
import ProductDetail from '../pages/detail/index.tsx';
import Personal from '../pages/User/index.tsx';

// 完整路由配置：覆盖二手交易平台核心页面
const router = createBrowserRouter([
  // 首页
  {
    path: '/',
    element: <Home />
  },
  // 登录页
  {
    path: '/login',
    element: <Login />
  },
  // 注册页
  {
    path: '/register',
    element: <Register />
  },
  // 发布商品页
  {
    path: '/publish',
    element: <Publish />
  },
  // 商品详情页（带动态参数 id）
  {
    path: '/product/:id', // :id 是动态参数，对应不同商品的ID
    element: <ProductDetail />
  },
  // 个人中心页
  {
    path: '/personal',
    element: <Personal />
  },
  // 404页面（可选，访问不存在的路径时显示）
  {
    path: '*',
    element: <div style={{ textAlign: 'center', marginTop: '100px', fontSize: '24px' }}>404 页面不存在</div>
  }
]);

export default router;