import { useEffect, useState } from 'react';
import { Avatar, Button, Card, Empty, Rate, Spin, Typography } from '@arco-design/web-react';
import { IconUser } from '@arco-design/web-react/icon';
import { useNavigate, useParams } from 'react-router-dom';
import { getSellerReviews, type SellerReviewDTO } from '@/api/sellerReviews';
import styles from './Reviews.module.css';

const { Title, Text, Paragraph } = Typography;

const SELLER_NAME_MAP: Record<number, string> = {
  1: '海大数院同学',
  2: '鱼山校区卖家',
  3: '崂山小王',
};

export default function SellerReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sellerId = Number(id || 0);
  const [reviews, setReviews] = useState<SellerReviewDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sellerName = SELLER_NAME_MAP[sellerId] || '该用户';

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    getSellerReviews(sellerId)
      .then((list) => {
        if (!mounted) return;
        setReviews(list);
      })
      .catch(() => {
        if (!mounted) return;
        setError('评价加载失败，请稍后重试');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [sellerId]);

  return (
    <div className={styles.wrapper}>
      <Card className={styles.panel} bordered={false}>
        <div className={styles.header}>
          <Title heading={5} style={{ margin: 0 }}>
            {sellerName} 的评价
          </Title>
          <Text type="secondary">这里展示的是其他用户对该商家的评价</Text>
        </div>

        {loading ? (
          <Spin style={{ margin: '28px auto', display: 'block' }} />
        ) : error ? (
          <Empty description={error} />
        ) : reviews.length === 0 ? (
          <Empty description="暂时还没有评价" />
        ) : (
          <div className={styles.list}>
            {reviews.map((item) => (
              <div key={item.id} className={styles.item}>
                <Avatar size={40} className={styles.avatar}>
                  {item.reviewerAvatar ? (
                    <img src={item.reviewerAvatar} alt={item.reviewerName} className={styles.avatarImg} />
                  ) : (
                    <IconUser />
                  )}
                </Avatar>
                <div className={styles.content}>
                  <div className={styles.topRow}>
                    <Text className={styles.name}>{item.reviewerName}</Text>
                    <Text type="secondary">{item.createdAt}</Text>
                  </div>
                  <div className={styles.scoreRow}>
                    <Rate disabled value={item.score} allowHalf />
                    <Text type="secondary">{item.score.toFixed(1)}</Text>
                  </div>
                  <Paragraph className={styles.text}>{item.content}</Paragraph>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <Button type="text" onClick={() => navigate(`/seller/${sellerId}`)}>
            返回商家主页
          </Button>
        </div>
      </Card>
    </div>
  );
}

