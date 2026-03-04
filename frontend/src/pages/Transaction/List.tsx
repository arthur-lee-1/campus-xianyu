import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

export default function TransactionList() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>交易列表（开发中）</Title>
      <Paragraph>这里将来是我参与过的所有交易记录列表。</Paragraph>
    </div>
  );
}

