import { useRef, useState } from 'react';
import { Avatar, Button, Card, Input, Message, Space, Typography } from '@arco-design/web-react';
import { IconUser } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { patchMe, parseUserApiError } from '@/api/users';
import { useAuthStore } from '@/store/auth';
import styles from './Settings.module.css';

const { Title, Text } = Typography;

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setSession = useAuthStore((s) => s.setSession);

  const [nextNickname, setNextNickname] = useState(user?.nickname || '');
  const [nextBio, setNextBio] = useState(user?.bio || '');
  const [nextAvatarUrl, setNextAvatarUrl] = useState<string | null>(user?.avatar || null);
  const [nextAvatarFile, setNextAvatarFile] = useState<File | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const handleSelectAvatar = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNextAvatarUrl(url);
    setNextAvatarFile(file);
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const updated = await patchMe({
        nickname: nextNickname.trim(),
        bio: nextBio.trim(),
        avatarFile: nextAvatarFile,
      });
      if (accessToken) {
        setSession({
          access: accessToken,
          refresh: refreshToken || undefined,
          user: updated,
        });
      }
      navigate('/profile');
    } catch (e) {
      Message.error(parseUserApiError(e, '资料更新失败，请稍后重试'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Card bordered={false} className={styles.panel}>
        <div className={styles.header}>
          <Title heading={4} className={styles.title}>
            编辑资料
          </Title>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>个人头像</div>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar size={72} className={styles.avatar}>
              {nextAvatarUrl ? (
                <img src={nextAvatarUrl} alt="头像预览" className={styles.avatarImage} />
              ) : (
                <IconUser />
              )}
            </Avatar>
          </button>
          <Text className={styles.hint}>点击头像可更换</Text>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={(e) => {
              handleSelectAvatar(e.target.files?.[0]);
              e.currentTarget.value = '';
            }}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.label}>个人昵称</div>
          <Input
            maxLength={12}
            showWordLimit
            value={nextNickname}
            onChange={setNextNickname}
            className={styles.input}
            placeholder="请输入个人昵称"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.label}>个人签名</div>
          <Input
            maxLength={30}
            showWordLimit
            value={nextBio}
            onChange={setNextBio}
            className={styles.input}
            placeholder="请输入个人签名"
          />
        </div>

        <div className={styles.buttonRow}>
          <Space size={28}>
            <Button className={styles.ghostBtn} size="large" onClick={handleCancel}>
              取消
            </Button>
            <Button
              className={styles.primaryBtn}
              type="primary"
              size="large"
              loading={submitting}
              onClick={handleSubmit}
            >
              完成
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}

