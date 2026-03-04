from django.db import models
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient

from apps.notifications.models import Notification


def create_user_flexible(idx: int):
    User = get_user_model()
    password = "Pass123456!"

    attempts = [
        {"phone": f"1390000{idx:04d}", "password": password},
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
                data[f.name] = f"1390000{idx:04d}"
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


class NotificationTests(APITestCase):
    def setUp(self):
        self.u1 = create_user_flexible(1)
        self.u2 = create_user_flexible(2)

        self.c1 = APIClient()
        self.c1.force_authenticate(self.u1)

        self.c2 = APIClient()
        self.c2.force_authenticate(self.u2)

        Notification.objects.create(
            recipient=self.u1,
            category=Notification.Category.SYSTEM,
            title="系统公告",
            content="欢迎使用",
        )
        Notification.objects.create(
            recipient=self.u1,
            category=Notification.Category.TRANSACTION,
            title="交易提醒",
            content="有人下单了",
        )
        Notification.objects.create(
            recipient=self.u2,
            category=Notification.Category.SYSTEM,
            title="仅u2可见",
            content="hello",
        )

    def _items(self, resp):
        """
        兼容两种返回：
        - 非分页: data = [...]
        - 分页:   data = {"count":..., "next":..., "previous":..., "results":[...]}
        """
        data = resp.data["data"]
        if isinstance(data, dict) and "results" in data:
            return data["results"]
        return data

    def test_list_only_mine(self):
        resp = self.c1.get("/api/notifications/")
        self.assertEqual(resp.status_code, 200, resp.data)
        items = self._items(resp)
        self.assertEqual(len(items), 2)
        ids = [x["recipient_id"] for x in items]
        self.assertTrue(all(i == self.u1.id for i in ids))

    def test_unread_count(self):
        resp = self.c1.get("/api/notifications/unread_count/")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["data"]["unread_count"], 2)

    def test_mark_read(self):
        n = Notification.objects.filter(recipient=self.u1, is_read=False).first()
        resp = self.c1.post(f"/api/notifications/{n.id}/read/")
        self.assertEqual(resp.status_code, 200, resp.data)
        n.refresh_from_db()
        self.assertTrue(n.is_read)
        self.assertIsNotNone(n.read_at)

    def test_mark_all_read(self):
        resp = self.c1.post("/api/notifications/mark_all_read/")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["data"]["updated"], 2)
        self.assertEqual(
            Notification.objects.filter(recipient=self.u1, is_read=False).count(), 0
        )

    def test_filter_by_is_read_and_category(self):
        n = Notification.objects.filter(recipient=self.u1).first()
        self.c1.post(f"/api/notifications/{n.id}/read/")

        resp = self.c1.get("/api/notifications/?is_read=true")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(len(self._items(resp)), 1)

        resp = self.c1.get(
            f"/api/notifications/?category={Notification.Category.TRANSACTION}"
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(len(self._items(resp)), 1)

    def test_cannot_access_others_notification(self):
        n2 = Notification.objects.filter(recipient=self.u2).first()
        resp = self.c1.get(f"/api/notifications/{n2.id}/")
        self.assertEqual(resp.status_code, 404, resp.data)

    def test_delete_my_notification(self):
        n = Notification.objects.filter(recipient=self.u1).first()
        resp = self.c1.delete(f"/api/notifications/{n.id}/")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertFalse(Notification.objects.filter(id=n.id).exists())