import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/header';
import Footer from '../../components/layout/footer';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    studentId: '',
    email: '',
    password: '',
    confirmPwd: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // 清除对应错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 表单验证
  const validate = () => {
    const err: Record<string, string> = {};
    
    if (!form.username) err.username = '请输入用户名';
    if (!form.studentId) err.studentId = '请输入学号';
    if (!form.email) err.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = '邮箱格式不正确';
    if (!form.password) err.password = '请输入密码';
    else if (form.password.length < 6) err.password = '密码长度不能少于6位';
    if (form.confirmPwd !== form.password) err.confirmPwd = '两次密码输入不一致';
    
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // 模拟注册
    setTimeout(() => {
      setLoading(false);
      alert('注册成功！请登录');
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">用户注册</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="username">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="请输入用户名"
                required
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="studentId">
                学号
              </label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.studentId ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="请输入学号"
                required
              />
              {errors.studentId && <p className="text-red-500 text-sm mt-1">{errors.studentId}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="email">
                邮箱
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="请输入邮箱"
                required
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="password">
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="请输入密码（至少6位）"
                required
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="confirmPwd">
                确认密码
              </label>
              <input
                type="password"
                id="confirmPwd"
                name="confirmPwd"
                value={form.confirmPwd}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.confirmPwd ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="请再次输入密码"
                required
              />
              {errors.confirmPwd && <p className="text-red-500 text-sm mt-1">{errors.confirmPwd}</p>}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? '注册中...' : '注册'}
            </button>
            
            <div className="text-center mt-4">
              <Link to="/login" className="text-green-600 hover:underline">
                已有账号？立即登录
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;