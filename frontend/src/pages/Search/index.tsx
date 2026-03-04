import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function Search() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>搜索页面（开发中）</Title>
      <Paragraph>这里将来是搜索框 + 结果列表 + 筛选条件。</Paragraph>
    </div>
  );
}

