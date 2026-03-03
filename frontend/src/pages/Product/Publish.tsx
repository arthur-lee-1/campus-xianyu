import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function Publish() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>发布商品（开发中）</Title>
      <Paragraph>这里将来是商品发布表单和图片上传区域。</Paragraph>
    </div>
  );
}

