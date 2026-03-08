import { useRef, useState } from 'react';
import { Avatar, Button, Card, Input, Space, Typography } from '@arco-design/web-react';
import { IconUser } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { useUserProfileStore } from '@/store/userProfile';
import styles from './Settings.module.css';

const { Title, Text } = Typography;

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nickname = useUserProfileStore((s) => s.nickname);
  const bio = useUserProfileStore((s) => s.bio);
  const avatarUrl = useUserProfileStore((s) => s.avatarUrl);
  const setProfile = useUserProfileStore((s) => s.setProfile);

  const [nextNickname, setNextNickname] = useState(nickname);
  const [nextBio, setNextBio] = useState(bio);
  const [nextAvatarUrl, setNextAvatarUrl] = useState<string | null>(avatarUrl);

  const handleSelectAvatar = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNextAvatarUrl(url);
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const handleSubmit = () => {
    setProfile({
      nickname: nextNickname.trim() || nickname,
      bio: nextBio.trim() || '这个人很神秘，什么都没留下',
      avatarUrl: nextAvatarUrl,
    });
    navigate('/profile');
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
            <Button className={styles.primaryBtn} type="primary" size="large" onClick={handleSubmit}>
              完成
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}

