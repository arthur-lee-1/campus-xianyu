import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Badge, Button, Empty, Input, Modal, Space, Spin, Typography } from '@arco-design/web-react';
import {
  IconHome,
  IconUpload,
  IconMessage,
  IconUser,
  IconSearch,
  IconPlus,
  IconSend,
  IconImage,
} from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMessageStore, useTotalUnreadCount } from '@/store/message';
import styles from './index.module.css';

const { Text, Title } = Typography;

export default function Notification() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const conversations = useMessageStore((s) => s.conversations);
  const messagesByConversation = useMessageStore((s) => s.messagesByConversation);
  const activeConversationId = useMessageStore((s) => s.activeConversationId);
  const loadingConversations = useMessageStore((s) => s.loadingConversations);
  const loadingMessages = useMessageStore((s) => s.loadingMessages);
  const sending = useMessageStore((s) => s.sending);

  const setActiveConversationId = useMessageStore((s) => s.setActiveConversationId);
  const fetchConversations = useMessageStore((s) => s.fetchConversations);
  const fetchMessages = useMessageStore((s) => s.fetchMessages);
  const ensureAndOpenConversation = useMessageStore((s) => s.ensureAndOpenConversation);
  const sendTextMessage = useMessageStore((s) => s.sendTextMessage);
  const sendImageMessage = useMessageStore((s) => s.sendImageMessage);
  const markConversationRead = useMessageStore((s) => s.markConversationRead);
  const fetchUnreadTotal = useMessageStore((s) => s.fetchUnreadTotal);

  const unreadTotal = useTotalUnreadCount();

  const incoming =
    (location.state as { conversationId?: number; peerName?: string; peerId?: number; productId?: number } | null) ?? null;

  const [draft, setDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  const activeMessages = activeConversation
    ? messagesByConversation[activeConversation.id] || []
    : [];

  useEffect(() => {
    void fetchConversations();
    void fetchUnreadTotal();
  }, [fetchConversations, fetchUnreadTotal]);

  useEffect(() => {
    if (!incoming?.peerId) return;

    const run = async () => {
      const id = await ensureAndOpenConversation(incoming.peerId!, incoming.productId);
      await fetchMessages(id);
      await markConversationRead(id);
      await fetchConversations();
    };

    void run();
  }, [
    incoming?.peerId,
    incoming?.productId,
    ensureAndOpenConversation,
    fetchMessages,
    markConversationRead,
    fetchConversations,
  ]);

  useEffect(() => {
    if (!activeConversationId) return;

    const run = async () => {
      await fetchMessages(activeConversationId);
      await markConversationRead(activeConversationId);
      await fetchConversations();
    };

    void run();
  }, [activeConversationId, fetchMessages, markConversationRead, fetchConversations]);

  const handleSearch = async () => {
    await fetchConversations(keyword.trim() || undefined);
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeConversation) return;

    await sendTextMessage(activeConversation.id, text);
    setDraft('');
    await fetchConversations();
  };

  const sendPhoto = async (file?: File) => {
    if (!file || !activeConversation) return;

    await sendImageMessage(activeConversation.id, file);
    await fetchConversations();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.mainPanel}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <Input
              value={keyword}
              onChange={setKeyword}
              onPressEnter={handleSearch}
              prefix={<IconSearch />}
              placeholder="搜索会话"
              size="small"
            />
            <Button icon={<IconPlus />} size="small" type="text" onClick={handleSearch} />
          </div>

          <div className={styles.conversationList}>
            {loadingConversations ? (
              <Spin style={{ margin: '20px auto', display: 'block' }} />
            ) : conversations.length === 0 ? (
              <Empty description="暂无会话，去商品页点“联系卖家”试试" />
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.convItem} ${activeConversationId === c.id ? styles.convItemActive : ''}`}
                  onClick={() => setActiveConversationId(c.id)}
                >
                  <div className={styles.avatarWrap}>
                    <Badge count={c.unread} dot={c.unread > 0 && c.unread < 1}>
                      <Avatar
                        size={46}
                        className={styles.convAvatar}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/seller/${c.peerId}`, {
                            state: { fromMessages: true },
                          });
                        }}
                      >
                        {c.name.slice(0, 1)}
                      </Avatar>
                    </Badge>
                    {c.online && <span className={styles.avatarOnlineDot} />}
                  </div>
                  <div className={styles.convMeta}>
                    <div className={styles.convHead}>
                      <Text className={styles.convName}>{c.name}</Text>
                      <Text type="secondary" className={styles.convTime}>
                        {c.time}
                      </Text>
                    </div>
                    <Text type="secondary" className={styles.convPreview}>
                      {c.preview || '暂无消息'}
                    </Text>
                    <Text type="secondary" className={styles.convStatus}>
                      {c.online ? '在线' : c.lastSeenText || '离线'}
                    </Text>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={styles.chatArea}>
          <header className={styles.chatHeader}>
            <Title heading={6} style={{ margin: 0 }}>
              {activeConversation?.name || '消息'}
            </Title>
            <Space size={8}>
              {activeConversation?.online && <span className={styles.onlineDot} />}
              <Text type="secondary">
                {activeConversation?.online ? '在线' : activeConversation?.lastSeenText || '离线'}
              </Text>
              <Avatar size={26} className={styles.headerAvatar}>
                {activeConversation?.name?.slice(0, 1) || '消'}
              </Avatar>
            </Space>
          </header>

          <main className={styles.messageList}>
            {loadingMessages ? (
              <Spin style={{ margin: '28px auto', display: 'block' }} />
            ) : !activeConversation ? (
              <Empty description="暂无会话，去商品页点“联系卖家”试试" />
            ) : activeMessages.length === 0 ? (
              <Empty description="还没有消息，先打个招呼吧" />
            ) : (
              activeMessages.map((m) => (
                <div key={m.id}>
                  <div className={styles.timeCenter}>{m.time}</div>
                  <div className={`${styles.msgRow} ${m.fromMe ? styles.msgMine : ''}`}>
                    {!m.fromMe && (
                      <Avatar
                        size={30}
                        className={styles.msgAvatar}
                        onClick={() =>
                          navigate(`/seller/${activeConversation?.peerId}`, {
                            state: { fromMessages: true },
                          })
                        }
                      >
                        {activeConversation?.name?.slice(0, 1) || '?'}
                      </Avatar>
                    )}
                    <div className={styles.msgBubble}>
                      {m.type === 'image' ? (
                        <img
                          src={m.imageUrl || m.content}
                          alt="发送图片"
                          className={styles.msgImage}
                          onClick={() => setPreviewImage(m.imageUrl || m.content)}
                        />
                      ) : (
                        <div>{m.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </main>

          <footer className={styles.chatFooter}>
            <Input.TextArea
              value={draft}
              onChange={setDraft}
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="输入消息..."
            />
            <div className={styles.sendRow}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void sendPhoto(file);
                  e.currentTarget.value = '';
                }}
              />
              <Button
                type="outline"
                icon={<IconImage />}
                onClick={() => fileInputRef.current?.click()}
                loading={sending}
              >
                发送图片
              </Button>
              <Button
                type="primary"
                icon={<IconSend />}
                onClick={() => void sendMessage()}
                loading={sending}
              >
                发送
              </Button>
            </div>
          </footer>
        </section>
      </div>

      <nav className={styles.bottomNav}>
        <button type="button" className={styles.navItem} onClick={() => navigate('/')}>
          <IconHome />
          <span>主页</span>
        </button>
        <button type="button" className={styles.navItem} onClick={() => navigate('/publish')}>
          <IconUpload />
          <span>上传商品</span>
        </button>
        <button type="button" className={`${styles.navItem} ${styles.navItemActive}`} onClick={() => navigate('/notifications')}>
          <Badge count={unreadTotal} offset={[8, 2]}>
            <IconMessage />
          </Badge>
          <span>消息</span>
        </button>
        <button type="button" className={styles.navItem} onClick={() => navigate('/profile')}>
          <IconUser />
          <span>个人</span>
        </button>
      </nav>

      <Modal
        title="图片预览"
        visible={Boolean(previewImage)}
        footer={null}
        onCancel={() => setPreviewImage(null)}
        style={{ width: 720, maxWidth: '92vw' }}
      >
        {previewImage && (
          <img src={previewImage} alt="预览图" className={styles.previewImage} />
        )}
      </Modal>
    </div>
  );
}