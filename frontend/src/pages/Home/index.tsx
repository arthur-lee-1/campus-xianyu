import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Badge,
  Card,
  Empty,
  Grid,
  Input,
  Message,
  Spin,
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
import { logout as logoutApi, parseApiError } from '@/api/auth';
import { getProductFeed, parseProductApiError, type ProductListItem } from '@/api/products';
import { useAuthStore } from '@/store/auth';
import { useMessageStore, useTotalUnreadCount } from '@/store/message';
import styles from './index.module.css';

const { Title, Text } = Typography;
const Row = Grid.Row;
const Col = Grid.Col;

type CampusKey = 'xihai' | 'laoshan' | 'yushan';

const CAMPUS_TABS: { key: CampusKey | 'all'; label: string }[] = [
  { key: 'all', label: '全部校区' },
  { key: 'xihai', label: '西海岸校区' },
  { key: 'laoshan', label: '崂山校区' },
  { key: 'yushan', label: '鱼山校区' },
];

export default function Home() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const unreadTotal = useTotalUnreadCount();
  const fetchUnreadTotal = useMessageStore((s) => s.fetchUnreadTotal);

  const [activeCampus, setActiveCampus] = useState<CampusKey | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (e) {
      Message.warning(parseApiError(e, '退出登录失败'));
    } finally {
      clearSession();
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    void fetchUnreadTotal();
  }, [fetchUnreadTotal]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorText('');

    getProductFeed({
      search: keyword.trim() || undefined,
      campus: activeCampus === 'all' ? undefined : activeCampus,
    })
      .then((list) => {
        if (!mounted) return;
        setProducts(list);
      })
      .catch((e) => {
        if (!mounted) return;
        setErrorText(parseProductApiError(e, '商品加载失败'));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeCampus, keyword]);

  const filteredProducts = useMemo(() => products, [products]);

  const campusTitle = useMemo(() => {
    const match = CAMPUS_TABS.find((c) => c.key === activeCampus);
    return match?.label ?? '全部校区';
  }, [activeCampus]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <Title heading={3} className={styles.appTitle}>
            校园二手集市
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

      <main className={styles.main}>
        <div className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>{campusTitle} · 推荐好物</Text>
        </div>

        {loading ? (
          <Spin style={{ margin: '36px auto', display: 'block' }} />
        ) : errorText ? (
          <Empty description={errorText} />
        ) : filteredProducts.length === 0 ? (
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
                      <span className={styles.productPrice}>￥{Number(item.price)}</span>
                      <span className={styles.productTag}>
                        {item.category?.name || '未分类'}
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </main>

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
          <Badge count={unreadTotal} offset={[8, 2]}>
            <IconMessage />
          </Badge>
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