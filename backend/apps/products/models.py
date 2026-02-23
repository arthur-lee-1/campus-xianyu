from django.db import models
from apps.users.models import User


class Category(models.Model):
    name = models.CharField("分类名", max_length=30)
    icon = models.CharField("图标", max_length=50, blank=True)
    sort_order = models.PositiveSmallIntegerField("排序", default=0)

    class Meta:
        db_table = "categories"
        ordering = ["sort_order"]
        verbose_name = "分类"


class Product(models.Model):
    class Status(models.TextChoices):
        ON_SALE = "on_sale", "在售"
        SOLD = "sold", "已售"
        OFF_SHELF = "off_shelf", "已下架"

    class Condition(models.TextChoices):
        LIKE_NEW = "like_new", "几乎全新"
        GOOD = "good", "成色良好"
        FAIR = "fair", "有使用痕迹"
        POOR = "poor", "明显磨损"

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")

    title = models.CharField("标题", max_length=60)
    description = models.TextField("描述", max_length=1000)
    price = models.DecimalField("价格", max_digits=8, decimal_places=2)
    original_price = models.DecimalField("原价", max_digits=8, decimal_places=2, null=True, blank=True)
    condition = models.CharField("新旧程度", max_length=10, choices=Condition.choices, default=Condition.GOOD)
    status = models.CharField("状态", max_length=10, choices=Status.choices, default=Status.ON_SALE)

    view_count = models.PositiveIntegerField("浏览量", default=0)
    like_count = models.PositiveIntegerField("点赞数", default=0)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["category", "-created_at"]),
            models.Index(fields=["seller"]),
            models.Index(fields=["status"]),
        ]
        verbose_name = "商品"

    def __str__(self):
        return self.title


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField("图片", upload_to="products/%Y/%m/")
    sort_order = models.PositiveSmallIntegerField("排序", default=0)

    class Meta:
        db_table = "product_images"
        ordering = ["sort_order"]