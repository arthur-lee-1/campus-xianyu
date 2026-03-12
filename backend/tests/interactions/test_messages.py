from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient

from apps.products.models import Product
from apps.interactions.models import Conversation, Message


def create_user_flexible(idx: int):
    User = get_user_model()
    password = "Pass123456!"

    attempts = [
        {"phone": f"1370000{idx:04d}", "password": password},
        {"username": f"user_{idx}", "password": password},
        {"email": f"user_{idx}@test.com", "password": password},
    ]
    for kwargs in attempts:
        try:
            return User.objects.create_user(**kwargs)
        except Exception:
            continue

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
                data[f.name] = f"1370000{idx:04d}"
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
    field_names = {f.name for f in Product._meta.fields}

    if "title" in field_names:
        data["title"] = "线代教材"
    if "description" in field_names:
        data["description"] = "九成新"
    if "price" in field_names:
        data["price"] = Decimal("20.00")

    if "seller" in field_names:
        data["seller"] = seller
    elif "user" in field_names:
        data["user"] = seller
    elif "owner" in field_names:
        data["owner"] = seller
    elif "publisher" in field_names:
        data["publisher"] = seller

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

    return Product.objects.create(**data)


class PrivateMessageTests(APITestCase):
    def setUp(self):
        self.u1 = create_user_flexible(1)
        self.u2 = create_user_flexible(2)
        self.u3 = create_user_flexible(3)
        self.product = create_product_flexible(self.u2)

        self.c1 = APIClient()
        self.c1.force_authenticate(self.u1)

        self.c2 = APIClient()
        self.c2.force_authenticate(self.u2)

        self.c3 = APIClient()
        self.c3.force_authenticate(self.u3)

    def _results(self, resp):
        data = resp.data["data"]
        if isinstance(data, dict) and "results" in data:
            return data["results"]
        return data

    def test_ensure_conversation_and_send_message(self):
        resp = self.c1.post(
            "/api/interactions/conversations/ensure/",
            {"user_id": self.u2.id, "product_id": self.product.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        conversation_id = resp.data["data"]["id"]

        self.assertTrue(Conversation.objects.filter(id=conversation_id).exists())

        resp = self.c1.post(
            f"/api/interactions/conversations/{conversation_id}/messages/",
            {"content": "你好，线代教材还在吗？"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(
            Message.objects.filter(conversation_id=conversation_id).count(), 1
        )

    def test_ensure_same_conversation_not_duplicate(self):
        resp1 = self.c1.post(
            "/api/interactions/conversations/ensure/",
            {"user_id": self.u2.id, "product_id": self.product.id},
            format="json",
        )
        resp2 = self.c1.post(
            "/api/interactions/conversations/ensure/",
            {"user_id": self.u2.id, "product_id": self.product.id},
            format="json",
        )
        self.assertEqual(resp1.status_code, 200, resp1.data)
        self.assertEqual(resp2.status_code, 200, resp2.data)
        self.assertEqual(resp1.data["data"]["id"], resp2.data["data"]["id"])

    def test_conversation_list_only_mine(self):
        resp = self.c1.post(
            "/api/interactions/conversations/ensure/",
            {"user_id": self.u2.id},
            format="json",
        )
        conversation_id = resp.data["data"]["id"]

        self.c1.post(
            f"/api/interactions/conversations/{conversation_id}/messages/",
            {"content": "你好"},
            format="json",
        )

        resp = self.c1.get("/api/interactions/conversations/")
        self.assertEqual(resp.status_code, 200, resp.data)
        items = self._results(resp)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["other_user_id"], self.u2.id)

    def test_message_read_flow(self):
        resp = self.c1.post(
            "/api/interactions/conversations/ensure/",
            {"user_id": self.u2.id},
            format="json",
        )
        conversation_id = resp.data["data"]["id"]

        self.c1.post(
            f"/api/interactions/conversations/{conversation_id}/messages/",
            {"content": "你好，教材还在吗"},
            format="json",
        )

        unread_resp = self.c2.get("/api/interactions/messages/unread_count/")
        self.assertEqual(unread_resp.status_code, 200, unread_resp.data)
        self.assertEqual(unread_resp.data["data"]["unread_count"], 1)

        read_resp = self.c2.post(
            f"/api/interactions/conversations/{conversation_id}/read/"
        )
        self.assertEqual(read_resp.status_code, 200, read_resp.data)
        self.assertEqual(read_resp.data["data"]["updated"], 1)

        unread_resp = self.c2.get("/api/interactions/messages/unread_count/")
        self.assertEqual(unread_resp.status_code, 200, unread_resp.data)
        self.assertEqual(unread_resp.data["data"]["unread_count"], 0)

    def test_non_participant_cannot_view_messages(self):
        resp = self.c1.post(
            "/api/interactions/conversations/ensure/",
            {"user_id": self.u2.id},
            format="json",
        )
        conversation_id = resp.data["data"]["id"]

        resp = self.c3.get(
            f"/api/interactions/conversations/{conversation_id}/messages/"
        )
        self.assertEqual(resp.status_code, 404, resp.data)
