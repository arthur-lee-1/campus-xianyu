import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Badge, Button, Input, Modal, Space, Typography } from '@arco-design/web-react';
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
  const getOrCreateConversation = useMessageStore((s) => s.getOrCreateConversation);
  const setActiveConversationRead = useMessageStore((s) => s.setActiveConversationRead);
  const sendTextMessage = useMessageStore((s) => s.sendTextMessage);
  const sendImageMessage = useMessageStore((s) => s.sendImageMessage);
  const unreadTotal = useTotalUnreadCount();
  const incoming = (location.state as { peerName?: string; peerId?: number } | null) ?? null;
  const peerName = incoming?.peerName;
  const peerId = incoming?.peerId;
  const [activeId, setActiveId] = useState<string>(conversations[0]?.id ?? '');
  const [draft, setDraft] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );
  const activeMessages = activeConversation ? messagesByConversation[activeConversation.id] || [] : [];

  useEffect(() => {
    if (!peerId) return;
    const id = getOrCreateConversation(peerId, peerName || '新商家');
    setActiveId(id);
  }, [getOrCreateConversation, peerId, peerName]);

  useEffect(() => {
    if (!activeConversation || activeConversation.unread <= 0) return;
    setActiveConversationRead(activeConversation.id);
  }, [activeConversation, setActiveConversationRead]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !activeConversation) return;
    sendTextMessage(activeConversation.id, text, true);
    setDraft('');
  };

  const sendPhoto = (file?: File) => {
    if (!file || !activeConversation) return;
    const url = URL.createObjectURL(file);
    sendImageMessage(activeConversation.id, url, true);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.mainPanel}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <Input prefix={<IconSearch />} placeholder="搜索会话" size="small" />
            <Button icon={<IconPlus />} size="small" type="text" />
          </div>

          <div className={styles.conversationList}>
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.convItem} ${activeId === c.id ? styles.convItemActive : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <div className={styles.avatarWrap}>
                  <Badge count={c.unread} dot={c.unread > 0 && c.unread < 1}>
                    <Avatar
                      size={46}
                      className={styles.convAvatar}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/seller/${c.sellerId}`, {
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
                    {c.preview}
                  </Text>
                  <Text type="secondary" className={styles.convStatus}>
                    {c.online ? '在线' : c.lastSeenText || '离线'}
                  </Text>
                </div>
              </button>
            ))}
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
            {activeMessages.map((m) => (
              <div key={m.id}>
                {/* 微信风格：时间放在消息上方中间 */}
                <div className={styles.timeCenter}>{m.time}</div>
                <div className={`${styles.msgRow} ${m.fromMe ? styles.msgMine : ''}`}>
                  {!m.fromMe && (
                    <Avatar
                      size={30}
                      className={styles.msgAvatar}
                      onClick={() =>
                        navigate(`/seller/${activeConversation?.sellerId}`, {
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
                        src={m.content}
                        alt="发送图片"
                        className={styles.msgImage}
                        onClick={() => setPreviewImage(m.content)}
                      />
                    ) : (
                      <div>{m.content}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                  sendPhoto(file);
                  e.currentTarget.value = '';
                }}
              />
              <Button type="outline" icon={<IconImage />} onClick={() => fileInputRef.current?.click()}>
                发送图片
              </Button>
              <Button type="primary" icon={<IconSend />} onClick={sendMessage}>
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

