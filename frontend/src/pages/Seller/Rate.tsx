import { useMemo, useState } from 'react';
import { Avatar, Button, Card, Input, Message, Rate, Typography } from '@arco-design/web-react';
import { IconUser } from '@arco-design/web-react/icon';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useUserProfileStore } from '@/store/userProfile';
import { useSellerReviewStore } from '@/store/sellerReview';
import styles from './Rate.module.css';

const { Title, Text } = Typography;

const SELLER_NAME_MAP: Record<number, string> = {
  1: '海大数院同学',
  2: '鱼山校区卖家',
  3: '崂山小王',
};

export default function SellerRatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const sellerId = Number(id || 0);
  const stateName = (location.state as { sellerName?: string } | null)?.sellerName;
  const sellerName = stateName || SELLER_NAME_MAP[sellerId] || '该用户';

  const [score, setScore] = useState(5);
  const [content, setContent] = useState('');
  const nickname = useUserProfileStore((s) => s.nickname);
  const avatarUrl = useUserProfileStore((s) => s.avatarUrl);
  const addReview = useSellerReviewStore((s) => s.addReview);
  const disabled = useMemo(() => content.trim().length === 0, [content]);

  const handleSubmit = () => {
    if (disabled) return;
    addReview({
      sellerId,
      score,
      content: content.trim(),
      reviewerName: nickname || '我',
      reviewerAvatar: avatarUrl,
    });
    Message.success('评价发布成功');
    navigate(`/seller/${sellerId}`);
  };

  return (
    <div className={styles.wrapper}>
      <Card className={styles.panel} bordered={false}>
        <div className={styles.userLine}>
          <Avatar size={56} className={styles.avatar}>
            {avatarUrl ? <img src={avatarUrl} alt="我的头像" className={styles.avatarImg} /> : <IconUser />}
          </Avatar>
          <div>
            <Title heading={5} style={{ margin: 0 }}>
              {sellerName}
            </Title>
            <Text type="secondary">给对方留下你的真实评价</Text>
          </div>
        </div>

        <div className={styles.scoreLine}>
          <Text className={styles.label}>打分</Text>
          <Rate value={score} allowHalf onChange={setScore} />
          <Text type="secondary">{score.toFixed(1)} / 5.0</Text>
        </div>

        <div className={styles.editor}>
          <Text className={styles.label}>评价</Text>
          <Input.TextArea
            value={content}
            onChange={setContent}
            maxLength={200}
            showWordLimit
            autoSize={{ minRows: 5, maxRows: 8 }}
            placeholder="写下你的交易体验..."
          />
        </div>

        <div className={styles.actionRow}>
          <Button type="text" onClick={() => navigate(`/seller/${sellerId}`)}>
            返回上一次
          </Button>
          <div className={styles.rightActions}>
            <Button onClick={() => navigate(`/seller/${sellerId}`)}>取消</Button>
            <Button type="primary" disabled={disabled} onClick={handleSubmit}>
              发布
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

