import pytest
from django.core.cache import cache
from rest_framework.test import APIClient
from apps.users.models import User, ThirdPartyAccount


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_send_sms_success(client, settings):
    settings.SMS_DEV_CODE = "123456"
    resp = client.post("/api/auth/sms/", {"phone": "13800138000"}, format="json")
    assert resp.status_code == 200
    assert resp.data["message"] == "验证码已发送"


@pytest.mark.django_db
def test_send_sms_too_frequent(client):
    phone = "13800138001"
    client.post("/api/auth/sms/", {"phone": phone}, format="json")
    resp = client.post("/api/auth/sms/", {"phone": phone}, format="json")
    assert resp.status_code == 400
    assert "频繁" in resp.data["message"]


@pytest.mark.django_db
def test_phone_login_success_and_auto_register(client, settings):
    settings.SMS_DEV_CODE = "123456"
    phone = "13800138002"

    client.post("/api/auth/sms/", {"phone": phone}, format="json")
    resp = client.post(
        "/api/auth/login/phone/",
        {"phone": phone, "code": "123456"},
        format="json",
    )

    assert resp.status_code == 200
    assert resp.data["data"]["access"]
    assert resp.data["data"]["refresh"]
    assert User.objects.filter(phone=phone).exists()


@pytest.mark.django_db
def test_phone_login_wrong_code(client):
    phone = "13800138003"
    client.post("/api/auth/sms/", {"phone": phone}, format="json")
    resp = client.post(
        "/api/auth/login/phone/",
        {"phone": phone, "code": "000000"},
        format="json",
    )
    assert resp.status_code == 400
    assert "验证码错误" in resp.data["message"]


@pytest.mark.django_db
def test_user_profile_get_and_patch(client):
    user = User.objects.create_user(phone="13800138004")
    from rest_framework_simplejwt.tokens import RefreshToken
    access = str(RefreshToken.for_user(user).access_token)

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    r1 = client.get("/api/users/me/")
    assert r1.status_code == 200
    assert r1.data["data"]["phone"] == "13800138004"

    r2 = client.patch("/api/users/me/", {"nickname": "新昵称"}, format="json")
    assert r2.status_code == 200
    assert r2.data["data"]["nickname"] == "新昵称"


@pytest.mark.django_db
def test_logout_and_refresh_blacklist(client):
    user = User.objects.create_user(phone="13800138005")
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    refresh_str = str(refresh)

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    resp = client.post("/api/auth/logout/", {"refresh": refresh_str}, format="json")
    assert resp.status_code == 200

    # 被拉黑后，refresh 应无法再换新 access
    r2 = client.post("/api/auth/token/refresh/", {"refresh": refresh_str}, format="json")
    assert r2.status_code == 401


@pytest.mark.django_db
def test_social_login_bind_then_login(client, settings):
    settings.SMS_DEV_CODE = "123456"
    phone = "13800138006"
    openid = "wx_openid_001"

    client.post("/api/auth/sms/", {"phone": phone}, format="json")

    # 首次：绑定
    resp1 = client.post(
        "/api/auth/login/social/",
        {
            "platform": "wechat",
            "openid": openid,
            "phone": phone,
            "code": "123456",
        },
        format="json",
    )
    assert resp1.status_code == 200
    assert ThirdPartyAccount.objects.filter(platform="wechat", openid=openid).exists()

    # 二次：仅 openid 登录
    resp2 = client.post(
        "/api/auth/login/social/",
        {"platform": "wechat", "openid": openid},
        format="json",
    )
    assert resp2.status_code == 200
    assert resp2.data["data"]["access"]