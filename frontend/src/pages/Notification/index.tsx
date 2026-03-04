import { useMemo, useState } from 'react';
import { Avatar, Badge, Button, Input, Space, Typography } from '@arco-design/web-react';
import {
  IconHome,
  IconUpload,
  IconMessage,
  IconUser,
  IconSearch,
  IconPlus,
  IconSend,
} from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './index.module.css';

const { Text, Title } = Typography;

type Conversation = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  sellerId: number;
  lastSeenText?: string;
};

type Msg = {
  id: string;
  fromMe: boolean;
  content: string;
  time: string;
};

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 'u_1', name: '海大数院同学', preview: '教材还在，今晚可以面交', time: '20:14', unread: 2, online: true, sellerId: 1 },
  { id: 'u_2', name: '鱼山校区卖家', preview: '可以刀一点点', time: '19:32', unread: 0, online: true, sellerId: 2 },
  { id: 'u_3', name: '崂山小王', preview: '谢谢，已确认收货', time: '昨天', unread: 0, online: false, sellerId: 3, lastSeenText: '5分钟前在线' },
  { id: 'u_4', name: '系统通知', preview: '你的商品有新的收藏', time: '周一', unread: 1, online: false, sellerId: 1, lastSeenText: '2小时前在线' },
];

const MOCK_MESSAGES: Record<string, Msg[]> = {
  u_1: [
    { id: 'm1', fromMe: false, content: '你好，线代教材还在吗？', time: '18:54' },
    { id: 'm2', fromMe: true, content: '在的，9成新，支持西海岸校区面交。', time: '18:55' },
    { id: 'm3', fromMe: false, content: '可以，今晚图书馆门口见？', time: '18:57' },
  ],
  u_2: [
    { id: 'm1', fromMe: false, content: '台灯还在售吗？', time: '16:10' },
    { id: 'm2', fromMe: true, content: '在售的，35 可以小刀。', time: '16:13' },
  ],
  u_3: [
    { id: 'm1', fromMe: true, content: '收到没问题的话帮忙给个评价哈～', time: '昨天 20:13' },
    { id: 'm2', fromMe: false, content: '收到啦，感谢！', time: '昨天 20:15' },
  ],
  u_4: [{ id: 'm1', fromMe: false, content: '你的商品《线代教材》新增 1 次收藏。', time: '周一 09:20' }],
};

export default function Notification() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state as { peerName?: string; peerId?: number } | null) ?? null;
  const peerName = incoming?.peerName;
  const peerId = incoming?.peerId;

  const mergedConversations = useMemo(() => {
    if (!peerName && !peerId) return MOCK_CONVERSATIONS;
    const exists = MOCK_CONVERSATIONS.some((c) => c.sellerId === peerId || c.name === peerName);
    if (exists) return MOCK_CONVERSATIONS;
    const nextId = peerId ?? Date.now();
    return [{
      id: `temp_peer_${nextId}`,
      name: peerName || '新商家',
      preview: '开始新的会话',
      time: '刚刚',
      unread: 0,
      online: true,
      sellerId: nextId,
    }, ...MOCK_CONVERSATIONS];
  }, [peerId, peerName]);

  const [activeId, setActiveId] = useState<string>(
    mergedConversations.find((c) => c.sellerId === peerId || c.name === peerName)?.id ?? mergedConversations[0].id,
  );
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Record<string, Msg[]>>({
    ...MOCK_MESSAGES,
    ...(peerId || peerName
      ? {
          [mergedConversations.find((c) => c.sellerId === peerId || c.name === peerName)?.id || 'temp_peer']: [
            { id: 't1', fromMe: false, content: '你好呀～', time: '刚刚' },
          ],
        }
      : {}),
  });

  const activeConversation = mergedConversations.find((c) => c.id === activeId) ?? mergedConversations[0];
  const activeMessages = messages[activeConversation.id] || [];

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages((prev) => ({
      ...prev,
      [activeConversation.id]: [
        ...(prev[activeConversation.id] || []),
        { id: `m_${Date.now()}`, fromMe: true, content: text, time },
      ],
    }));
    setDraft('');
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
            {mergedConversations.map((c) => (
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
              {activeConversation.name}
            </Title>
            <Space size={8}>
              {activeConversation.online && <span className={styles.onlineDot} />}
              <Text type="secondary">
                {activeConversation.online ? '在线' : activeConversation.lastSeenText || '离线'}
              </Text>
              <Avatar size={26} className={styles.headerAvatar}>
                {activeConversation.name.slice(0, 1)}
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
                        navigate(`/seller/${activeConversation.sellerId}`, {
                          state: { fromMessages: true },
                        })
                      }
                    >
                      {activeConversation.name.slice(0, 1)}
                    </Avatar>
                  )}
                  <div className={styles.msgBubble}>
                    <div>{m.content}</div>
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
          <IconMessage />
          <span>消息</span>
        </button>
        <button type="button" className={styles.navItem} onClick={() => navigate('/profile')}>
          <IconUser />
          <span>个人</span>
        </button>
      </nav>
    </div>
  );
}

