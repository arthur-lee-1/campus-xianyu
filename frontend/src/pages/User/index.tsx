import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header';
import Footer from '../../components/footer';

// 模拟用户信息
const mockUserInfo = {
  username: '小明同学',
  studentId: '20230001',
  email: 'xiaoming@school.com',
  avatar: 'https://picsum.photos/100/100?random=user',
  campus: '计算机学院',
  publishCount: 8,
  collectCount: 5,
};

// 模拟发布的商品
const mockMyProducts = [
  { id: '1001', title: '99新iPad Pro 2022款', price: 4500, img: 'https://picsum.photos/800/600?random=1' },
  { id: '1002', title: '考研数学全套资料', price: 88, img: 'https://picsum.photos/800/600?random=2' },
];

// 模拟收藏的商品
const mockCollectProducts = [
  { id: '1003', title: '九成新李宁羽毛球拍', price: 120, img: 'https://picsum.photos/800/600?random=3' },
  { id: '1004', title: '全新未拆封保温杯', price: 35, img: 'https://picsum.photos/800/600?random=4' },
];

const Personal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('publish'); // publish/collect

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    alert('退出登录成功！');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner-border text-green-600 mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>正在加载个人中心...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* 用户信息 */}
          <div className="flex items-center gap-6 mb-6">
            <img 
              src={mockUserInfo.avatar} 
              alt={mockUserInfo.username}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold">{mockUserInfo.username}</h2>
              <p className="text-gray-600 mt-1">学号：{mockUserInfo.studentId}</p>
              <p className="text-gray-600">学院：{mockUserInfo.campus}</p>
              <p className="text-gray-600">邮箱：{mockUserInfo.email}</p>
              <button
                onClick={handleLogout}
                className="mt-3 px-4 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>

          {/* 数据统计 */}
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xl font-bold text-green-600">{mockUserInfo.publishCount}</p>
              <p className="text-gray-600">已发布商品</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xl font-bold text-green-600">{mockUserInfo.collectCount}</p>
              <p className="text-gray-600">已收藏商品</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xl font-bold text-green-600">0</p>
              <p className="text-gray-600">交易成功</p>
            </div>
          </div>
        </div>

        {/* 商品标签页 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('publish')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'publish' 
                  ? 'border-b-2 border-green-600 text-green-600' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              我发布的商品
            </button>
            <button
              onClick={() => setActiveTab('collect')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'collect' 
                  ? 'border-b-2 border-green-600 text-green-600' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              我收藏的商品
            </button>
          </div>

          {/* 发布的商品列表 */}
          {activeTab === 'publish' && (
            <div className="p-6">
              {mockMyProducts.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {mockMyProducts.map(product => (
                    <div key={product.id} className="border rounded-lg overflow-hidden">
                      <img 
                        src={product.img} 
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-medium mb-2 truncate">{product.title}</h3>
                        <p className="text-red-500 font-bold">¥{product.price}</p>
                        <div className="mt-3 flex gap-2">
                          <button className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100">
                            编辑
                          </button>
                          <button className="px-2 py-1 border border-red-500 text-red-500 rounded text-sm hover:bg-red-50">
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  您还没有发布任何商品
                  <button 
                    onClick={() => navigate('/publish')}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    立即发布
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 收藏的商品列表 */}
          {activeTab === 'collect' && (
            <div className="p-6">
              {mockCollectProducts.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {mockCollectProducts.map(product => (
                    <div key={product.id} className="border rounded-lg overflow-hidden">
                      <img 
                        src={product.img} 
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-medium mb-2 truncate">{product.title}</h3>
                        <p className="text-red-500 font-bold">¥{product.price}</p>
                        <button className="mt-3 px-2 py-1 border border-red-500 text-red-500 rounded text-sm hover:bg-red-50">
                          取消收藏
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  您还没有收藏任何商品
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Personal;