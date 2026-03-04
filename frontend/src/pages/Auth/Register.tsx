import { Typography } from '@arco-design/web-react';

const { Title, Paragraph } = Typography;

/**
 * 注册页面占位
 *
 * 说明：
 * - 为了和你同学给出的路由清单保持一致，先提供一个简单占位组件。
 * - 后续真正做注册流程时，可以在这里接上表单 / 校验 / 接口调用。
 */
export default function Register() {
  return (
    <div style={{ padding: 24 }}>
      <Title heading={3}>注册页面（开发中）</Title>
      <Paragraph>这里将来是手机号 / 密码 / 验证码等注册流程的 UI。</Paragraph>
    </div>
  );
}

