from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient

from apps.products.models import Product
from apps.transactions.models import Transaction, Rating


def create_user_flexible(idx: int):
    User = get_user_model()
    password = "Pass123456!"

    # 优先尝试常见 create_user 方式
    attempts = [
        {"phone": f"1380000{idx:04d}", "password": password},
        {"username": f"user_{idx}", "password": password},
        {"email": f"user_{idx}@test.com", "password": password},
    ]
    for kwargs in attempts:
        try:
            return User.objects.create_user(**kwargs)
        except Exception:
            continue

    # 兜底：直接 create + set_password
    data = {}
    for f in User._meta.fields:
        if f.auto_created or isinstance(f, models.AutoField):
            continue
        if f.name in ("password", "last_login", "date_joined"):
            continue
        if f.has_default() or f.null:
            continue
        if isinstance(f, (models.CharField, models.TextField)):
            if f.name == "username":
                data[f.name] = f"user_{idx}"
            elif f.name == "phone":
                data[f.name] = f"1380000{idx:04d}"
            elif f.name == "email":
                data[f.name] = f"user_{idx}@test.com"
            else:
                data[f.name] = f"{f.name}_{idx}"[: max(1, f.max_length or 50)]
        elif isinstance(f, models.BooleanField):
            data[f.name] = False
        elif isinstance(f, models.IntegerField):
            data[f.name] = idx
    user = User.objects.create(**data)
    user.set_password(password)
    user.save()
    return user


def create_product_flexible(seller):
    data = {}

    # 先给常见字段
    if any(f.name == "title" for f in Product._meta.fields):
        data["title"] = "二手教材"
    if any(f.name == "description" for f in Product._meta.fields):
        data["description"] = "九成新"
    if any(f.name == "price" for f in Product._meta.fields):
        data["price"] = Decimal("66.00")

    # 卖家字段兼容
    field_names = {f.name for f in Product._meta.fields}
    if "seller" in field_names:
        data["seller"] = seller
    elif "user" in field_names:
        data["user"] = seller
    elif "owner" in field_names:
        data["owner"] = seller
    elif "publisher" in field_names:
        data["publisher"] = seller

    # 填充其余必填字段
    for f in Product._meta.fields:
        if f.auto_created or isinstance(f, models.AutoField):
            continue
        if f.name in data:
            continue
        if f.has_default() or f.null:
            continue
        if getattr(f, "auto_now", False) or getattr(f, "auto_now_add", False):
            continue

        if isinstance(f, (models.CharField, models.TextField)):
            data[f.name] = "x"[: max(1, f.max_length or 1)]
        elif isinstance(f, models.DecimalField):
            data[f.name] = Decimal("1.00")
        elif isinstance(f, models.IntegerField):
            data[f.name] = 1
        elif isinstance(f, models.BooleanField):
            data[f.name] = False
        elif isinstance(f, (models.ForeignKey, models.OneToOneField)):
            rel_model = f.remote_field.model
            if rel_model == get_user_model():
                data[f.name] = seller
            else:
                # 对非 User 关联，尝试创建一个最小实例
                rel_data = {}
                for rf in rel_model._meta.fields:
                    if rf.auto_created or isinstance(rf, models.AutoField):
                        continue
                    if rf.has_default() or rf.null:
                        continue
                    if isinstance(rf, (models.CharField, models.TextField)):
                        rel_data[rf.name] = "x"[: max(1, rf.max_length or 1)]
                    elif isinstance(rf, models.IntegerField):
                        rel_data[rf.name] = 1
                    elif isinstance(rf, models.BooleanField):
                        rel_data[rf.name] = False
                data[f.name] = rel_model.objects.create(**rel_data)

    return Product.objects.create(**data)


class TransactionFlowTests(APITestCase):
    def setUp(self):
        self.buyer = create_user_flexible(1)
        self.seller = create_user_flexible(2)
        self.product = create_product_flexible(self.seller)

        self.buyer_client = APIClient()
        self.buyer_client.force_authenticate(self.buyer)

        self.seller_client = APIClient()
        self.seller_client.force_authenticate(self.seller)

    def test_create_confirm_complete_rate_flow(self):
        # 1) 买家创建交易
        resp = self.buyer_client.post(
            "/api/transactions/",
            {"product_id": self.product.id, "price": "66.00", "remark": "明天面交"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        tx_id = resp.data["data"]["id"]

        # 2) 卖家确认
        resp = self.seller_client.post(f"/api/transactions/{tx_id}/confirm/")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["data"]["status"], Transaction.Status.IN_PROGRESS)

        # 3) 买家完成
        resp = self.buyer_client.post(f"/api/transactions/{tx_id}/complete/")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["data"]["status"], Transaction.Status.COMPLETED)

        # 4) 买家评分（评卖家）
        resp = self.buyer_client.post(
            f"/api/transactions/{tx_id}/rate/",
            {"score": 5, "comment": "很好"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)

        # 5) 同角色重复评分应失败
        resp = self.buyer_client.post(
            f"/api/transactions/{tx_id}/rate/",
            {"score": 4, "comment": "重复"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.data)

        # 6) 卖家也可评分（评买家）
        resp = self.seller_client.post(
            f"/api/transactions/{tx_id}/rate/",
            {"score": 5, "comment": "守时"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)

        self.assertEqual(Rating.objects.filter(transaction_id=tx_id).count(), 2)

    def test_only_seller_can_confirm(self):
        # 先创建
        resp = self.buyer_client.post(
            "/api/transactions/",
            {"product_id": self.product.id, "price": "66.00"},
            format="json",
        )
        tx_id = resp.data["data"]["id"]

        # 买家确认应失败
        resp = self.buyer_client.post(f"/api/transactions/{tx_id}/confirm/")
        self.assertEqual(resp.status_code, 403, resp.data)

    def test_participant_can_cancel_when_pending(self):
        resp = self.buyer_client.post(
            "/api/transactions/",
            {"product_id": self.product.id, "price": "66.00"},
            format="json",
        )
        tx_id = resp.data["data"]["id"]

        resp = self.seller_client.post(f"/api/transactions/{tx_id}/cancel/")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["data"]["status"], Transaction.Status.CANCELLED)

    def test_non_participant_cannot_access_transaction(self):
        other = create_user_flexible(3)
        other_client = APIClient()
        other_client.force_authenticate(other)

        resp = self.buyer_client.post(
            "/api/transactions/",
            {"product_id": self.product.id, "price": "66.00"},
            format="json",
        )
        tx_id = resp.data["data"]["id"]

        # get_object 基于 queryset 限制，应 404
        resp = other_client.get(f"/api/transactions/{tx_id}/")
        self.assertEqual(resp.status_code, 404, resp.data)

        def test_cannot_create_transaction_for_off_shelf_product(self):
            self.product.status = Product.Status.OFF_SHELF
            self.product.save(update_fields=["status"])

            resp = self.buyer_client.post(
                "/api/transactions/",
                {"product_id": self.product.id, "price": "66.00"},
                format="json",
            )
            self.assertEqual(resp.status_code, 400, resp.data)

        def test_cannot_create_transaction_for_sold_product(self):
            self.product.status = Product.Status.SOLD
            self.product.save(update_fields=["status"])

            resp = self.buyer_client.post(
                "/api/transactions/",
                {"product_id": self.product.id, "price": "66.00"},
                format="json",
            )
            self.assertEqual(resp.status_code, 400, resp.data)

        def test_cannot_create_second_active_transaction_for_same_product(self):
            resp1 = self.buyer_client.post(
                "/api/transactions/",
                {"product_id": self.product.id, "price": "66.00"},
                format="json",
            )
            self.assertEqual(resp1.status_code, 201, resp1.data)

            other_buyer = create_user_flexible(4)
            other_client = APIClient()
            other_client.force_authenticate(other_buyer)

            resp2 = other_client.post(
                "/api/transactions/",
                {"product_id": self.product.id, "price": "66.00"},
                format="json",
            )
            self.assertEqual(resp2.status_code, 400, resp2.data)

        def test_complete_transaction_marks_product_sold(self):
            resp = self.buyer_client.post(
                "/api/transactions/",
                {"product_id": self.product.id, "price": "66.00"},
                format="json",
            )
            self.assertEqual(resp.status_code, 201, resp.data)
            tx_id = resp.data["data"]["id"]

            resp = self.seller_client.post(f"/api/transactions/{tx_id}/confirm/")
            self.assertEqual(resp.status_code, 200, resp.data)

            resp = self.buyer_client.post(f"/api/transactions/{tx_id}/complete/")
            self.assertEqual(resp.status_code, 200, resp.data)

            self.product.refresh_from_db()
            self.assertEqual(self.product.status, Product.Status.SOLD)

            tx = Transaction.objects.get(pk=tx_id)
            self.assertEqual(tx.status, Transaction.Status.COMPLETED)
            self.assertIsNotNone(tx.completed_at)

        def test_cancelled_transaction_cannot_be_completed(self):
            resp = self.buyer_client.post(
                "/api/transactions/",
                {"product_id": self.product.id, "price": "66.00"},
                format="json",
            )
            tx_id = resp.data["data"]["id"]

            resp = self.seller_client.post(f"/api/transactions/{tx_id}/cancel/")
            self.assertEqual(resp.status_code, 200, resp.data)

            resp = self.buyer_client.post(f"/api/transactions/{tx_id}/complete/")
            self.assertEqual(resp.status_code, 400, resp.data)

        def test_completed_transaction_cannot_be_cancelled(self):
            resp = self.buyer_client.post(
                "/api/transactions/",
                {"product_id": self.product.id, "price": "66.00"},
                format="json",
            )
            tx_id = resp.data["data"]["id"]

            resp = self.seller_client.post(f"/api/transactions/{tx_id}/confirm/")
            self.assertEqual(resp.status_code, 200, resp.data)

            resp = self.buyer_client.post(f"/api/transactions/{tx_id}/complete/")
            self.assertEqual(resp.status_code, 200, resp.data)

            resp = self.seller_client.post(f"/api/transactions/{tx_id}/cancel/")
            self.assertEqual(resp.status_code, 400, resp.data)

        def test_confirm_sets_confirmed_at(self):
            resp = self.buyer_client.post(
                "/api/transactions/",
                {"product_id": self.product.id, "price": "66.00"},
                format="json",
            )
            tx_id = resp.data["data"]["id"]

            resp = self.seller_client.post(f"/api/transactions/{tx_id}/confirm/")
            self.assertEqual(resp.status_code, 200, resp.data)

            tx = Transaction.objects.get(pk=tx_id)
            self.assertEqual(tx.status, Transaction.Status.IN_PROGRESS)
            self.assertIsNotNone(tx.confirmed_at)

        def test_cancel_sets_cancel_reason_and_cancelled_at(self):
            resp = self.buyer_client.post(
                "/api/transactions/",
                {"product_id": self.product.id, "price": "66.00"},
                format="json",
            )
            tx_id = resp.data["data"]["id"]

            resp = self.buyer_client.post(
                f"/api/transactions/{tx_id}/cancel/",
                {"cancel_reason": "不想要了"},
                format="json",
            )
            self.assertEqual(resp.status_code, 200, resp.data)

            tx = Transaction.objects.get(pk=tx_id)
            self.assertEqual(tx.status, Transaction.Status.CANCELLED)
            self.assertEqual(tx.cancel_reason, "不想要了")
            self.assertIsNotNone(tx.cancelled_at)