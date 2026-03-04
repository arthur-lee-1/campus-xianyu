import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function Chat() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>聊天页面（开发中）</Title>
      <Paragraph>这里将来是买家和卖家之间的即时沟通界面。</Paragraph>
    </div>
  );
}

