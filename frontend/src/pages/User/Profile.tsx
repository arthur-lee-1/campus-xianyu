import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function Profile() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>个人资料（开发中）</Title>
      <Paragraph>这里将来是头像、昵称、简介等信息编辑。</Paragraph>
    </div>
  );
}

