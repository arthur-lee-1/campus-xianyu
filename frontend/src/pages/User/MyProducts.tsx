import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function MyProducts() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>我的商品（开发中）</Title>
      <Paragraph>这里将来是“我发布的商品列表”和下架 / 编辑入口。</Paragraph>
    </div>
  );
}

