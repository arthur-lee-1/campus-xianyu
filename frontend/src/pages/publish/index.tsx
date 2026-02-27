import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/header';
import Footer from '../../components/layout/footer';

// 分类和成色选项
const CATEGORIES = [
  { label: '数码产品', value: 'digital' },
  { label: '学习资料', value: 'study' },
  { label: '生活用品', value: 'life' },
  { label: '美妆护肤', value: 'cosmetic' },
  { label: '服装鞋帽', value: 'clothes' },
  { label: '运动器材', value: 'sports' },
  { label: '其他物品', value: 'other' },
];

const STATUS_LIST = [
  { label: '全新未拆封', value: 'new' },
  { label: '九五新', value: '95new' },
  { label: '九成新', value: '90new' },
  { label: '八成新', value: '80new' },
  { label: '七成及以下', value: '70new' },
];

const Publish = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 表单状态
  const [form, setForm] = useState({
    title: '',
    price: '',
    originalPrice: '',
    category: '',
    status: '',
    description: '',
  });
  
  // 图片上传状态
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 输入变化处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // 清除错误提示
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    // 模拟上传
    setTimeout(() => {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
      setUploading(false);
      // 清空input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1000);
  };

  // 删除图片
  const deleteImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 表单验证
  const validate = () => {
    const err: Record<string, string> = {};
    
    if (!form.title.trim()) err.title = '请输入商品标题';
    else if (form.title.length > 50) err.title = '标题不能超过50个字';
    
    if (!form.price) err.price = '请输入售价';
    else if (isNaN(Number(form.price)) || Number(form.price) <= 0) err.price = '售价必须大于0';
    
    if (!form.category) err.category = '请选择分类';
    if (!form.status) err.status = '请选择成色';
    if (!form.description.trim()) err.description = '请输入商品描述';
    if (images.length === 0) err.images = '请至少上传一张图片';
    
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setUploading(true);
    // 模拟提交
    setTimeout(() => {
      setUploading(false);
      alert('商品发布成功！');
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">发布二手商品</h1>
          
          <form onSubmit={handleSubmit}>
            {/* 标题 */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="title">
                商品标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="请输入商品标题（不超过50字）"
                maxLength={50}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* 价格 */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="price">
                  售价（元）<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="originalPrice">
                  原价（元）
                </label>
                <input
                  type="number"
                  id="originalPrice"
                  name="originalPrice"
                  value={form.originalPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* 分类和成色 */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="category">
                  商品分类 <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">请选择分类</option>
                  {CATEGORIES.map(item => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="status">
                  商品成色 <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">请选择成色</option>
                  {STATUS_LIST.map(item => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
              </div>
            </div>

            {/* 图片上传 */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                商品图片 <span className="text-red-500">*</span>
              </label>
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  {uploading ? '上传中...' : '选择图片'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-1">支持jpg/png格式，最多上传6张</p>
              </div>
              
              {errors.images && <p className="text-red-500 text-sm mb-2">{errors.images}</p>}
              
              {/* 图片预览 */}
              {images.length > 0 && (
                <div className="grid md:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={img} 
                        alt={`预览图${idx+1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => deleteImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 商品描述 */}
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="description">
                商品描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded min-h-[150px] ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="请详细描述商品信息，如使用时长、功能状态、交易方式等"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={uploading}
                className="px-8 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? '发布中...' : '发布商品'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Publish;