import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function Notification() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>通知中心（开发中）</Title>
      <Paragraph>这里将来是系统通知、交易状态变更等消息列表。</Paragraph>
    </div>
  );
}

