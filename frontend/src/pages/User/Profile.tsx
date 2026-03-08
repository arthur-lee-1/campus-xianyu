import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Rate,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconUser,
  IconEdit,
  IconStar,
  IconHome,
  IconUpload,
  IconMessage,
} from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTotalUnreadCount } from '@/store/message';
import { useSocialStore } from '@/store/social';
import { useUserProfileStore } from '@/store/userProfile';
import styles from './Profile.module.css';

const { Title, Paragraph, Text } = Typography;

type TabKey = 'products' | 'favorites' | 'following' | 'followers';

const MOCK_USER = {
  nickname: 'A',
  rating: 4.8,
  ratingCount: 23,
  followers: 56,
  onSaleCount: 3,
  dealCount: 12,
};

const MOCK_MY_PRODUCTS: Array<{
  id: number;
  title: string;
  price: number;
  status: 'on_sale' | 'sold';
}> = [
  { id: 11, title: '高数教材上册', price: 25, status: 'on_sale' },
  { id: 12, title: '宿舍收纳架', price: 30, status: 'on_sale' },
  { id: 13, title: '二手台灯', price: 35, status: 'on_sale' },
  { id: 14, title: '蓝牙耳机', price: 120, status: 'sold' },
  { id: 15, title: '计算器', price: 45, status: 'sold' },
];

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadTotal = useTotalUnreadCount();
  const following = useSocialStore((s) => s.following);
  const nickname = useUserProfileStore((s) => s.nickname);
  const bio = useUserProfileStore((s) => s.bio);
  const avatarUrl = useUserProfileStore((s) => s.avatarUrl);
  const [activeTab, setActiveTab] = useState<TabKey>('products');
  const orderedMyProducts = useMemo(
    () =>
      [...MOCK_MY_PRODUCTS].sort((a, b) => {
        if (a.status === b.status) return a.id - b.id;
        return a.status === 'on_sale' ? -1 : 1;
      }),
    [],
  );

  useEffect(() => {
    const fromState = (location.state as { tab?: TabKey } | null)?.tab;
    if (fromState && ['products', 'favorites', 'following', 'followers'].includes(fromState)) {
      setActiveTab(fromState);
    }
  }, [location.state]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerWave} />

      <Card className={styles.card} bordered={false}>
        <div className={styles.top}>
          <div className={styles.avatarBlock}>
            <Avatar size={72} className={styles.avatar}>
              {avatarUrl ? <img src={avatarUrl} alt="头像" className={styles.avatarImage} /> : <IconUser />}
            </Avatar>
            <div>
              <Title heading={4} className={styles.nickname}>
                {nickname}
              </Title>
            </div>
          </div>
          <Button type="outline" icon={<IconEdit />} size="small" onClick={() => navigate('/settings')}>
            编辑资料
          </Button>
        </div>

        <Paragraph className={styles.bio}>{bio}</Paragraph>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <Text type="secondary">在售商品</Text>
            <Text bold>{MOCK_USER.onSaleCount}</Text>
          </div>
          <div className={styles.statItem}>
            <Text type="secondary">成交订单</Text>
            <Text bold>{MOCK_USER.dealCount}</Text>
          </div>
          <div className={styles.statItem}>
            <Text type="secondary">关注</Text>
            <Text bold>{following}</Text>
          </div>
          <div className={styles.statItem}>
            <Text type="secondary">粉丝</Text>
            <Text bold>{MOCK_USER.followers}</Text>
          </div>
        </div>

        <Divider style={{ margin: 16 }} />

        <section className={styles.ratingSection}>
          <div className={styles.ratingHeader}>
            <div>
              <Text className={styles.sectionTitle}>买卖家综合评分</Text>
              <div className={styles.ratingRow}>
                <Text className={styles.ratingValue}>{MOCK_USER.rating.toFixed(1)}</Text>
                <Rate
                  allowHalf
                  disabled
                  defaultValue={MOCK_USER.rating}
                  character={<IconStar />}
                />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  来自 {MOCK_USER.ratingCount} 条评价
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
              <div className={styles.productPreview}>
                {orderedMyProducts.map((item) => (
                  <Card
                    key={item.id}
                    hoverable
                    className={styles.productCard}
                    onClick={() => navigate(`/product/${item.id}`, { state: { isOwner: true } })}
                  >
                    <div className={styles.productThumb} />
                    <Space size={4} direction="vertical" style={{ width: '100%' }}>
                      <Text className={styles.productTitle}>{item.title}</Text>
                      <Tag color={item.status === 'on_sale' ? 'green' : 'arcoblue'}>
                        {item.status === 'on_sale' ? '在售' : '已售'}
                      </Tag>
                      <Text className={styles.productPrice}>￥{item.price}</Text>
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
                {[1, 2].map((id) => (
                  <Card
                    key={id}
                    hoverable
                    className={styles.productCard}
                    onClick={() =>
                      navigate(`/product/${id}`, {
                        state: { fromProfile: true, tab: 'favorites' as TabKey },
                      })
                    }
                  >
                    <div className={styles.productThumb} />
                    <Space size={4} direction="vertical" style={{ width: '100%' }}>
                      <Text className={styles.productTitle}>已收藏商品 {id}</Text>
                      <Tag color="green">在售</Tag>
                      <Text className={styles.productPrice}>￥{30 + id * 10}</Text>
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
                {[1, 2, 3].map((id) => (
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
                {[1, 2].map((id) => (
                  <div key={id} className={styles.userItem}>
                    <div className={styles.userInfo}>
                      <Avatar size={40} className={styles.userAvatar}>
                        <IconUser />
                      </Avatar>
                      <div>
                        <Text className={styles.userName}>粉丝 {id}</Text>
                      </div>
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
