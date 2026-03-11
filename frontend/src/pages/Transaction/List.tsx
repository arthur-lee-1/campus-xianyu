import { useEffect, useState } from 'react';
import { Button, Card, Empty, Select, Space, Spin, Typography } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';
import {
  getTransactions,
  parseTransactionApiError,
  type TransactionItem,
} from '@/api/transactions';

const { Title, Paragraph } = Typography;

export default function TransactionList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'all' | TransactionItem['status']>('all');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorText('');
    getTransactions(status === 'all' ? undefined : { status })
      .then((list) => {
        if (!mounted) return;
        setItems(list);
      })
      .catch((e) => {
        if (!mounted) return;
        setErrorText(parseTransactionApiError(e, '交易列表加载失败'));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [status]);

  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>交易列表</Title>
      <Paragraph>查看你参与的交易并进入详情继续操作。</Paragraph>
      <Space style={{ marginBottom: 12 }}>
        <span>状态筛选：</span>
        <Select value={status} onChange={(v) => setStatus(v as typeof status)} style={{ width: 180 }}>
          <Select.Option value="all">全部</Select.Option>
          <Select.Option value="pending">待确认</Select.Option>
          <Select.Option value="confirmed">进行中</Select.Option>
          <Select.Option value="completed">已完成</Select.Option>
          <Select.Option value="cancelled">已取消</Select.Option>
        </Select>
      </Space>
      {loading ? <Spin style={{ margin: '20px auto', display: 'block' }} /> : null}
      {errorText ? <Empty description={errorText} /> : null}
      {!loading && !errorText && items.length === 0 ? <Empty description="暂无交易记录" /> : null}
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        {items.map((item) => (
          <Card key={item.id} hoverable onClick={() => navigate(`/transactions/${item.id}`)}>
            <div>交易 #{item.id}</div>
            <div>商品ID：{item.product_id}</div>
            <div>状态：{item.status}</div>
            <div>价格：￥{Number(item.price)}</div>
          </Card>
        ))}
      </Space>
      <Button style={{ marginTop: 12 }} onClick={() => navigate(-1)}>
        返回上一页
      </Button>
    </div>
  );
}

