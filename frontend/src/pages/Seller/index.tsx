import { useMemo } from 'react';
import { Avatar, Button, Card, Grid, Space, Tag, Typography } from '@arco-design/web-react';
import { IconMessage, IconUser } from '@arco-design/web-react/icon';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSellerReviewStore } from '@/store/sellerReview';
import { useSocialStore } from '@/store/social';
import styles from './index.module.css';

const { Title, Text, Paragraph } = Typography;
const Row = Grid.Row;
const Col = Grid.Col;

type SellerInfo = {
  id: number;
  name: string;
  campus: string;
  bio: string;
  rating: number;
  online: boolean;
};

type SellerProduct = {
  id: number;
  sellerId: number;
  title: string;
  price: number;
  status: 'on_sale' | 'sold';
};

const MOCK_SELLERS: SellerInfo[] = [
  { id: 1, name: '海大数院同学', campus: '中国海洋大学 · 西海岸校区', bio: '诚信交易，支持当面验货。', rating: 4.9, online: true },
  { id: 2, name: '鱼山校区卖家', campus: '中国海洋大学 · 鱼山校区', bio: '可小刀，优先同校区面交。', rating: 4.7, online: true },
  { id: 3, name: '崂山小王', campus: '中国海洋大学 · 崂山校区', bio: '常驻崂山，晚上可交易。', rating: 4.6, online: false },
];

const MOCK_PRODUCTS: SellerProduct[] = [
  { id: 1, sellerId: 1, title: '线代教材（含课堂笔记）', price: 5, status: 'on_sale' },
  { id: 7, sellerId: 1, title: '高数教材套装', price: 12, status: 'on_sale' },
  { id: 2, sellerId: 2, title: '护眼台灯', price: 35, status: 'on_sale' },
  { id: 8, sellerId: 2, title: '宿舍收纳箱', price: 16, status: 'sold' },
  { id: 3, sellerId: 3, title: '二手吉他', price: 260, status: 'on_sale' },
];

function statusTag(status: SellerProduct['status']) {
  return status === 'on_sale' ? <Tag color="green">在售</Tag> : <Tag color="arcoblue">已售</Tag>;
}

export default function SellerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isFollowingSeller, toggleFollowSeller } = useSocialStore();
  const reviewsBySeller = useSellerReviewStore((s) => s.reviewsBySeller);
  const fromMessages = (location.state as { fromMessages?: boolean } | null)?.fromMessages;

  const seller = useMemo(() => {
    const sid = Number(id);
    return MOCK_SELLERS.find((s) => s.id === sid) ?? MOCK_SELLERS[0];
  }, [id]);

  const sellerProducts = useMemo(
    () => MOCK_PRODUCTS.filter((p) => p.sellerId === seller.id),
    [seller.id],
  );
  const sellerReviews = reviewsBySeller[seller.id] || [];
  const shownRating = useMemo(() => {
    if (sellerReviews.length === 0) return seller.rating;
    const avg = sellerReviews.reduce((sum, item) => sum + item.score, 0) / sellerReviews.length;
    return avg;
  }, [seller.rating, sellerReviews]);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card} bordered={false}>
        <div className={styles.backRow}>
          <Button type="text" onClick={handleBack}>
            返回上一页
          </Button>
        </div>
        <div className={styles.top}>
          <div className={styles.sellerInfo}>
            <Avatar size={68} className={styles.avatar}>
              <IconUser />
            </Avatar>
            <div>
              <Title heading={4} className={styles.name}>
                {seller.name}
              </Title>
              <Text type="secondary">{seller.campus}</Text>
              <div className={styles.subRow}>
                {seller.online && <span className={styles.onlineDot} />}
                <Text type="secondary">{seller.online ? '在线' : '离线'}</Text>
                <Text className={styles.ratingText}>{shownRating.toFixed(1)} / 5.0</Text>
                <Button
                  size="mini"
                  type="outline"
                  className={styles.rateBtn}
                  onClick={() => navigate(`/seller/${seller.id}/reviews`)}
                >
                  查看评价
                </Button>
                <Button
                  size="mini"
                  type="primary"
                  className={styles.rateBtn}
                  onClick={() => navigate(`/seller/${seller.id}/rate`, { state: { sellerName: seller.name } })}
                >
                  给他评价
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.actions}>
            <Button
              type={isFollowingSeller ? 'outline' : 'primary'}
              size="small"
              onClick={toggleFollowSeller}
            >
              {isFollowingSeller ? '已关注' : '关注'}
            </Button>
            {fromMessages && (
              <Button type="outline" size="small" onClick={() => navigate('/notifications')}>
                返回消息
              </Button>
            )}
          </div>
        </div>

        <Paragraph className={styles.bio}>{seller.bio}</Paragraph>

        <div className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>商品</Text>
          <Button
            type="text"
            size="small"
            icon={<IconMessage />}
            onClick={() => navigate('/notifications', { state: { peerId: seller.id, peerName: seller.name } })}
          >
            私信商家
          </Button>
        </div>

        <Row gutter={12}>
          {sellerProducts.map((item) => (
            <Col key={item.id} xs={12} sm={8}>
              <Card
                className={styles.productCard}
                hoverable
                onClick={() => navigate(`/product/${item.id}`)}
              >
                <div className={styles.thumb} />
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text className={styles.productTitle}>{item.title}</Text>
                  <div className={styles.metaRow}>
                    <Text className={styles.price}>￥{item.price}</Text>
                    {statusTag(item.status)}
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

