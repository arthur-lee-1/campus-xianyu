import { useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Carousel,
  Divider,
  Grid,
  Input,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconHeart, IconMessage, IconStar, IconUser } from '@arco-design/web-react/icon';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMessageStore } from '@/store/message';
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
    id: number;
    nickname: string;
    rating: number;
    ratingCount: number;
  };
  favorites: number;
  status: 'on_sale' | 'sold' | 'off';
};

type CommentItem = {
  id: string;
  userId: number;
  username: string;
  content: string;
  time: string;
  likes: number;
  likedByMe: boolean;
  replies: {
    id: string;
    userId: number;
    username: string;
    content: string;
    time: string;
  }[];
};

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
    seller: { id: 1, nickname: '海大数院同学', rating: 4.9, ratingCount: 18 },
    favorites: 6,
    status: 'on_sale',
  },
];

const MOCK_COMMENTS: CommentItem[] = [
  {
    id: 'c1',
    userId: 2,
    username: '鱼山小同学',
    content: '请问可以今天晚上校内面交吗？',
    time: '2026-03-01 11:07',
    likes: 35,
    likedByMe: false,
    replies: [
      {
        id: 'r11',
        userId: 1,
        username: '海大数院同学',
        content: '可以的，今晚 7 点后都可以。',
        time: '2026-03-01 11:20',
      },
    ],
  },
  {
    id: 'c2',
    userId: 3,
    username: '百变小可',
    content: '这本书内容挺全的，适合期末前快速复习。',
    time: '2026-02-28 19:44',
    likes: 38,
    likedByMe: false,
    replies: [],
  },
  {
    id: 'c3',
    userId: 4,
    username: '沙枫冰兰',
    content: '买过一次，卖家回复很快，交易流程也很顺畅。',
    time: '2026-03-02 14:18',
    likes: 14,
    likedByMe: false,
    replies: [],
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

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isFollowingSeller, toggleFollowSeller, sellerFollowers } = useSocialStore();
  const getOrCreateConversation = useMessageStore((s) => s.getOrCreateConversation);
  const sendTextMessage = useMessageStore((s) => s.sendTextMessage);

  const product = useMemo(() => {
    const pid = Number(id);
    return MOCK_PRODUCTS.find((p) => p.id === pid) ?? MOCK_PRODUCTS[0];
  }, [id]);

  const [collected, setCollected] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [comments, setComments] = useState<CommentItem[]>(MOCK_COMMENTS);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [commentDraft, setCommentDraft] = useState('');
  const images = product.images.length > 0 ? product.images : [''];
  const total = images.length;
  const currentUserId = 0;
  const isSelfSeller = currentUserId === product.seller.id;

  const nowText = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const toggleCommentLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((item) => {
        if (item.id !== commentId) return item;
        const nextLiked = !item.likedByMe;
        return {
          ...item,
          likedByMe: nextLiked,
          likes: nextLiked ? item.likes + 1 : Math.max(0, item.likes - 1),
        };
      }),
    );
  };

  const submitReply = (commentId: string) => {
    const text = (replyDrafts[commentId] || '').trim();
    if (!text) return;
    setComments((prev) =>
      prev.map((item) => {
        if (item.id !== commentId) return item;
        return {
          ...item,
          replies: [
            ...item.replies,
            {
              id: `r_${Date.now()}`,
              userId: 0,
              username: '我',
              content: text,
              time: nowText(),
            },
          ],
        };
      }),
    );
    setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
    setReplyingId(null);
  };

  const submitComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    setComments((prev) => [
      {
        id: `c_${Date.now()}`,
        userId: 0,
        username: '我',
        content: text,
        time: nowText(),
        likes: 0,
        likedByMe: false,
        replies: [],
      },
      ...prev,
    ]);
    setCommentDraft('');
  };

  const handlePai = () => {
    if (isSelfSeller) return;
    const cid = getOrCreateConversation(product.seller.id, product.seller.nickname);
    sendTextMessage(cid, `我拍了你的《${product.title}》商品`, true);
    navigate('/notifications', {
      state: { peerId: product.seller.id, peerName: product.seller.nickname },
    });
  };

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
                    <div
                      className={styles.slideImage}
                      style={src ? { backgroundImage: `url(${src})` } : undefined}
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

            <div className={styles.commentBlock}>
              <div className={styles.blockTitle}>讨论区</div>
              <div className={styles.commentList}>
                {comments.map((item) => (
                  <div key={item.id} className={styles.commentItem}>
                    <Avatar
                      size={36}
                      className={styles.commentAvatar}
                      onClick={() => {
                        if (item.userId === 0) {
                          navigate('/profile');
                          return;
                        }
                        navigate(`/seller/${item.userId}`);
                      }}
                    >
                      {item.username.slice(0, 1)}
                    </Avatar>
                    <div className={styles.commentContent}>
                      <div className={styles.commentHead}>
                        <Text className={styles.commentUser}>{item.username}</Text>
                        <Text type="secondary" className={styles.commentTime}>
                          {item.time}
                        </Text>
                      </div>
                      <Paragraph className={styles.commentText}>{item.content}</Paragraph>
                      <div className={styles.commentFoot}>
                        <Button
                          type="text"
                          size="mini"
                          className={`${styles.heartBtn} ${item.likedByMe ? styles.heartBtnActive : ''}`}
                          icon={<IconHeart />}
                          onClick={() => toggleCommentLike(item.id)}
                        >
                          {item.likes}
                        </Button>
                        <Button
                          type="text"
                          size="mini"
                          onClick={() => setReplyingId((prev) => (prev === item.id ? null : item.id))}
                        >
                          回复
                        </Button>
                      </div>
                      {item.replies.length > 0 && (
                        <div className={styles.replyList}>
                          {item.replies.map((reply) => (
                            <div key={reply.id} className={styles.replyItem}>
                              <Avatar
                                size={24}
                                className={styles.replyAvatar}
                                onClick={() => {
                                  if (reply.userId === 0) {
                                    navigate('/profile');
                                    return;
                                  }
                                  if (reply.userId > 0) navigate(`/seller/${reply.userId}`);
                                }}
                              >
                                {reply.username.slice(0, 1)}
                              </Avatar>
                              <div className={styles.replyBody}>
                                <div className={styles.replyHead}>
                                  <Text className={styles.replyUser}>{reply.username}</Text>
                                  <Text type="secondary" className={styles.replyTime}>
                                    {reply.time}
                                  </Text>
                                </div>
                                <Text>{reply.content}</Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {replyingId === item.id && (
                        <div className={styles.replyEditor}>
                          <Input
                            placeholder="输入回复内容..."
                            value={replyDrafts[item.id] || ''}
                            onChange={(v) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [item.id]: v,
                              }))
                            }
                          />
                          <Button type="primary" size="small" onClick={() => submitReply(item.id)}>
                            发送
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.commentComposer}>
                <Input.TextArea
                  placeholder="写下你的评论..."
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  value={commentDraft}
                  onChange={setCommentDraft}
                />
                <div className={styles.commentComposerActions}>
                  <Button type="primary" onClick={submitComment}>
                    发表评论
                  </Button>
                </div>
              </div>
            </div>
          </Col>

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
                  <Avatar
                    size={44}
                    className={styles.sellerAvatar}
                    onClick={() => navigate(`/seller/${product.seller.id}`)}
                  >
                    <IconUser />
                  </Avatar>
                  <div>
                    <button
                      type="button"
                      className={styles.sellerNameButton}
                      onClick={() => navigate(`/seller/${product.seller.id}`)}
                    >
                      {product.seller.nickname}
                    </button>
                    <div className={styles.sellerRating}>
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
                      <Text className={styles.sellerScore}>{product.seller.rating.toFixed(1)}</Text>
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
                  {collected ? '已收藏' : '收藏'}（{product.favorites + (collected ? 1 : 0)}）
                </Button>
                {!isSelfSeller && (
                  <Button type="outline" className={styles.paiButton} onClick={handlePai}>
                    拍
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<IconMessage />}
                  onClick={() =>
                    navigate('/notifications', {
                      state: { peerId: product.seller.id, peerName: product.seller.nickname },
                    })
                  }
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
