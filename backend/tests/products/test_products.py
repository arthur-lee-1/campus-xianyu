import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.products.models import Category, Product


# ---------- 通用辅助 ----------
def _create_user(idx: int = 1):
    """
    尽量兼容自定义 User 模型的创建方式：
    - 自动填充常见字段（phone/username/email/nickname）
    - 若 create_user 不可用则回退到 create + set_password
    """
    User = get_user_model()
    fields = {f.name for f in User._meta.fields}

    data = {}
    if "phone" in fields:
        data["phone"] = f"138000000{idx:02d}"
    if "username" in fields:
        data["username"] = f"user_{idx}"
    if "email" in fields:
        data["email"] = f"user_{idx}@test.com"
    if "nickname" in fields:
        data["nickname"] = f"测试用户{idx}"

    password = "Test123456!"

    # 优先走 create_user（若你有自定义 manager）
    manager = User.objects
    if hasattr(manager, "create_user"):
        try:
            return manager.create_user(password=password, **data)
        except TypeError:
            pass

    # 回退到普通 create
    user = manager.create(**data)
    if hasattr(user, "set_password"):
        user.set_password(password)
        user.save(update_fields=["password"])
    return user


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user_seller():
    return _create_user(1)


@pytest.fixture
def user_buyer():
    return _create_user(2)


@pytest.fixture
def category():
    return Category.objects.create(name="教材", sort_order=1)


@pytest.fixture
def product_on_sale(user_seller, category):
    return Product.objects.create(
        seller=user_seller,
        category=category,
        title="高数教材",
        description="九成新",
        price="20.00",
        original_price="50.00",
        condition=Product.Condition.GOOD,
        status=Product.Status.ON_SALE,
    )


@pytest.fixture
def product_off_shelf(user_seller, category):
    return Product.objects.create(
        seller=user_seller,
        category=category,
        title="旧台灯",
        description="可用",
        price="10.00",
        original_price="30.00",
        condition=Product.Condition.FAIR,
        status=Product.Status.OFF_SHELF,
    )


# ---------- 测试用例 ----------
@pytest.mark.django_db
def test_anonymous_can_list_products(client, product_on_sale):
    resp = client.get("/api/products/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert "data" in body


@pytest.mark.django_db
def test_anonymous_cannot_create_product(client, category):
    payload = {
        "category": category.id,
        "title": "二手耳机",
        "description": "八成新",
        "price": "88.00",
        "original_price": "199.00",
        "condition": Product.Condition.GOOD,
        "status": Product.Status.ON_SALE,
    }
    resp = client.post("/api/products/", payload, format="json")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_authenticated_user_can_create_product(client, user_seller, category):
    client.force_authenticate(user=user_seller)
    payload = {
        "category": category.id,
        "title": "二手耳机",
        "description": "八成新",
        "price": "88.00",
        "original_price": "199.00",
        "condition": Product.Condition.GOOD,
        "status": Product.Status.ON_SALE,
    }
    resp = client.post("/api/products/", payload, format="json")
    assert resp.status_code == 201
    body = resp.json()
    assert body["code"] == 201
    assert body["data"]["title"] == "二手耳机"

    p = Product.objects.get(id=body["data"]["id"])
    assert p.seller_id == user_seller.id


@pytest.mark.django_db
def test_non_owner_cannot_update_product(client, user_buyer, product_on_sale):
    client.force_authenticate(user=user_buyer)
    resp = client.patch(
        f"/api/products/{product_on_sale.id}/",
        {"price": "1.00"},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_owner_can_off_shelf_and_mark_sold(client, user_seller, product_on_sale):
    client.force_authenticate(user=user_seller)

    resp1 = client.post(f"/api/products/{product_on_sale.id}/off-shelf/")
    assert resp1.status_code == 200
    body1 = resp1.json()
    assert body1["code"] == 200
    assert body1["data"]["status"] == Product.Status.OFF_SHELF

    product_on_sale.refresh_from_db()
    assert product_on_sale.status == Product.Status.OFF_SHELF

    resp2 = client.post(f"/api/products/{product_on_sale.id}/mark-sold/")
    assert resp2.status_code == 200
    body2 = resp2.json()
    assert body2["data"]["status"] == Product.Status.SOLD

    product_on_sale.refresh_from_db()
    assert product_on_sale.status == Product.Status.SOLD


@pytest.mark.django_db
def test_view_count_increase(client, product_on_sale):
    old_count = product_on_sale.view_count
    resp = client.post(f"/api/products/{product_on_sale.id}/view/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["data"]["id"] == product_on_sale.id

    product_on_sale.refresh_from_db()
    assert product_on_sale.view_count == old_count + 1


@pytest.mark.django_db
def test_feed_supports_search_and_category_filter(client, user_seller, category):
    # 额外创建一条可搜到的记录
    Product.objects.create(
        seller=user_seller,
        category=category,
        title="Python编程书",
        description="几乎全新",
        price="30.00",
        original_price="80.00",
        condition=Product.Condition.LIKE_NEW,
        status=Product.Status.ON_SALE,
    )

    resp = client.get(f"/api/products/feed/?search=Python&category={category.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    # 分页结构在 data 里
    assert "results" in body["data"]


@pytest.mark.django_db
def test_retrieve_off_shelf_product_by_anonymous_returns_404(client, product_off_shelf):
    resp = client.get(f"/api/products/{product_off_shelf.id}/")
    # 你的实现是 success(..., status_code=404)
    assert resp.status_code == 404
    body = resp.json()
    assert body["code"] == 404


@pytest.mark.django_db
def test_retrieve_off_shelf_product_by_owner_ok(client, user_seller, product_off_shelf):
    client.force_authenticate(user=user_seller)
    resp = client.get(f"/api/products/{product_off_shelf.id}/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["data"]["id"] == product_off_shelf.id