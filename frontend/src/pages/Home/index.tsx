import { Link } from 'react-router-dom';
import Header from '../../components/header';
import Footer from '../../components/footer';

const Home = () => {
  // 模拟商品列表数据
  const productList = [
    { id: '1001', title: '99新iPad Pro 2022款', price: 4500, img: 'https://picsum.photos/800/600?random=1' },
    { id: '1002', title: '考研数学全套资料', price: 88, img: 'https://picsum.photos/800/600?random=2' },
    { id: '1003', title: '九成新李宁羽毛球拍', price: 120, img: 'https://picsum.photos/800/600?random=3' },
    { id: '1004', title: '全新未拆封保温杯', price: 35, img: 'https://picsum.photos/800/600?random=4' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container py-8">
        <h1 className="text-2xl font-bold mb-6">校园二手交易平台</h1>
        
        {/* 快速入口 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-center gap-4">
            <Link to="/publish" className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              发布二手商品
            </Link>
            <Link to="/login" className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-100 transition-colors">
              登录/注册
            </Link>
          </div>
        </div>

        {/* 商品列表 */}
        <h2 className="text-xl font-semibold mb-4">最新上架</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productList.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={product.img} 
                alt={product.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-medium mb-2 truncate">{product.title}</h3>
                <p className="text-red-500 font-bold">¥{product.price}</p>
                <Link 
                  to={`/product/${product.id}`}
                  className="mt-3 inline-block text-green-600 hover:underline"
                >
                  查看详情
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;