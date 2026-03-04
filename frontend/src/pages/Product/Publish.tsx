<<<<<<< Updated upstream
=======
import { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Grid,
  Input,
  Message,
  Select,
  Space,
  Upload,
  Typography,
} from '@arco-design/web-react';
import { IconPlus, IconUpload, IconHome, IconMessage, IconUser } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import styles from './Publish.module.css';

const { Title, Paragraph, Text } = Typography;
const Row = Grid.Row;
const Col = Grid.Col;

type Campus = 'xihai' | 'laoshan' | 'yushan';

type FormValues = {
  title: string;
  price: number | string;
  campus: Campus;
  category: string;
  condition: 'new' | 'nine' | 'eight' | 'other';
  description?: string;
  images: any[]; // 后面接 OSS 时再细化类型
};

/**
 * 发布商品页面
 *
 * 对齐 README 里的“发布商品”功能：
 * - 多图上传（Upload picture-card，占位，后续接 OSS）
 * - 分类（category）
 * - 定价（price）
 * - 新旧程度标注（condition）
 */
export default function Publish() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      // TODO: 在这里调用后端“发布商品”接口
      // 例如：await http.post('/api/products/', payload)
      await new Promise((r) => setTimeout(r, 800));

      Message.success('发布成功，可在“我的商品”中查看');
      // 发布成功后保持在当前页，顺便清空表单，方便继续发布下一件
      form.resetFields();
    } catch (e) {
      Message.error('发布失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <Row justify="center">
          <Col xs={24} sm={22} md={18} lg={14} xl={12}>
            <Card
              bordered={false}
              style={{ borderRadius: 18, boxShadow: '0 14px 45px rgba(0,0,0,0.06)' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div>
                  <Title heading={4} style={{ marginBottom: 4 }}>
                    发布商品
                  </Title>
                  <Paragraph style={{ marginBottom: 0 }} type="secondary">
                    请尽量填写详细信息，方便同学快速了解你的宝贝~
                  </Paragraph>
                </div>

                <Form<FormValues>
                  form={form}
                  layout="vertical"
                  initialValues={{
                    campus: 'xihai',
                    condition: 'nine',
                    images: [],
                  }}
                  onSubmit={handleSubmit}
                >
                {/* 标题 + 价格 */}
                <Row gutter={12}>
                  <Col xs={24} sm={16}>
                    <Form.Item
                      field="title"
                      label="商品标题"
                      rules={[{ required: true, message: '请输入商品标题' }]}
                    >
                      <Input
                        maxLength={40}
                        showWordLimit
                        placeholder="例如：高等数学Ⅰ"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      field="price"
                      label="价格"
                      rules={[
                        { required: true, message: '请输入价格' },
                        {
                          validator(_, value) {
                            if (value === undefined || value === null || value === null) {
                              return '';
                            }
                            if (Number.isNaN(Number(value)) || Number(value) <= 0) {
                              return '请输入大于 0 的数字';
                            }
                            return '';
                          },
                        },
                      ]}
                    >
                      <Input placeholder="例如：5" addBefore="￥" maxLength={6} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 校区 + 分类 */}
                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      field="campus"
                      label="所在校区"
                      rules={[{ required: true, message: '请选择校区' }]}
                    >
                      <Select placeholder="请选择校区">
                        <Select.Option value="xihai">西海岸校区</Select.Option>
                        <Select.Option value="laoshan">崂山校区</Select.Option>
                        <Select.Option value="yushan">鱼山校区</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      field="category"
                      label="商品分类"
                      rules={[{ required: true, message: '请选择分类' }]}
                    >
                      <Select placeholder="请选择分类">
                        <Select.Option value="book">教材 / 书籍</Select.Option>
                        <Select.Option value="digital">数码 / 电器</Select.Option>
                        <Select.Option value="furniture">宿舍家具</Select.Option>
                        <Select.Option value="sport">运动用品</Select.Option>
                        <Select.Option value="other">其他</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* 新旧程度 */}
                <Form.Item
                  field="condition"
                  label="新旧程度"
                  rules={[{ required: true, message: '请选择新旧程度' }]}
                >
                  <Select placeholder="请选择新旧程度">
                    <Select.Option value="new">全新</Select.Option>
                    <Select.Option value="nine_half">9.5成新</Select.Option>
                    <Select.Option value="nine">9成新</Select.Option>
                    <Select.Option value="eight">8成新</Select.Option>
                    <Select.Option value="seven">7成新</Select.Option>
                    <Select.Option value="five">5成新</Select.Option>
                   <Select.Option value="other">其他</Select.Option>
                  </Select>
                </Form.Item>

                {/* 描述 */}
                <Form.Item field="description" label="商品描述">
                  <Input.TextArea
                    maxLength={300}
                    showWordLimit
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="可以写清楚新旧程度、交易地点等信息～"
                  />
                </Form.Item>

                {/* 多图上传（占位实现） */}
                <Form.Item
                  field="images"
                  label="商品图片"
                  triggerPropName="fileList"
                >
                  <Upload
                    listType="picture-card"
                    multiple
                    limit={9}
                    action="/" // TODO: 替换为后端上传 / OSS 直传地址
                  >
                    <div style={{ textAlign: 'center' }}>
                      <IconPlus />
                      <div style={{ marginTop: 4 }}>上传</div>
                    </div>
                  </Upload>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    建议上传 1~9 张清晰图片，支持多图上传，后续会接入 OSS 直传。
                  </Text>
                </Form.Item>

                  {/* 按钮区 */}
                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        icon={<IconUpload />}
                        htmlType="submit"
                        loading={submitting}
                      >
                        发布商品
                      </Button>
                      <Button onClick={handleReset}>清空表单</Button>
                      <Button type="text" onClick={() => navigate(-1)}>
                        返回上一页
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      <nav className={styles.bottomNav}>
        <button
          type="button"
          className={styles.navItem}
          onClick={() => navigate('/')}
        >
          <IconHome />
          <span>主页</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${styles.navItemActive}`}
          onClick={() => navigate('/publish')}
        >
          <IconUpload />
          <span>上传商品</span>
        </button>
        <button
          type="button"
          className={styles.navItem}
          onClick={() => navigate('/notifications')}
        >
          <IconMessage />
          <span>消息</span>
        </button>
        <button
          type="button"
          className={styles.navItem}
          onClick={() => navigate('/profile')}
        >
          <IconUser />
          <span>个人</span>
        </button>
      </nav>
    </div>
  );
}
>>>>>>> Stashed changes
