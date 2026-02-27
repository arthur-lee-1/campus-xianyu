import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container flex justify-between items-center py-3">
        <Link to="/" className="text-xl font-bold text-green-600">
          校园二手交易平台
        </Link>
        <nav className="flex items-center space-x-6">
          <Link to="/" className="text-gray-700 hover:text-green-600">首页</Link>
          <Link to="/publish" className="text-gray-700 hover:text-green-600">发布</Link>
          <Link to="/login" className="text-gray-700 hover:text-green-600">登录</Link>
          <Link to="/register" className="text-gray-700 hover:text-green-600">注册</Link>
          <Link to="/personal" className="text-gray-700 hover:text-green-600">个人中心</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;