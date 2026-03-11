import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Carousel,
  Divider,
  Empty,
  Grid,
  Input,
  Message,
  Spin,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconHeart, IconMessage, IconStar, IconUser } from '@arco-design/web-react/icon';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getProductDetail as fetchProductDetailApi,
  offShelfProduct,
  parseProductApiError,
  type ProductDetail as ApiProductDetail,
} from '@/api/products';
import {
  createProductComment,
  followUser,
  getMyFollowing,
  getProductComments,
  parseInteractionApiError,
  toggleFavorite,
  unfollowUser,
} from '@/api/interactions';
import { useAuthStore } from '@/store/auth';
import { useMessageStore } from '@/store/message';
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
    id: 11,
    title: '高数教材上册',
    price: 25,
    campus: 'laoshan',
    category: '教材 / 书籍',
    condition: '9成新',
    description: '自用一学期，书页完整无缺页，适合新生使用。',
    images: ['', '', ''],
    seller: { id: 0, nickname: '我', rating: 4.8, ratingCount: 23 },
    favorites: 2,
    status: 'on_sale',
  },
  {
    id: 12,
    title: '宿舍收纳架',
    price: 30,
    campus: 'laoshan',
    category: '宿舍家具',
    condition: '8成新',
    description: '稳固耐用，带滚轮，崂山校区自提。',
    images: ['', ''],
    seller: { id: 0, nickname: '我', rating: 4.8, ratingCount: 23 },
    favorites: 4,
    status: 'on_sale',
  },
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

function mapApiProductToView(data: ApiProductDetail): Product {
  const campus: CampusKey = data.campus || 'xihai';
  return {
    id: data.id,
    title: data.title,
    price: Number(data.price),
    campus,
    category: data.category?.name || '未分类',
    condition: data.condition,
    description: data.description || '',
    images: (data.images || []).map((img) => img.image_url || '').filter(Boolean),
    seller: {
      id: data.seller.id,
      nickname: data.seller.name,
      rating: 4.8,
      ratingCount: 0,
    },
    favorites: data.like_count || 0,
    status: data.status === 'off_shelf' ? 'off' : data.status,
  };
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((s) => s.user);
  const getOrCreateConversation = useMessageStore((s) => s.getOrCreateConversation);
  const sendTextMessage = useMessageStore((s) => s.sendTextMessage);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

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
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [isFollowingSeller, setIsFollowingSeller] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editableProduct, setEditableProduct] = useState<Product>(product);
  const images = editableProduct.images.length > 0 ? editableProduct.images : [''];
  const total = images.length;
  const currentUserId = currentUser?.id ?? 0;
  const isOwnerFromState = Boolean((location.state as { isOwner?: boolean } | null)?.isOwner);
  const isSelfSeller = currentUserId === editableProduct.seller.id || isOwnerFromState;
  const [isEditingMine, setIsEditingMine] = useState(false);

  useEffect(() => {
    setEditableProduct(product);
    setIsEditingMine(false);
  }, [product]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const pid = Number(id);
      if (!pid) return;
      setLoadingProduct(true);
      try {
        const data = await fetchProductDetailApi(pid);
        if (!mounted) return;
        setEditableProduct(mapApiProductToView(data));
      } catch (e) {
        Message.warning(parseProductApiError(e, '读取商品详情失败，已使用本地数据'));
      } finally {
        if (mounted) setLoadingProduct(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const loadComments = async () => {
      const pid = Number(id);
      if (!pid) return;
      setLoadingComments(true);
      setCommentError('');
      try {
        const list = await getProductComments(pid);
        if (!mounted) return;
        if (list.length === 0) {
          setComments([]);
          return;
        }
        const topLevel = list
          .filter((item) => item.parent_id === null)
          .map((item) => ({
            id: String(item.id),
            userId: item.author_id,
            username: `用户${item.author_id}`,
            content: item.content,
            time: item.created_at.slice(0, 16).replace('T', ' '),
            likes: 0,
            likedByMe: false,
            replies: list
              .filter((child) => child.parent_id === item.id)
              .map((child) => ({
                id: String(child.id),
                userId: child.author_id,
                username: `用户${child.author_id}`,
                content: child.content,
                time: child.created_at.slice(0, 16).replace('T', ' '),
              })),
          }));
        setComments(topLevel);
      } catch (e) {
        if (!mounted) return;
        setCommentError(parseInteractionApiError(e, '评论加载失败，已显示本地示例评论'));
      } finally {
        if (mounted) setLoadingComments(false);
      }
    };
    void loadComments();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    getMyFollowing()
      .then((list) => {
        if (!mounted) return;
        setIsFollowingSeller(list.some((item) => item.followed_id === editableProduct.seller.id));
      })
      .catch(() => {
        if (!mounted) return;
        setIsFollowingSeller(false);
      });
    return () => {
      mounted = false;
    };
  }, [editableProduct.seller.id]);

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

  const submitReply = async (commentId: string) => {
    const text = (replyDrafts[commentId] || '').trim();
    if (!text) return;
    try {
      setSubmittingComment(true);
      await createProductComment(Number(id), text, Number(commentId));
      setComments((prev) =>
        prev.map((item) => {
          if (item.id !== commentId) return item;
          return {
            ...item,
            replies: [
              ...item.replies,
              {
                id: `r_${Date.now()}`,
                userId: currentUserId,
                username: currentUser?.nickname || '我',
                content: text,
                time: nowText(),
              },
            ],
          };
        }),
      );
    } catch (e) {
      Message.error(parseInteractionApiError(e, '回复失败，请稍后重试'));
    } finally {
      setSubmittingComment(false);
    }
    setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
    setReplyingId(null);
  };

  const submitComment = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    try {
      setSubmittingComment(true);
      await createProductComment(Number(id), text);
      setComments((prev) => [
        {
          id: `c_${Date.now()}`,
          userId: currentUserId,
          username: currentUser?.nickname || '我',
          content: text,
          time: nowText(),
          likes: 0,
          likedByMe: false,
          replies: [],
        },
        ...prev,
      ]);
      setCommentDraft('');
    } catch (e) {
      Message.error(parseInteractionApiError(e, '评论发布失败'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePai = () => {
    if (isSelfSeller) return;
    const cid = getOrCreateConversation(editableProduct.seller.id, editableProduct.seller.nickname);
    sendTextMessage(cid, `我拍了你的《${editableProduct.title}》商品`, true);
    navigate('/notifications', {
      state: { peerId: editableProduct.seller.id, peerName: editableProduct.seller.nickname },
    });
  };

  const handleSaveMine = () => {
    setIsEditingMine(false);
    Message.success('商品信息已更新（前端演示）');
  };

  const handleToggleShelf = async () => {
    try {
      if (editableProduct.status === 'off') {
        Message.info('后端暂未提供重新上架接口，当前仅保留已下架状态');
        return;
      }
      await offShelfProduct(editableProduct.id);
      setEditableProduct((prev) => ({ ...prev, status: 'off' }));
      Message.success('商品已下架');
    } catch (e) {
      Message.error(parseProductApiError(e, '下架失败，请稍后重试'));
    }
  };

  const handleToggleFavorite = async () => {
    try {
      setFavoritePending(true);
      await toggleFavorite(editableProduct.id, collected);
      setCollected((v) => !v);
    } catch (e) {
      Message.error(parseInteractionApiError(e, '收藏操作失败'));
    } finally {
      setFavoritePending(false);
    }
  };

  const handleToggleFollowSeller = async () => {
    try {
      setFollowPending(true);
      if (isFollowingSeller) {
        await unfollowUser(editableProduct.seller.id);
        setIsFollowingSeller(false);
      } else {
        await followUser(editableProduct.seller.id);
        setIsFollowingSeller(true);
      }
    } catch (e) {
      Message.error(parseInteractionApiError(e, '关注操作失败'));
    } finally {
      setFollowPending(false);
    }
  };

  const handleChangeMainImage = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setEditableProduct((prev) => ({
      ...prev,
      images: [url, ...prev.images.slice(1)],
    }));
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
            {loadingProduct ? <Spin style={{ marginBottom: 12 }} /> : null}
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
                      onClick={() => {
                        if (isSelfSeller && isEditingMine && idx === 0) {
                          imageInputRef.current?.click();
                        }
                      }}
                    />
                  </div>
                ))}
              </Carousel>
              {isSelfSeller && isEditingMine && (
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenFileInput}
                  onChange={(e) => {
                    handleChangeMainImage(e.target.files?.[0]);
                    e.currentTarget.value = '';
                  }}
                />
              )}
              <div className={styles.pager}>
                {activeIndex + 1}/{total}
              </div>
              {isSelfSeller && isEditingMine && (
                <div className={styles.editImageHint}>点击首图可替换商品图片</div>
              )}
            </div>

            <div className={styles.detailBlock}>
              <div className={styles.blockTitle}>商品描述</div>
              {isSelfSeller && isEditingMine ? (
                <Input.TextArea
                  value={editableProduct.description}
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  onChange={(v) => setEditableProduct((prev) => ({ ...prev, description: v }))}
                />
              ) : (
                <Paragraph className={styles.desc}>{editableProduct.description}</Paragraph>
              )}
            </div>

            <div className={styles.commentBlock}>
              <div className={styles.blockTitle}>讨论区</div>
              <div className={styles.commentList}>
                {loadingComments ? (
                  <Spin style={{ margin: '20px auto', display: 'block' }} />
                ) : commentError ? (
                  <Empty description={commentError} />
                ) : comments.length === 0 ? (
                  <Empty description="还没有评论，来发第一条吧" />
                ) : (
                  comments.map((item) => (
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
                  ))
                )}
              </div>
              <div className={styles.commentComposer}>
                <Input.TextArea
                  placeholder="写下你的评论..."
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  value={commentDraft}
                  onChange={setCommentDraft}
                />
                <div className={styles.commentComposerActions}>
                  <Button type="primary" loading={submittingComment} onClick={submitComment}>
                    发表评论
                  </Button>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} md={10} className={styles.right}>
            <div className={styles.priceLine}>
              <span className={styles.priceSymbol}>￥</span>
              {isSelfSeller && isEditingMine ? (
                <Input
                  value={String(editableProduct.price)}
                  className={styles.editInputInline}
                  onChange={(v) =>
                    setEditableProduct((prev) => ({
                      ...prev,
                      price: Number(v) || 0,
                    }))
                  }
                />
              ) : (
                <span className={styles.priceValue}>{editableProduct.price}</span>
              )}
              <span className={styles.priceHint}>（具体以双方沟通为准）</span>
            </div>

            <div className={styles.titleLine}>
              {isSelfSeller && isEditingMine ? (
                <Input
                  value={editableProduct.title}
                  onChange={(v) => setEditableProduct((prev) => ({ ...prev, title: v }))}
                />
              ) : (
                <Title heading={4} className={styles.title}>
                  {editableProduct.title}
                </Title>
              )}
              {statusTag(editableProduct.status)}
            </div>

            <div className={styles.metaCard}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>所在校区</span>
                {isSelfSeller && isEditingMine ? (
                  <Input
                    value={campusLabel(editableProduct.campus)}
                    className={styles.editSmallInput}
                    onChange={(v) =>
                      setEditableProduct((prev) => ({
                        ...prev,
                        campus: v.includes('崂山') ? 'laoshan' : v.includes('鱼山') ? 'yushan' : 'xihai',
                      }))
                    }
                  />
                ) : (
                  <span className={styles.metaValue}>{campusLabel(editableProduct.campus)}</span>
                )}
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>分类</span>
                {isSelfSeller && isEditingMine ? (
                  <Input
                    value={editableProduct.category}
                    className={styles.editSmallInput}
                    onChange={(v) => setEditableProduct((prev) => ({ ...prev, category: v }))}
                  />
                ) : (
                  <span className={styles.metaValue}>{editableProduct.category}</span>
                )}
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>新旧程度</span>
                {isSelfSeller && isEditingMine ? (
                  <Input
                    value={editableProduct.condition}
                    className={styles.editSmallInput}
                    onChange={(v) => setEditableProduct((prev) => ({ ...prev, condition: v }))}
                  />
                ) : (
                  <span className={styles.metaValue}>{editableProduct.condition}</span>
                )}
              </div>
            </div>

            <Divider style={{ margin: '14px 0' }} />

            <div className={styles.sellerCard}>
              <div className={styles.sellerHeader}>
                <div className={styles.sellerLeft}>
                  <Avatar
                    size={44}
                    className={styles.sellerAvatar}
                    onClick={() => navigate(`/seller/${editableProduct.seller.id}`)}
                  >
                    <IconUser />
                  </Avatar>
                  <div>
                    <button
                      type="button"
                      className={styles.sellerNameButton}
                      onClick={() => navigate(`/seller/${editableProduct.seller.id}`)}
                    >
                      {editableProduct.seller.nickname}
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
                          style={{ width: `${(editableProduct.seller.rating / 5) * 100}%` }}
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <IconStar key={i} />
                          ))}
                        </div>
                      </div>
                      <Text className={styles.sellerScore}>{editableProduct.seller.rating.toFixed(1)}</Text>
                      <Text type="secondary" className={styles.sellerCount}>
                        来自 {editableProduct.seller.ratingCount} 条评价
                      </Text>
                      <Text type="secondary" className={styles.sellerCount}>
                        · 粉丝 --
                      </Text>
                    </div>
                  </div>
                </div>
                {!isSelfSeller && (
                  <Button
                    size="small"
                    type={isFollowingSeller ? 'outline' : 'primary'}
                    loading={followPending}
                    onClick={handleToggleFollowSeller}
                  >
                    {isFollowingSeller ? '已关注' : '关注'}
                  </Button>
                )}
              </div>

              <Space className={styles.actionButtons}>
                {isSelfSeller ? (
                  <>
                    <Button type="outline" status="danger" onClick={handleToggleShelf}>
                      {editableProduct.status === 'off' ? '重新上架' : '下架商品'}
                    </Button>
                    <Button
                      type="primary"
                      icon={<IconStar />}
                      onClick={() => (isEditingMine ? handleSaveMine() : setIsEditingMine(true))}
                    >
                      {isEditingMine ? '保存修改' : '编辑商品'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="outline"
                      icon={<IconStar />}
                      loading={favoritePending}
                      onClick={handleToggleFavorite}
                    >
                      {collected ? '已收藏' : '收藏'}（{editableProduct.favorites + (collected ? 1 : 0)}）
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
                          state: { peerId: editableProduct.seller.id, peerName: editableProduct.seller.nickname },
                        })
                      }
                    >
                      联系卖家
                    </Button>
                  </>
                )}
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
