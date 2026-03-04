import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function TransactionDetail() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>交易详情（开发中）</Title>
      <Paragraph>这里将来是单笔交易的状态、双方评价等内容。</Paragraph>
    </div>
  );
}

