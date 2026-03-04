from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    class Category(models.TextChoices):
        SYSTEM = "system", "系统"
        TRANSACTION = "transaction", "交易"
        RATING = "rating", "评分"
        SECURITY = "security", "安全"

    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications", verbose_name="接收者"
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
        verbose_name="发送者",
    )
    category = models.CharField(
        "分类", max_length=20, choices=Category.choices, default=Category.SYSTEM
    )
    title = models.CharField("标题", max_length=100)
    content = models.CharField("内容", max_length=500)
    extra = models.JSONField("扩展信息", default=dict, blank=True)

    is_read = models.BooleanField("是否已读", default=False)
    read_at = models.DateTimeField("已读时间", null=True, blank=True)

    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        verbose_name = "通知"
        verbose_name_plural = "通知"

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])