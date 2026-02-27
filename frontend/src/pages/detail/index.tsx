import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/layout/header';
import Footer from '../../components/layout/footer';

// 模拟商品数据
const mockProduct = {
  id: '1001',
  title: '99新iPad Pro 2022款 11英寸 256G',
  price: 4500,
  originalPrice: 6999,
  category: '数码产品',
  status: '九成新',
  publishTime: '2026-02-20',
  description: `
    <p>个人自用iPad Pro 2022款，11英寸，256G，深空灰色。</p>
    <p>使用时长不到半年，无磕碰、无划痕，电池健康度100%。</p>
    <p>配件齐全（充电器、数据线、原装笔），包装盒都在。</p>
    <p>仅限本校面交，可当场验机，价格可小刀。</p>
  `,
  images: [
    'https://picsum.photos/800/600?random=1',
    'https://picsum.photos/800/600?random=2',
    'https://picsum.photos/800/600?random=3',
  ],
  seller: {
    name: '小明同学',
    avatar: 'https://picsum.photos/100/100?random=user',
    campus: '计算机学院',
    publishCount: 8,
    goodRate: 98,
  },
  viewCount: 128,
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isCollected, setIsCollected] = useState(false);
  const [loading, setLoading] = useState(true);

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // 收藏功能
  const handleCollect = () => {
    setIsCollected(!isCollected);
    alert(isCollected ? '取消收藏成功' : '收藏成功');
  };

  // 联系卖家
  const handleContact = () => {
    alert(`已打开和【${mockProduct.seller.name}】的聊天窗口`);
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner-border text-green-600 mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>正在加载商品详情...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 商品图片区 */}
          <div className="grid md:grid-cols-5 gap-4 p-6">
            {/* 缩略图 */}
            <div className="hidden md:block flex flex-col gap-2">
              {mockProduct.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`w-20 h-20 cursor-pointer border rounded ${
                    activeImgIndex === idx ? 'border-green-500' : 'border-gray-200'
                  }`}
                  onClick={() => setActiveImgIndex(idx)}
                >
                  <img src={img} alt={`商品图${idx+1}`} className="w-full h-full object-cover rounded" />
                </div>
              ))}
            </div>

            {/* 主图 */}
            <div className="md:col-span-4">
              <div className="w-full h-[400px] border rounded overflow-hidden">
                <img 
                  src={mockProduct.images[activeImgIndex]} 
                  alt={mockProduct.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* 商品信息区 */}
          <div className="border-t p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{mockProduct.title}</h1>
            
            {/* 价格 */}
            <div className="flex items-center mb-4">
              <span className="text-3xl font-bold text-red-500 mr-3">¥{mockProduct.price}</span>
              <span className="text-gray-500 line-through text-sm">原价 ¥{mockProduct.originalPrice}</span>
            </div>

            {/* 基础信息 */}
            <div className="grid md:grid-cols-2 gap-3 mb-6 text-gray-700">
              <div><span className="text-gray-500 mr-2">分类：</span>{mockProduct.category}</div>
              <div><span className="text-gray-500 mr-2">成色：</span>{mockProduct.status}</div>
              <div><span className="text-gray-500 mr-2">发布时间：</span>{mockProduct.publishTime}</div>
              <div><span className="text-gray-500 mr-2">浏览量：</span>{mockProduct.viewCount}</div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4 mb-8">
              <button 
                onClick={handleContact}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                联系卖家
              </button>
              <button
                onClick={handleCollect}
                className={`px-6 py-2 border rounded transition-colors ${
                  isCollected 
                    ? 'border-red-500 text-red-500 bg-red-50' 
                    : 'border-gray-300 hover:border-green-500 hover:text-green-600'
                }`}
              >
                {isCollected ? '已收藏' : '收藏商品'}
              </button>
            </div>

            {/* 商品描述 */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">商品描述</h2>
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: mockProduct.description }}
              />
            </div>
          </div>

          {/* 卖家信息 */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">卖家信息</h2>
            <div className="flex items-center gap-4">
              <img 
                src={mockProduct.seller.avatar} 
                alt={mockProduct.seller.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{mockProduct.seller.name}</h3>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                    {mockProduct.seller.campus}
                  </span>
                </div>
                <div className="mt-2 text-gray-600 text-sm">
                  <div>发布商品：{mockProduct.seller.publishCount} 件</div>
                  <div>好评率：{mockProduct.seller.goodRate}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;