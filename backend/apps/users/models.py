from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("手机号不能为空")
        user = self.model(phone=phone, **extra_fields)
        user.set_unusable_password()
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        user = self.create_user(phone, password, **extra_fields)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    phone = models.CharField("手机号", max_length=11, unique=True)
    nickname = models.CharField("昵称", max_length=30, blank=True)
    avatar = models.ImageField("头像", upload_to="avatars/", blank=True)
    bio = models.TextField("简介", max_length=200, blank=True)
    school = models.CharField("学校", max_length=50, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField("注册时间", auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        verbose_name = "用户"
        verbose_name_plural = "用户"

    def __str__(self):
        return self.nickname or self.phone

    @property
    def follower_count(self):
        return self.followers.count()

    @property
    def following_count(self):
        return self.following.count()


class ThirdPartyAccount(models.Model):
    """微信 / QQ 第三方账号绑定"""

    PLATFORM_CHOICES = [("wechat", "微信"), ("qq", "QQ")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="third_party_accounts")
    platform = models.CharField("平台", max_length=10, choices=PLATFORM_CHOICES)
    openid = models.CharField("OpenID", max_length=100)
    union_id = models.CharField("UnionID", max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "third_party_accounts"
        unique_together = ("platform", "openid")
        verbose_name = "第三方账号"