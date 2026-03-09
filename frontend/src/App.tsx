import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from '@arco-design/web-react';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import { getMe } from '@/api/users';
import { router } from '@/router';
import { useAuthStore } from '@/store/auth';

/**
 * App 根组件
 *
 * - 负责挂载路由（React Router v6）
 * - 负责挂载 UI 框架的全局配置（这里使用 Arco 的中文语言包）
 * - 有 accessToken 时主动拉取 `/api/users/me/`，校验当前登录态
 *
 * 说明：
 * - 本项目按 README 约定使用 React + TS + Vite + React Router v6
 * - 路由守卫只负责“有无 token”的初步判断；真正的 token 可用性由这里补充校验
 */
function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    getMe()
      .then((user) => {
        if (cancelled) {
          return;
        }

        const latestAccess = useAuthStore.getState().accessToken;
        if (!latestAccess) {
          return;
        }

        setSession({
          access: latestAccess,
          user,
        });
      })
      .catch(() => {
        // 401 / refresh 失败时，http.ts 已经会自动清理登录态并跳回登录页
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, setSession]);

  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
