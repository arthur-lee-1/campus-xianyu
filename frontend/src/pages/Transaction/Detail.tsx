import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Input, Message, Rate, Space, Spin, Typography } from '@arco-design/web-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  cancelTransaction,
  completeTransaction,
  confirmTransaction,
  getTransactionDetail,
  parseTransactionApiError,
  rateTransaction,
  type TransactionItem,
} from '@/api/transactions';

const { Title, Paragraph } = Typography;

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [tx, setTx] = useState<TransactionItem | null>(null);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    let mounted = true;
    const tid = Number(id);
    if (!tid) return;
    setLoading(true);
    setErrorText('');
    getTransactionDetail(tid)
      .then((data) => {
        if (!mounted) return;
        setTx(data);
      })
      .catch((e) => {
        if (!mounted) return;
        setErrorText(parseTransactionApiError(e, '交易详情加载失败'));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const canConfirm = useMemo(() => tx?.status === 'pending', [tx?.status]);
  const canComplete = useMemo(() => tx?.status === 'confirmed', [tx?.status]);
  const canCancel = useMemo(() => tx?.status === 'pending' || tx?.status === 'confirmed', [tx?.status]);
  const canRate = useMemo(() => tx?.status === 'completed', [tx?.status]);

  const refreshDetail = async () => {
    if (!tx) return;
    const latest = await getTransactionDetail(tx.id);
    setTx(latest);
  };

  const runAction = async (fn: () => Promise<unknown>, successText: string) => {
    try {
      setSaving(true);
      await fn();
      Message.success(successText);
      await refreshDetail();
    } catch (e) {
      Message.error(parseTransactionApiError(e, '操作失败，请稍后重试'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>交易详情</Title>
      <Paragraph>可进行确认、完成、取消和评分操作。</Paragraph>
      {loading ? <Spin style={{ margin: '20px auto', display: 'block' }} /> : null}
      {!loading && errorText ? <Empty description={errorText} /> : null}
      {!loading && !errorText && !tx ? <Empty description="未找到交易信息" /> : null}
      {tx ? (
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>交易ID：{tx.id}</div>
            <div>商品ID：{tx.product_id}</div>
            <div>状态：{tx.status}</div>
            <div>价格：￥{Number(tx.price)}</div>
            <div>备注：{tx.remark || '无'}</div>
            <Space wrap>
              <Button
                type="primary"
                disabled={!canConfirm}
                loading={saving}
                onClick={() => runAction(() => confirmTransaction(tx.id), '交易已确认')}
              >
                确认交易
              </Button>
              <Button
                status="success"
                disabled={!canComplete}
                loading={saving}
                onClick={() => runAction(() => completeTransaction(tx.id), '交易已完成')}
              >
                完成交易
              </Button>
              <Button
                status="warning"
                disabled={!canCancel}
                loading={saving}
                onClick={() => runAction(() => cancelTransaction(tx.id, '用户取消'), '交易已取消')}
              >
                取消交易
              </Button>
            </Space>
            {canRate ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>评分</div>
                <Rate value={score} allowHalf onChange={setScore} />
                <Input.TextArea
                  value={comment}
                  onChange={setComment}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  placeholder="写下评价内容（可选）"
                />
                <Button
                  type="outline"
                  loading={saving}
                  onClick={() =>
                    runAction(
                      () => rateTransaction(tx.id, { score, comment: comment.trim() || undefined }),
                      '评分成功',
                    )
                  }
                >
                  提交评分
                </Button>
              </Space>
            ) : null}
          </Space>
        </Card>
      ) : null}
      <Button style={{ marginTop: 12 }} onClick={() => navigate('/transactions')}>
        返回交易列表
      </Button>
    </div>
  );
}

