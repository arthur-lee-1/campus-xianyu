from django.db import models
from django.db.models import Q
from django.utils import timezone
from apps.users.models import User
from apps.products.models import Product


class Comment(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )
    content = models.TextField("内容", max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comments"
        ordering = ["created_at"]
        verbose_name = "评论"
        verbose_name_plural = "评论"


class Follow(models.Model):
    """用户关注"""

    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following"
    )
    followed = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="followers"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "follows"
        verbose_name = "关注"
        verbose_name_plural = "关注"
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "followed"], name="uniq_follow_pair"
            ),
            models.CheckConstraint(
                check=~Q(follower=models.F("followed")), name="no_self_follow"
            ),
        ]


class Favorite(models.Model):
    """商品收藏"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="favorited_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "favorites"
        verbose_name = "收藏"
        verbose_name_plural = "收藏"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"], name="uniq_favorite_pair"
            ),
        ]


class Conversation(models.Model):
    """
    双人会话。
    participant1 / participant2 固定按用户 id 小到大存，避免重复会话。
    product 可为空，表示普通私聊；不为空时表示和某个商品关联的咨询会话。
    """

    participant1 = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="conversations_as_p1"
    )
    participant2 = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="conversations_as_p2"
    )
    product = models.ForeignKey(
        Product,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="conversations",
    )
    last_message = models.CharField(
        "最后一条消息", max_length=500, blank=True, default=""
    )
    last_message_at = models.DateTimeField("最后消息时间", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "conversations"
        ordering = ["-last_message_at", "-id"]
        constraints = [
            models.CheckConstraint(
                check=~Q(participant1=models.F("participant2")),
                name="no_self_conversation",
            ),
            models.UniqueConstraint(
                fields=["participant1", "participant2", "product"],
                name="uniq_conversation_pair_product",
            ),
        ]
        verbose_name = "会话"
        verbose_name_plural = "会话"

    def __str__(self):
        return f"Conversation({self.participant1_id}, {self.participant2_id}, product={self.product_id})"

    @staticmethod
    def normalize_users(user1, user2):
        return (user1, user2) if user1.id < user2.id else (user2, user1)

    def get_other_user(self, current_user):
        if current_user.id == self.participant1_id:
            return self.participant2
        return self.participant1

    def touch_last_message(self, text=""):
        self.last_message = text[:500] if text else self.last_message
        self.last_message_at = timezone.now()
        self.save(update_fields=["last_message", "last_message_at"])


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    content = models.TextField("文本内容", blank=True, default="")
    image = models.ImageField("图片", upload_to="chat/images/", null=True, blank=True)
    read_at = models.DateTimeField("已读时间", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "messages"
        ordering = ["created_at", "id"]
        verbose_name = "消息"
        verbose_name_plural = "消息"

    def __str__(self):
        return f"Message({self.id}, conversation={self.conversation_id}, sender={self.sender_id})"

    @property
    def is_read(self):
        return self.read_at is not None

    def mark_read(self):
        if self.read_at is None:
            self.read_at = timezone.now()
            self.save(update_fields=["read_at"])
