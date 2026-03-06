from django.db import models
from django.db.models import Q
from apps.users.models import User
from apps.products.models import Product


class Comment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="comments")
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
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    followed = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "follows"
        verbose_name = "关注"
        verbose_name_plural = "关注"
        constraints = [
            models.UniqueConstraint(fields=["follower", "followed"], name="uniq_follow_pair"),
            models.CheckConstraint(check=~Q(follower=models.F("followed")), name="no_self_follow"),
        ]


class Favorite(models.Model):
    """商品收藏"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "favorites"
        verbose_name = "收藏"
        verbose_name_plural = "收藏"
        constraints = [
            models.UniqueConstraint(fields=["user", "product"], name="uniq_favorite_pair"),
        ]