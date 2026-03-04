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
import { IconUser, IconEdit, IconStar } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';

const { Title, Paragraph, Text } = Typography;

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
            <Text bold>{MOCK_USER.following}</Text>
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
    </div>
  );
}

