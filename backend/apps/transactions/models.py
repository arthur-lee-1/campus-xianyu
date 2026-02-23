from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.users.models import User
from apps.products.models import Product


class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "待卖家确认"
        IN_PROGRESS = "in_progress", "交易中"
        COMPLETED = "completed", "已完成"
        CANCELLED = "cancelled", "已取消"

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="transactions")
    buyer = models.ForeignKey(User, on_delete=models.PROTECT, related_name="purchases")
    seller = models.ForeignKey(User, on_delete=models.PROTECT, related_name="sales")
    status = models.CharField("状态", max_length=15, choices=Status.choices, default=Status.PENDING)
    price = models.DecimalField("成交价", max_digits=8, decimal_places=2)
    remark = models.CharField("备注", max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "transactions"
        ordering = ["-created_at"]
        verbose_name = "交易"

    def can_complete(self):
        return self.status == self.Status.IN_PROGRESS

    def can_cancel(self):
        return self.status in (self.Status.PENDING, self.Status.IN_PROGRESS)


class Rating(models.Model):
    """交易双向评分：每笔交易各评一次"""

    class RaterRole(models.TextChoices):
        BUYER = "buyer", "买家评卖家"
        SELLER = "seller", "卖家评买家"

    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name="ratings")
    rater = models.ForeignKey(User, on_delete=models.CASCADE, related_name="given_ratings")
    ratee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_ratings")
    role = models.CharField("评分方", max_length=10, choices=RaterRole.choices)
    score = models.PositiveSmallIntegerField(
        "评分", validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.CharField("评价内容", max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ratings"
        unique_together = ("transaction", "role")  # 每笔交易每个角色只能评一次
        verbose_name = "评分"