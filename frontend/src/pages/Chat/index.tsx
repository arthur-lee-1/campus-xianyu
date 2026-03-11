import { Typography } from '@arco-design/web-react';
import { useLocation } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function Chat() {
  const location = useLocation();
  const peerName =
    (location.state as { peerName?: string } | null)?.peerName || '该用户';

  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>聊天页面（开发中）</Title>
      <Paragraph>当前会话对象：{peerName}</Paragraph>
      <Paragraph>这里将来是买家和卖家之间的即时沟通界面。</Paragraph>
    </div>
  );
}

