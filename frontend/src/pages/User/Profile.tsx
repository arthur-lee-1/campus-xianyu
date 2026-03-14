import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconUser,
  IconEdit,
  IconHome,
  IconUpload,
  IconMessage,
} from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyFavorites, getMyFollowers, getMyFollowing } from '@/api/interactions';
import { ensureDemoMyProducts, getMyProducts, getProductFeed, type ProductListItem } from '@/api/products';
import { useAuthStore } from '@/store/auth';
import { useTotalUnreadCount } from '@/store/message';
import styles from './Profile.module.css';

const { Title, Paragraph, Text } = Typography;

type TabKey = 'products' | 'favorites' | 'following' | 'followers';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadTotal = useTotalUnreadCount();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabKey>('products');
  const [feedProducts, setFeedProducts] = useState<ProductListItem[]>([]);
  const [followingIds, setFollowingIds] = useState<number[]>([]);
  const [followerIds, setFollowerIds] = useState<number[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const orderedMyProducts = useMemo(() => {
    const mine = feedProducts.filter((item) => item.seller.id === user?.id);
    return [...mine].sort((a, b) => {
      if (a.status === b.status) return a.id - b.id;
      return a.status === 'on_sale' ? -1 : 1;
    });
  }, [feedProducts, user?.id]);

  const favoriteProducts = useMemo(
    () => feedProducts.filter((item) => favoriteIds.includes(item.id)),
    [favoriteIds, feedProducts],
  );

  useEffect(() => {
    const fromState = (location.state as { tab?: TabKey } | null)?.tab;
    if (fromState && ['products', 'favorites', 'following', 'followers'].includes(fromState)) {
      setActiveTab(fromState);
    }
  }, [location.state]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      await ensureDemoMyProducts();
      const [products, myProducts, following, followers, favorites] = await Promise.all([
        getProductFeed(),
        getMyProducts(),
        getMyFollowing(),
        getMyFollowers(),
        getMyFavorites(),
      ]);
      if (!mounted) return;
      const myMap = new Map<number, ProductListItem>();
      myProducts.forEach((item) => myMap.set(item.id, item));
      const merged = products.map((item) => (myMap.has(item.id) ? myMap.get(item.id)! : item));
      myProducts.forEach((item) => {
        if (!merged.find((p) => p.id === item.id)) merged.push(item);
      });
      setFeedProducts(merged);
      setFollowingIds(following.map((item) => item.followed_id));
      setFollowerIds(followers.map((item) => item.follower_id));
      setFavoriteIds(favorites.map((item) => item.product_id));
      setLoading(false);
    };
    void load().catch(() => {
      if (!mounted) return;
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerWave} />

      <Card className={styles.card} bordered={false}>
        <div className={styles.top}>
          <div className={styles.avatarBlock}>
            <Avatar size={72} className={styles.avatar}>
              {user?.avatar ? <img src={user.avatar} alt="头像" className={styles.avatarImage} /> : <IconUser />}
            </Avatar>
            <div>
              <Title heading={4} className={styles.nickname}>
                {user?.nickname || '未命名用户'}
              </Title>
            </div>
          </div>
          <Button type="outline" icon={<IconEdit />} size="small" onClick={() => navigate('/settings')}>
            编辑资料
          </Button>
        </div>

        <Paragraph className={styles.bio}>{user?.bio || '这个人很神秘，什么都没留下'}</Paragraph>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <Text type="secondary">在售商品</Text>
            <Text bold>{orderedMyProducts.filter((item) => item.status === 'on_sale').length}</Text>
          </div>
          <div className={styles.statItem}>
            <Text type="secondary">成交订单</Text>
            <Text bold>{orderedMyProducts.filter((item) => item.status === 'sold').length}</Text>
          </div>
          <div className={styles.statItem}>
            <Text type="secondary">关注</Text>
            <Text bold>{followingIds.length}</Text>
          </div>
          <div className={styles.statItem}>
            <Text type="secondary">粉丝</Text>
            <Text bold>{followerIds.length}</Text>
          </div>
        </div>

        <Divider style={{ margin: 16 }} />

        <section className={styles.ratingSection}>
          <div className={styles.ratingHeader}>
            <div>
              <Text className={styles.sectionTitle}>买卖家综合评分</Text>
              <div className={styles.ratingRow}>
                <Text className={styles.ratingValue}>4.8</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  来自 0 条评价
                </Text>
              </div>
            </div>
          </div>
        </section>

        <Divider style={{ margin: 16 }} />

        <section className={styles.section}>
          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'products' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('products')}
            >
              我的商品
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'favorites' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              我的收藏
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'following' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('following')}
            >
              我的关注
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'followers' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('followers')}
            >
              我的粉丝
            </button>
          </div>

          {activeTab === 'products' && (
            <div>
              <div className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>我的商品</Text>
              </div>
              {loading ? <Text type="secondary">加载中...</Text> : null}
              <div className={styles.productPreview}>
                {orderedMyProducts.map((item) => (
                  <Card
                    key={item.id}
                    hoverable
                    className={styles.productCard}
                    onClick={() => navigate(`/product/${item.id}`, { state: { isOwner: true } })}
                  >
                    <div
                      className={styles.productThumb}
                      style={item.cover_image ? { backgroundImage: `url(${item.cover_image})` } : undefined}
                    />
                    <Space size={4} direction="vertical" style={{ width: '100%' }}>
                      <Text className={styles.productTitle}>{item.title}</Text>
                      <Tag
                        color={
                          item.status === 'on_sale'
                            ? 'green'
                            : item.status === 'sold'
                              ? 'arcoblue'
                              : 'gray'
                        }
                      >
                        {item.status === 'on_sale' ? '在售' : item.status === 'sold' ? '已售' : '已下架'}
                      </Tag>
                      <Text className={styles.productPrice}>￥{Number(item.price)}</Text>
                    </Space>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <div className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>我的收藏</Text>
              </div>
              <div className={styles.productPreview}>
                {favoriteProducts.map((item) => (
                  <Card
                    key={item.id}
                    hoverable
                    className={styles.productCard}
                    onClick={() =>
                      navigate(`/product/${item.id}`, {
                        state: { fromProfile: true, tab: 'favorites' as TabKey },
                      })
                    }
                  >
                    <div
                      className={styles.productThumb}
                      style={item.cover_image ? { backgroundImage: `url(${item.cover_image})` } : undefined}
                    />
                    <Space size={4} direction="vertical" style={{ width: '100%' }}>
                      <Text className={styles.productTitle}>{item.title}</Text>
                      <Tag color="green">在售</Tag>
                      <Text className={styles.productPrice}>￥{Number(item.price)}</Text>
                    </Space>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'following' && (
            <div>
              <div className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>我的关注</Text>
              </div>
              <div className={styles.userList}>
                {followingIds.map((id) => (
                  <div key={id} className={styles.userItem}>
                    <div className={styles.userInfo}>
                      <Avatar size={40} className={styles.userAvatar}>
                        <IconUser />
                      </Avatar>
                      <div>
                        <Text className={styles.userName}>用户 {id}</Text>
                        <Text type="secondary" className={styles.userMeta}>
                          海大同学 · 成交 {id * 3} 单
                        </Text>
                      </div>
                    </div>
                    <Button
                      size="small"
                      type="outline"
                      className={styles.dmButton}
                      onClick={() =>
                        navigate('/notifications', {
                          state: { peerId: id, peerName: `用户 ${id}` },
                        })
                      }
                    >
                      私信
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'followers' && (
            <div>
              <div className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>我的粉丝</Text>
              </div>
              <div className={styles.userList}>
                {followerIds.map((id) => (
                  <div key={id} className={styles.userItem}>
                    <div className={styles.userInfo}>
                      <Avatar size={40} className={styles.userAvatar}>
                        <IconUser />
                      </Avatar>
                      <div><Text className={styles.userName}>粉丝 {id}</Text></div>
                    </div>
                    <Button
                      size="small"
                      type="outline"
                      className={styles.dmButton}
                      onClick={() =>
                        navigate('/notifications', {
                          state: { peerId: id, peerName: `粉丝 ${id}` },
                        })
                      }
                    >
                      私信
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </Card>

      <nav className={styles.bottomNav}>
        <button type="button" className={styles.navItem} onClick={() => navigate('/')}>
          <IconHome />
          <span>主页</span>
        </button>
        <button type="button" className={styles.navItem} onClick={() => navigate('/publish')}>
          <IconUpload />
          <span>上传商品</span>
        </button>
        <button type="button" className={styles.navItem} onClick={() => navigate('/notifications')}>
          <Badge count={unreadTotal} offset={[8, 2]}>
            <IconMessage />
          </Badge>
          <span>消息</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${styles.navItemActive}`}
          onClick={() => navigate('/profile')}
        >
          <IconUser />
          <span>个人</span>
        </button>
      </nav>
    </div>
  );
}
