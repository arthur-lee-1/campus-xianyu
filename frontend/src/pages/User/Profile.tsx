<<<<<<< HEAD
=======
<<<<<<< Updated upstream
=======
import { useEffect, useState } from 'react';
>>>>>>> Show-website-page
import {
  Avatar,
  Button,
  Card,
  Divider,
  Rate,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
<<<<<<< HEAD
import { IconUser, IconEdit, IconStar } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';

const { Title, Paragraph, Text } = Typography;

=======
import { IconUser, IconEdit, IconStar, IconHome, IconUpload, IconMessage } from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';
import { useSocialStore } from '@/store/social';

const { Title, Paragraph, Text } = Typography;

type TabKey = 'products' | 'favorites' | 'following' | 'followers';

>>>>>>> Show-website-page
const MOCK_USER = {
  nickname: 'A',
  campus: '中国海洋大学 · 崂山校区',
  bio: '个人签名',
  rating: 4.8,
  ratingCount: 23,
  followers: 56,
  following: 18,
  onSaleCount: 3,
  dealCount: 12,
};

export default function Profile() {
  const navigate = useNavigate();
<<<<<<< HEAD
=======
  const location = useLocation();
  const following = useSocialStore((s) => s.following);
  const [activeTab, setActiveTab] = useState<TabKey>('products');

  useEffect(() => {
    const fromState = (location.state as { tab?: TabKey } | null)?.tab;
    if (fromState && ['products', 'favorites', 'following', 'followers'].includes(fromState)) {
      setActiveTab(fromState);
    }
  }, [location.state]);
>>>>>>> Show-website-page

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerWave} />

      <Card className={styles.card} bordered={false}>
        <div className={styles.top}>
          <div className={styles.avatarBlock}>
            <Avatar size={72} className={styles.avatar}>
              <IconUser />
            </Avatar>
            <div>
              <Title heading={4} className={styles.nickname}>
                {MOCK_USER.nickname}
              </Title>
              <Text type="secondary">{MOCK_USER.campus}</Text>
            </div>
          </div>
          <Button type="outline" icon={<IconEdit />} size="small">
            编辑资料（占位）
          </Button>
        </div>

        <Paragraph className={styles.bio}>{MOCK_USER.bio}</Paragraph>

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
<<<<<<< HEAD
            <Text bold>{MOCK_USER.following}</Text>
=======
            <Text bold>{following}</Text>
>>>>>>> Show-website-page
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
          <div className={styles.ratingTags}>
            <Tag color="arcoblue">沟通顺畅</Tag>
            <Tag color="green">发货及时</Tag>
            <Tag color="orangered">宝贝与描述一致</Tag>
          </div>
        </section>

        <Divider style={{ margin: 16 }} />

<<<<<<< HEAD
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>在售商品预览</Text>
            <Button type="text" size="small" onClick={() => navigate('/my-products')}>
              查看全部
            </Button>
          </div>
          <div className={styles.productPreview}>
            {[1, 2, 3].map((id) => (
              <Card
                key={id}
                hoverable
                className={styles.productCard}
                onClick={() => navigate('/my-products')}
              >
                <div className={styles.productThumb} />
                <Space size={4} direction="vertical" style={{ width: '100%' }}>
                  <Text className={styles.productTitle}>示例商品 {id}</Text>
                  <Text className={styles.productPrice}>￥{20 + id * 5}</Text>
                </Space>
              </Card>
            ))}
          </div>
        </section>
      </Card>
=======
        {/* 中部四个入口：我的商品 / 我的收藏 / 我的关注 / 我的粉丝 */}
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

          {/* 下方根据 tab 展示不同内容 */}
          {activeTab === 'products' && (
            <div>
              <div className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>在售商品</Text>
                <Button type="text" size="small" onClick={() => navigate('/my-products')}>
                  查看全部
                </Button>
              </div>
              <div className={styles.productPreview}>
                {[1, 2, 3].map((id) => (
                  <Card
                    key={id}
                    hoverable
                    className={styles.productCard}
                    onClick={() => navigate('/my-products')}
                  >
                    <div className={styles.productThumb} />
                    <Space size={4} direction="vertical" style={{ width: '100%' }}>
                      <Text className={styles.productTitle}>示例商品 {id}</Text>
                      <Text className={styles.productPrice}>￥{20 + id * 5}</Text>
                    </Space>
                  </Card>
                ))}
              </div>
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                这里是「我的商品」区域，最近发布的商品会优先展示，点击可跳转到商品详情。
              </Paragraph>
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
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                这是个人收藏页面，你在商品详情页点「收藏」的物品都会展示在这里，点击可跳转到详情页。
              </Paragraph>
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
                    <Button size="small" type="outline">
                      私信
                    </Button>
                  </div>
                ))}
              </div>
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                这里是「我的关注」列表，展示你关注的卖家 / 买家。后续可以在这里进入对方主页或发起私信。
              </Paragraph>
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
                        <Text type="secondary" className={styles.userMeta}>
                          最近一次互动：2025-09-{10 + id}
                        </Text>
                      </div>
                    </div>
                    <Button size="small" type="outline">
                      回关
                    </Button>
                  </div>
                ))}
              </div>
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                这里是「我的粉丝」列表，展示关注你的人。后续可以从这里进入粉丝主页并回关或私信。
              </Paragraph>
            </div>
          )}
        </section>
      </Card>

      <nav className={styles.bottomNav}>
        <button
          type="button"
          className={styles.navItem}
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
          className={`${styles.navItem} ${styles.navItemActive}`}
          onClick={() => navigate('/profile')}
        >
          <IconUser />
          <span>个人</span>
        </button>
      </nav>
>>>>>>> Show-website-page
    </div>
  );
}

<<<<<<< HEAD
=======
>>>>>>> Stashed changes
>>>>>>> Show-website-page
