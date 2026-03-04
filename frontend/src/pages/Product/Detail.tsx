import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function ProductDetail() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>商品详情（开发中）</Title>
      <Paragraph>这里将来是商品信息、图片轮播、卖家信息等内容。</Paragraph>
    </div>
  );
}

