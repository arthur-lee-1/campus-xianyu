import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Grid,
  Input,
  Space,
  Tabs,
  Typography,
} from '@arco-design/web-react';
import {
  IconHome,
  IconUpload,
  IconMessage,
  IconUser,
  IconSearch,
} from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import styles from './index.module.css';

const { Title, Paragraph, Text } = Typography;
const Row = Grid.Row;
const Col = Grid.Col;

type CampusKey = 'xihai' | 'laoshan' | 'yushan';

const CAMPUS_TABS: { key: CampusKey | 'all'; label: string }[] = [
  { key: 'all', label: '全部校区' },
  { key: 'xihai', label: '西海岸校区' },
  { key: 'laoshan', label: '崂山校区' },
  { key: 'yushan', label: '鱼山校区' },
];

type Product = {
  id: number;
  title: string;
  price: number;
  campus: CampusKey;
  tag: string;
};

// 目前先用几条 mock 数据，让 UI 可以完整展示；后续你们可以直接换成接口返回的数据
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    title: '线代教材 9 成新',
    price: 18,
    campus: 'xihai',
    tag: '教材',
  },
  {
    id: 2,
    title: '人体工学学习椅',
    price: 120,
    campus: 'xihai',
    tag: '家具',
  },
  {
    id: 3,
    title: 'iPad 2019 + 原装笔',
    price: 850,
    campus: 'laoshan',
    tag: '数码',
  },
  {
    id: 4,
    title: '吉他一把，送琴包',
    price: 260,
    campus: 'laoshan',
    tag: '乐器',
  },
  {
    id: 5,
    title: '台灯 + 排插组合',
    price: 35,
    campus: 'yushan',
    tag: '宿舍',
  },
  {
    id: 6,
    title: '篮球 7 号，九成新',
    price: 45,
    campus: 'yushan',
    tag: '运动',
  },
];

/**
 * 主页面（登录后的首页）
 *
 * 布局（按你的需求）：
 * - 顶部：搜索框（全局搜索入口）
 * - 中部：校区 Tabs（西海岸 / 崂山 / 鱼山），下面是该校区的商品卡片
 * - 底部：四个导航入口（主页 / 上传商品 / 消息 / 个人）
 *
 * 说明：
 * - 当前商品数据使用本地 mock，先把布局跑通；后续你们可以直接把 MOCK_PRODUCTS 换成接口数据。
 * - 底部导航用 `navigate` 跳转到我们之前配好的路由：/、/publish、/notifications、/profile。
 */
export default function Home() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    // 清空本地登录态，然后回到登录页
    logout();
    navigate('/login', { replace: true });
  };

  const [activeCampus, setActiveCampus] = useState<CampusKey | 'all'>('all');
  const [keyword, setKeyword] = useState('');

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((item) => {
      if (activeCampus !== 'all' && item.campus !== activeCampus) return false;
      if (!keyword.trim()) return true;
      return item.title.toLowerCase().includes(keyword.trim().toLowerCase());
    });
  }, [activeCampus, keyword]);

  const campusTitle = useMemo(() => {
    const match = CAMPUS_TABS.find((c) => c.key === activeCampus);
    return match?.label ?? '全部校区';
  }, [activeCampus]);

  return (
    <div className={styles.wrapper}>
      {/* 顶部区域：搜索 + 校区 Tabs */}
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <Title heading={3} className={styles.appTitle}>
            校园集市
          </Title>
          <Button type="text" size="small" onClick={handleLogout}>
            退出登录
          </Button>
        </div>

        <div className={styles.searchBar}>
          <Input
            allowClear
            prefix={<IconSearch />}
            placeholder="搜索你想要的宝贝，例如：教材 / iPad / 椅子"
            value={keyword}
            onChange={setKeyword}
          />
        </div>

        <Tabs
          size="small"
          type="rounded"
          activeTab={activeCampus}
          onChange={(k) => setActiveCampus(k as CampusKey | 'all')}
          className={styles.campusTabs}
        >
          {CAMPUS_TABS.map((c) => (
            <Tabs.TabPane key={c.key} title={c.label} />
          ))}
        </Tabs>
      </header>

      {/* 中间区域：不同校区下的商品展示 */}
      <main className={styles.main}>
        <div className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>{campusTitle} · 推荐好物</Text>
        </div>

        {filteredProducts.length === 0 ? (
          <div className={styles.empty}>
            <Text type="secondary">暂时没有符合条件的商品，换个关键词试试～</Text>
          </div>
        ) : (
          <Row gutter={12} className={styles.productGrid}>
            {filteredProducts.map((item) => (
              <Col key={item.id} xs={12} sm={8} md={6}>
                <Card
                  className={styles.productCard}
                  hoverable
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <div className={styles.productThumb} />
                  <div className={styles.productInfo}>
                    <div className={styles.productTitle}>{item.title}</div>
                    <div className={styles.productMeta}>
                      <span className={styles.productPrice}>￥{item.price}</span>
                      <span className={styles.productTag}>{item.tag}</span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </main>

      {/* 底部导航：主页 / 上传商品 / 消息 / 个人 */}
      <nav className={styles.bottomNav}>
        <button
          type="button"
          className={`${styles.navItem} ${styles.navItemActive}`}
          onClick={() => navigate('/')}
        >
          <IconHome />
          <span>主页</span>
        </button>
        <button
          type="button"
          className={styles.navItem}
          onClick={() => navigate('/publish')}
        >
          <IconUpload />
          <span>上传商品</span>
        </button>
        <button
          type="button"
          className={styles.navItem}
          onClick={() => navigate('/notifications')}
        >
          <IconMessage />
          <span>消息</span>
        </button>
        <button
          type="button"
          className={styles.navItem}
          onClick={() => navigate('/profile')}
        >
          <IconUser />
          <span>个人</span>
        </button>
      </nav>
    </div>
  );
}

