import { createBrowserRouter, Navigate, redirect } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
// 下面这些页面目前大多是“占位路由”，方便你和同学先把整体导航结构跑通
import Register from '@/pages/Auth/Register';
import Search from '@/pages/Search';
import Publish from '@/pages/Product/Publish';
import ProductDetail from '@/pages/Product/Detail';
import Profile from '@/pages/User/Profile';
import MyProducts from '@/pages/User/MyProducts';
import Settings from '@/pages/User/Settings';
import Chat from '@/pages/Chat';
import Notification from '@/pages/Notification';
import TransactionList from '@/pages/Transaction/List';
import TransactionDetail from '@/pages/Transaction/Detail';
import { getAccessToken } from '@/store/auth';

/**
 * 路由配置（统一版）
 *
 * 约定（和你同学那份保持语义一致）：
 * - 主页：               `/`
 * - 登录、注册：         `/login`、`/register`
 * - 搜索：               `/search`
 * - 发布商品：           `/publish`
 * - 商品详情：           `/product/:id`
 * - 个人中心相关：       `/profile`、`/my-products`、`/settings`
 * - 聊天 & 通知：        `/chat`、`/notifications`
 * - 交易列表与详情：     `/transactions`、`/transactions/:id`
 *
 * 登录守卫（先保持基础版）：
 * - 未登录访问需要登录的页面 → 重定向到 `/login?redirectTo=xxx`
 * - 已登录访问 `/login`、`/register` → 重定向回 `/`
 *
 * 后续如果你们想对“哪些页面必须登录”再细化，我们只要改这个文件即可。
 */

// 一个简单的工具：判断当前路径是否需要登录
const protectedPaths = [
  '/', // 首页
  '/publish',
  '/profile',
  '/my-products',
  '/settings',
  '/chat',
  '/notifications',
  '/transactions',
];

function requireAuthOrRedirect(path: string) {
  if (!getAccessToken()) {
    const encoded = encodeURIComponent(path);
    throw redirect(`/login?redirectTo=${encoded}`);
  }
  return null;
}

export const router = createBrowserRouter([
  // 主页
  {
    path: '/',
    loader: () => requireAuthOrRedirect('/'),
    element: <Home />,
  },

  // 登录 & 注册
  {
    path: '/login',
    loader: ({ request }) => {
      if (getAccessToken()) {
        throw redirect('/');
      }
      const url = new URL(request.url);
      const redirectTo = url.searchParams.get('redirectTo');
      return { redirectTo };
    },
    element: <Login />,
  },
  {
    path: '/register',
    loader: () => {
      if (getAccessToken()) {
        throw redirect('/');
      }
      return null;
    },
    element: <Register />,
  },

  // 搜索（可选：不登录也能搜索，你们可以按需求改）
  {
    path: '/search',
    element: <Search />,
  },

  // 商品相关
  {
    path: '/publish',
    loader: () => requireAuthOrRedirect('/publish'),
    element: <Publish />,
  },
  {
    path: '/product/:id',
    element: <ProductDetail />,
  },

  // 个人中心
  {
    path: '/profile',
    loader: () => requireAuthOrRedirect('/profile'),
    element: <Profile />,
  },
  {
    path: '/my-products',
    loader: () => requireAuthOrRedirect('/my-products'),
    element: <MyProducts />,
  },
  {
    path: '/settings',
    loader: () => requireAuthOrRedirect('/settings'),
    element: <Settings />,
  },

  // 聊天 & 通知
  {
    path: '/chat',
    loader: () => requireAuthOrRedirect('/chat'),
    element: <Chat />,
  },
  {
    path: '/notifications',
    loader: () => requireAuthOrRedirect('/notifications'),
    element: <Notification />,
  },

  // 交易
  {
    path: '/transactions',
    loader: () => requireAuthOrRedirect('/transactions'),
    element: <TransactionList />,
  },
  {
    path: '/transactions/:id',
    loader: () => requireAuthOrRedirect('/transactions'),
    element: <TransactionDetail />,
  },

  // 兜底
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

