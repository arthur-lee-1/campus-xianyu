import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function Settings() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>账号设置（开发中）</Title>
      <Paragraph>这里将来是账号安全、通知偏好等设置项。</Paragraph>
    </div>
  );
}

