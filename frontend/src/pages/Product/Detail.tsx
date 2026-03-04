import { useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Carousel,
  Divider,
  Grid,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconMessage, IconStar, IconUser } from '@arco-design/web-react/icon';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSocialStore } from '@/store/social';
import styles from './Detail.module.css';

const { Title, Paragraph, Text } = Typography;
const Row = Grid.Row;
const Col = Grid.Col;

type CampusKey = 'xihai' | 'laoshan' | 'yushan';

type Product = {
  id: number;
  title: string;
  price: number;
  campus: CampusKey;
  category: string;
  condition: string;
  description: string;
  images: string[];
  seller: {
    nickname: string;
    rating: number;
    ratingCount: number;
  };
  favorites: number;
  status: 'on_sale' | 'sold' | 'off';
};

// 先用 mock 数据把 UI 做到位；后续接后端时用接口替换即可
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    title: '线代教材（含课堂笔记）',
    price: 5,
    campus: 'xihai',
    category: '教材 / 书籍',
    condition: '9成新',
    description:
      '只用了一学期，部分页有铅笔标注，已用橡皮擦浅处理，整体干净可用。支持西海岸校区面交。',
    images: ['', '', '', '', ''],
    seller: { nickname: '海大数院同学', rating: 4.9, ratingCount: 18 },
    favorites: 6,
    status: 'on_sale',
  },
];

function campusLabel(c: CampusKey) {
  if (c === 'xihai') return '西海岸校区';
  if (c === 'laoshan') return '崂山校区';
  return '鱼山校区';
}

function statusTag(status: Product['status']) {
  if (status === 'on_sale') return <Tag color="green">在售</Tag>;
  if (status === 'sold') return <Tag color="arcoblue">已售出</Tag>;
  return <Tag color="gray">已下架</Tag>;
}

/**
 * 商品详情页（按你给的草图布局）
 *
 * 结构：
 * - 整体：浅蓝背景 + 大卡片容器
 * - 左侧：商品图片轮播（可左右滑动）+ 页码 1/5
 * - 右侧：价格突出 + 标题/状态 + 商品信息 + 卖家信息 + 点赞/联系卖家按钮
 *
 * 备注：
 * - 现在图片用渐变占位（images 为空字符串）；后续接 OSS 图片 URL 后会自动显示真实图片
 * - “联系卖家”目前跳转到 `/chat`（占位聊天页）
 */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isFollowingSeller, toggleFollowSeller, sellerFollowers } = useSocialStore();

  const product = useMemo(() => {
    const pid = Number(id);
    return MOCK_PRODUCTS.find((p) => p.id === pid) ?? MOCK_PRODUCTS[0];
  }, [id]);

  const [collected, setCollected] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const images = product.images.length > 0 ? product.images : [''];
  const total = images.length;

  const handleBack = () => {
    const fromState = location.state as { fromProfile?: boolean; tab?: string } | null;
    if (fromState?.fromProfile && fromState?.tab === 'favorites') {
      navigate('/profile', { state: { tab: 'favorites' }, replace: true });
      return;
    }
    navigate(-1);
  };

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card} bordered={false}>
        <Row gutter={18} className={styles.layoutRow}>
          {/* 左侧：图片轮播 */}
          <Col xs={24} md={14} className={styles.left}>
            <div className={styles.carouselWrap}>
              <Carousel
                autoPlay={false}
                indicatorType="dot"
                onChange={(index) => setActiveIndex(index)}
                className={styles.carousel}
              >
                {images.map((src, idx) => (
                  <div key={idx} className={styles.slide}>
                    {/* 用 div 做图层：src 为空时也能有漂亮占位 */}
                    <div
                      className={styles.slideImage}
                      style={
                        src
                          ? { backgroundImage: `url(${src})` }
                          : undefined
                      }
                      aria-label={`商品图片 ${idx + 1}`}
                    />
                  </div>
                ))}
              </Carousel>

              <div className={styles.pager}>
                {activeIndex + 1}/{total}
              </div>
            </div>

            <div className={styles.detailBlock}>
              <div className={styles.blockTitle}>商品描述</div>
              <Paragraph className={styles.desc}>{product.description}</Paragraph>
            </div>
          </Col>

          {/* 右侧：信息/操作 */}
          <Col xs={24} md={10} className={styles.right}>
            <div className={styles.priceLine}>
              <span className={styles.priceSymbol}>￥</span>
              <span className={styles.priceValue}>{product.price}</span>
              <span className={styles.priceHint}>（具体以双方沟通为准）</span>
            </div>

            <div className={styles.titleLine}>
              <Title heading={4} className={styles.title}>
                {product.title}
              </Title>
              {statusTag(product.status)}
            </div>

            <div className={styles.metaCard}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>所在校区</span>
                <span className={styles.metaValue}>{campusLabel(product.campus)}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>分类</span>
                <span className={styles.metaValue}>{product.category}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>新旧程度</span>
                <span className={styles.metaValue}>{product.condition}</span>
              </div>
            </div>

            <Divider style={{ margin: '14px 0' }} />

            <div className={styles.sellerCard}>
              <div className={styles.sellerHeader}>
                <div className={styles.sellerLeft}>
                  <Avatar size={44} className={styles.sellerAvatar}>
                    <IconUser />
                  </Avatar>
                  <div>
                    <div className={styles.sellerName}>{product.seller.nickname}</div>
                    <div className={styles.sellerRating}>
                      {/* 自定义星级：通过宽度控制填充比例，例如 4.9 分 ≈ 98% */}
                      <div className={styles.starBar}>
                        <div className={styles.starBarBg}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <IconStar key={i} />
                          ))}
                        </div>
                        <div
                          className={styles.starBarFill}
                          style={{ width: `${(product.seller.rating / 5) * 100}%` }}
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <IconStar key={i} />
                          ))}
                        </div>
                      </div>
                      <Text className={styles.sellerScore}>
                        {product.seller.rating.toFixed(1)}
                      </Text>
                      <Text type="secondary" className={styles.sellerCount}>
                        来自 {product.seller.ratingCount} 条评价
                      </Text>
                      <Text type="secondary" className={styles.sellerCount}>
                        · 粉丝 {sellerFollowers}
                      </Text>
                    </div>
                  </div>
                </div>
                <Button
                  size="small"
                  type={isFollowingSeller ? 'outline' : 'primary'}
                  onClick={toggleFollowSeller}
                >
                  {isFollowingSeller ? '已关注' : '关注'}
                </Button>
              </div>

              <Space className={styles.actionButtons}>
                <Button
                  type="outline"
                  icon={<IconStar />}
                  onClick={() => setCollected((v) => !v)}
                >
                  {collected ? '已收藏' : '收藏'}（
                  {product.favorites + (collected ? 1 : 0)}）
                </Button>
                <Button
                  type="primary"
                  icon={<IconMessage />}
                  onClick={() => navigate('/chat')}
                >
                  联系卖家
                </Button>
              </Space>
            </div>

            <div className={styles.backRow}>
              <Button type="text" onClick={handleBack}>
                返回上一页
              </Button>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

