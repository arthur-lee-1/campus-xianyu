# tests/interactions/test_interactions.py
import uuid
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import models
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.interactions.models import Comment, Follow, Favorite
from apps.products.models import Product


def _gen_value_for_field(field, idx=1):
    """
    为不同类型字段生成可用默认值，尽量兼容未知模型字段结构。
    """
    # choices 优先取第一个
    if getattr(field, "choices", None):
        return field.choices[0][0]

    if isinstance(field, models.EmailField):
        return f"u{uuid.uuid4().hex[:8]}@test.com"
    if isinstance(field, (models.CharField, models.TextField, models.SlugField)):
        max_len = getattr(field, "max_length", 64) or 64
        return f"{field.name}_{uuid.uuid4().hex[:8]}"[:max_len]
    if isinstance(field, models.UUIDField):
        return uuid.uuid4()
    if isinstance(field, models.BooleanField):
        return False
    if isinstance(field, models.IntegerField):
        return 1
    if isinstance(field, models.FloatField):
        return 1.23
    if isinstance(field, models.DecimalField):
        return Decimal("9.99")
    if isinstance(field, models.DateTimeField):
        return timezone.now()
    if isinstance(field, models.DateField):
        return timezone.now().date()
    if isinstance(field, models.TimeField):
        return timezone.now().time()
    if isinstance(field, models.JSONField):
        return {"k": "v"}
    if isinstance(field, models.FileField):
        # ImageField 也继承 FileField
        return SimpleUploadedFile(
            "test.jpg",
            b"fake-image-content",
            content_type="image/jpeg",
        )

    return None


def create_instance(model_cls, overrides=None, _depth=0):
    """
    通用创建器：自动填充非空字段，尽量减少对具体模型字段的耦合。
    """
    if _depth > 3:
        raise RuntimeError(f"Model create recursion too deep: {model_cls.__name__}")

    overrides = overrides or {}
    data = {}

    for field in model_cls._meta.fields:
        # 已提供覆盖值
        if field.name in overrides:
            data[field.name] = overrides[field.name]
            continue

        # 跳过主键/自动字段
        if field.primary_key or isinstance(field, models.AutoField) or isinstance(field, models.BigAutoField):
            continue

        # auto_now / auto_now_add 由 Django 维护
        if getattr(field, "auto_now", False) or getattr(field, "auto_now_add", False):
            continue

        # 有默认值可跳过
        if field.has_default():
            continue

        # ForeignKey
        if isinstance(field, models.ForeignKey):
            if field.null:
                data[field.name] = None
            else:
                rel_model = field.remote_field.model
                # 自关联字段（且非空）可能导致递归，这里简单保护
                if rel_model == model_cls:
                    data[field.name] = None
                else:
                    data[field.name] = create_instance(rel_model, _depth=_depth + 1)
            continue

        # 可空字段给 None
        if field.null:
            data[field.name] = None
            continue

        # 其余生成默认值
        val = _gen_value_for_field(field)
        if val is not None:
            data[field.name] = val

    data.update(overrides)
    return model_cls.objects.create(**data)


class InteractionsAPITestCase(TestCase):
    """
    覆盖：
    - 评论：发布、回复校验、删除权限、列表
    - 关注：关注、重复关注幂等、不能关注自己、取消关注、列表
    - 收藏：收藏、重复收藏幂等、取消收藏、列表
    """

    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()

        # 创建两个测试用户
        self.user_a = create_instance(self.User, overrides={"password": "pass123456"})
        self.user_b = create_instance(self.User, overrides={"password": "pass123456"})

        # 创建商品：自动把 Product 中指向 User 的 FK 字段绑定到 user_a
        product_overrides = {}
        for f in Product._meta.fields:
            if isinstance(f, models.ForeignKey) and f.remote_field.model == self.User:
                product_overrides[f.name] = self.user_a

        self.product = create_instance(Product, overrides=product_overrides)

    # ---------- 评论 ----------

    def test_comment_create_requires_auth(self):
        url = reverse("product-comments", kwargs={"product_id": self.product.id})
        resp = self.client.post(url, data={"content": "匿名评论"}, format="json")
        self.assertEqual(resp.status_code, 401)

    def test_comment_create_success(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse("product-comments", kwargs={"product_id": self.product.id})
        resp = self.client.post(url, data={"content": "这件商品还在吗？"}, format="json")
        self.assertEqual(resp.status_code, 201)
        body = resp.json()
        self.assertIn("code", body)
        self.assertIn("message", body)
        self.assertIn("data", body)
        self.assertEqual(Comment.objects.filter(product=self.product, author=self.user_a).count(), 1)

    def test_comment_reply_parent_mismatch_should_fail(self):
        self.client.force_authenticate(user=self.user_a)

        # 新建另一个商品 + 其评论
        product2_overrides = {}
        for f in Product._meta.fields:
            if isinstance(f, models.ForeignKey) and f.remote_field.model == self.User:
                product2_overrides[f.name] = self.user_b
        product2 = create_instance(Product, overrides=product2_overrides)

        parent = Comment.objects.create(
            product=product2,
            author=self.user_b,
            content="我是另一个商品下的评论"
        )

        url = reverse("product-comments", kwargs={"product_id": self.product.id})
        resp = self.client.post(
            url,
            data={"content": "尝试跨商品回复", "parent": parent.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_comment_delete_permission(self):
        comment = Comment.objects.create(
            product=self.product,
            author=self.user_b,
            content="他人评论"
        )

        # 非作者删除 -> 403
        self.client.force_authenticate(user=self.user_a)
        url = reverse("comment-delete", kwargs={"pk": comment.id})
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 403)

        # 作者删除 -> 200
        self.client.force_authenticate(user=self.user_b)
        resp2 = self.client.delete(url)
        self.assertEqual(resp2.status_code, 200)
        self.assertFalse(Comment.objects.filter(id=comment.id).exists())

    def test_comment_list(self):
        Comment.objects.create(product=self.product, author=self.user_a, content="评论1")
        Comment.objects.create(product=self.product, author=self.user_b, content="评论2")

        url = reverse("product-comments", kwargs={"product_id": self.product.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)

        body = resp.json()
        self.assertIn("data", body)
        # 分页结构：count/next/previous/results
        self.assertIn("results", body["data"])
        self.assertEqual(body["data"]["count"], 2)

    # ---------- 关注 ----------

    def test_follow_success_and_idempotent(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse("user-follow", kwargs={"user_id": self.user_b.id})

        # 首次关注
        resp1 = self.client.post(url)
        self.assertEqual(resp1.status_code, 201)
        self.assertEqual(Follow.objects.filter(follower=self.user_a, followed=self.user_b).count(), 1)

        # 重复关注（幂等）
        resp2 = self.client.post(url)
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(Follow.objects.filter(follower=self.user_a, followed=self.user_b).count(), 1)

    def test_follow_self_should_fail(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse("user-follow", kwargs={"user_id": self.user_a.id})
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 400)

    def test_unfollow(self):
        Follow.objects.create(follower=self.user_a, followed=self.user_b)

        self.client.force_authenticate(user=self.user_a)
        url = reverse("user-follow", kwargs={"user_id": self.user_b.id})
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(Follow.objects.filter(follower=self.user_a, followed=self.user_b).exists())

    def test_my_followers_and_following(self):
        Follow.objects.create(follower=self.user_a, followed=self.user_b)

        self.client.force_authenticate(user=self.user_b)
        followers_url = reverse("my-followers")
        resp1 = self.client.get(followers_url)
        self.assertEqual(resp1.status_code, 200)
        self.assertGreaterEqual(resp1.json()["data"]["count"], 1)

        self.client.force_authenticate(user=self.user_a)
        following_url = reverse("my-following")
        resp2 = self.client.get(following_url)
        self.assertEqual(resp2.status_code, 200)
        self.assertGreaterEqual(resp2.json()["data"]["count"], 1)

    # ---------- 收藏 ----------

    def test_favorite_success_and_idempotent(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse("product-favorite", kwargs={"product_id": self.product.id})

        resp1 = self.client.post(url)
        self.assertEqual(resp1.status_code, 201)
        self.assertEqual(Favorite.objects.filter(user=self.user_a, product=self.product).count(), 1)

        resp2 = self.client.post(url)
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(Favorite.objects.filter(user=self.user_a, product=self.product).count(), 1)

    def test_unfavorite(self):
        Favorite.objects.create(user=self.user_a, product=self.product)

        self.client.force_authenticate(user=self.user_a)
        url = reverse("product-favorite", kwargs={"product_id": self.product.id})
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(Favorite.objects.filter(user=self.user_a, product=self.product).exists())

    def test_my_favorites(self):
        Favorite.objects.create(user=self.user_a, product=self.product)

        self.client.force_authenticate(user=self.user_a)
        url = reverse("my-favorites")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)

        body = resp.json()
        self.assertIn("data", body)
        self.assertIn("results", body["data"])
        self.assertGreaterEqual(body["data"]["count"], 1)