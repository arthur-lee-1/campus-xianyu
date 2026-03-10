import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Message,
  Space,
  Tabs,
  Typography,
} from '@arco-design/web-react';
import {
  IconMobile,
  IconWechat,
  IconQq,
  IconLock,
  IconCheckCircle,
  IconSafe,
  IconStorage,
} from '@arco-design/web-react/icon';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { sendLoginCode, loginWithPhoneCode, parseApiError } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import styles from './index.module.css';

const { Title, Text } = Typography;

type LoginLoaderData = {
  /** 从受保护页面跳转过来时带上的回跳地址（例如 / ） */
  redirectTo: string | null;
};

/**
 * 登录页（橙色主题）
 *
 * 设计目标：
 * - “一眼好看”：渐变背景 + 玻璃拟态卡片 + 橙色强调
 * - “交互舒服”：手机号校验、验证码倒计时、清晰的错误提示
 * - “易联调”：所有后端接口调用集中在 `src/api/auth.ts`，这里只负责 UI/状态
 *
 * - 登录成功后写入 token（store + localStorage）
 * - 然后跳转到 redirectTo（默认 /）
 */
export default function Login() {
  const navigate = useNavigate();
  const { redirectTo } = useLoaderData() as LoginLoaderData;
  const setSession = useAuthStore((s) => s.setSession);
  const [activeTab, setActiveTab] = useState<'phone' | 'wechat' | 'qq'>('phone');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Arco 表单实例：便于读取 phone 字段、触发校验等
  const [form] = Form.useForm();

  // 倒计时定时器引用：切页面或卸载时要清理，避免内存泄漏
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (countdown <= 0) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (timerRef.current) return;

    timerRef.current = window.setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [countdown]);

  const goAfterLogin = () => {
    // redirectTo 为空时默认回首页
    navigate(redirectTo || '/', { replace: true });
  };

  const sendCode = async () => {
    // 先校验 phone 字段（避免给后端发无意义请求）
    const phone = form.getFieldValue('phone') as string | undefined;
    if (!phone || !/^1\d{10}$/.test(phone)) {
      Message.warning('请输入正确的手机号');
      return;
    }

    setSending(true);
    try {
      await sendLoginCode(phone);
      Message.success('验证码已发送');
      setCountdown(60);
    } catch (e) {
      // 这里不要直接把 error 对象暴露给用户；后续可按后端错误结构做更细提示
      Message.error(parseApiError(e, '发送失败，请稍后重试'));
    } finally {
      setSending(false);
    }
  };

  const onSubmitPhone = async (values: { phone: string; code: string }) => {
  setSubmitting(true);
  try {
    const data = await loginWithPhoneCode(values.phone, values.code);
    setSession({
      access: data.access,
      refresh: data.refresh,
      user: data.user,
    });

    Message.success('登录成功');
    goAfterLogin();
  } catch (e) {
    Message.error(parseApiError(e, '登录失败，请检查验证码'));
  } finally {
    setSubmitting(false);
  }
};

  const phoneTab = useMemo(
    () => (
      <Form
        form={form}
        layout="vertical"
        onSubmit={onSubmitPhone}
        className={styles.form}
      >
        <Form.Item
          field="phone"
          label="手机号"
          rules={[
            { required: true, message: '请输入手机号' },
            { match: /^1\d{10}$/, message: '手机号格式不正确' },
          ]}
        >
          <Input
            allowClear
            placeholder="请输入 11 位手机号"
            prefix={<IconMobile />}
            maxLength={11}
          />
        </Form.Item>

        {/* 
          ⚠️ 注意：Arco Form 的字段绑定建议让“带 field 的 Form.Item”直接包裹 Input。
          如果外面再包一层 div，有些情况下表单可能拿不到值。
          
          这里采用“双层 Form.Item”：
          - 外层只负责 label 和布局
          - 内层（noStyle）负责 field 绑定与校验，并直接包住 Input
        */}
        <Form.Item label="验证码" required>
          <div className={styles.codeRow}>
            <Form.Item
              field="code"
              noStyle
              rules={[
                { required: true, message: '请输入验证码' },
                { length: 6, message: '验证码为 6 位' },
              ]}
            >
              <Input
                allowClear
                placeholder="请输入 6 位验证码"
                prefix={<IconLock />}
                maxLength={6}
              />
            </Form.Item>
            <Button
              type="secondary"
              className={styles.sendBtn}
              onClick={sendCode}
              loading={sending}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </Button>
          </div>
        </Form.Item>

        <Button
          htmlType="submit"
          type="primary"
          long
          size="large"
          loading={submitting}
        >
          登录并进入首页
        </Button>
      </Form>
    ),
    [countdown, form, sending, submitting],
  );

  const oauthHint = (
    <div className={styles.oauth}>
      <div className={styles.oauthHint}>
        <Text type="secondary">
          这里先放占位 UI，等后端 OAuth 回调地址确定后再接入真实跳转。
        </Text>
      </div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button long disabled className={styles.oauthBtn}>
          功能开发中
        </Button>
        <Button long type="text" onClick={() => navigate('/')}>
          返回首页
        </Button>
      </Space>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.bgDecor1} />
      <div className={styles.bgDecor2} />

      <Card className={styles.card} bordered={false}>
        <div className={styles.cardInner}>
          {/* 左侧：品牌/卖点展示（让卡片更“大”、更有设计感） */}
          <div className={styles.side}>
            <div className={styles.sideTop}>
              <div className={styles.logo}>橙</div>
              <div>
                <Title heading={2} className={styles.title}>
                  校园集市
                </Title>
                <Text className={styles.subTitle}>
                  让二手交易更安心、更高效
                </Text>
              </div>
            </div>

            <div className={styles.sellingPoints}>
              <div className={styles.point}>
                <IconSafe className={styles.pointIcon} />
                <div>
                  <div className={styles.pointTitle}>更安全</div>
                  <div className={styles.pointDesc}>交易流程清晰，评价可追溯</div>
                </div>
              </div>
              <div className={styles.point}>
                <IconStorage className={styles.pointIcon} />
                <div>
                  <div className={styles.pointTitle}>更省心</div>
                  <div className={styles.pointDesc}>各方式一键登录，快速开始</div>
                </div>
              </div>
              <div className={styles.point}>
                <IconCheckCircle className={styles.pointIcon} />
                <div>
                  <div className={styles.pointTitle}>更丝滑</div>
                  <div className={styles.pointDesc}>集市物品一目了然，不再受寻找之苦</div>
                </div>
              </div>
            </div>

            <div className={styles.sideBottom}>
              <Text className={styles.tip}>
                提示：当前接口为 mock，占位方便你们先把 UI/流程跑通。
              </Text>
            </div>
          </div>

          {/* 右侧：真实登录区域（表单/第三方登录 Tab） */}
          <div className={styles.main}>
            <div className={styles.mainHeader}>
              <Title heading={4} className={styles.mainTitle}>
                欢迎登录
              </Title>
              <Text type="secondary">选择一种方式继续</Text>
            </div>

            <Tabs
              activeTab={activeTab}
              onChange={(k) => setActiveTab(k as 'phone' | 'wechat' | 'qq')}
              type="rounded"
              className={styles.tabs}
            >
              <Tabs.TabPane
                key="phone"
                title={
                  <span className={styles.tabTitle}>
                    <IconMobile /> 手机号
                  </span>
                }
              >
                {phoneTab}
              </Tabs.TabPane>
              <Tabs.TabPane
                key="wechat"
                title={
                  <span className={styles.tabTitle}>
                    <IconWechat /> 微信
                  </span>
                }
              >
                {oauthHint}
              </Tabs.TabPane>
              <Tabs.TabPane
                key="qq"
                title={
                  <span className={styles.tabTitle}>
                    <IconQq /> QQ
                  </span>
                }
              >
                {oauthHint}
              </Tabs.TabPane>
            </Tabs>

            <div className={styles.footer}>
              <Text type="secondary">
                登录即表示你同意我们的 <a className={styles.link}>用户协议</a> 与{' '}
                <a className={styles.link}>隐私政策</a>
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

