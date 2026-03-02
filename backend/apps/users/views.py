from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from utils.response import success, error
from .models import User, ThirdPartyAccount
from .serializers import (
    SendSmsSerializer, PhoneLoginSerializer, ThirdPartyLoginSerializer, UserProfileSerializer
)

SMS_CODE_PREFIX = "sms:code:"
SMS_CODE_TIMEOUT = 60 * 5


class SendSmsView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=SendSmsSerializer)
    def post(self, request):
        s = SendSmsSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        phone = s.validated_data["phone"]
        if cache.get(f"{SMS_CODE_PREFIX}{phone}:lock"):
            return error("发送太频繁，请稍后再试")

        code = getattr(settings, "SMS_DEV_CODE", "123456")
        cache.set(f"{SMS_CODE_PREFIX}{phone}", code, SMS_CODE_TIMEOUT)
        cache.set(f"{SMS_CODE_PREFIX}{phone}:lock", 1, 60)

        return success(message="验证码已发送")


class PhoneLoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=PhoneLoginSerializer)
    def post(self, request):
        s = PhoneLoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        phone = s.validated_data["phone"]
        code = s.validated_data["code"]

        cached_code = cache.get(f"{SMS_CODE_PREFIX}{phone}")
        if not cached_code or str(cached_code) != code:
            return error("验证码错误或已过期")

        cache.delete(f"{SMS_CODE_PREFIX}{phone}")

        user, created = User.objects.get_or_create(
            phone=phone,
            defaults={"nickname": f"用户{phone[-4:]}"}
        )

        refresh = RefreshToken.for_user(user)
        return success({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_new": created,
            "user": UserProfileSerializer(user).data,
        })


class ThirdPartyLoginView(APIView):
    """
    微信/QQ 登录：
    - 已绑定 openid：直接登录
    - 未绑定：需传 phone + code 完成绑定
    """
    permission_classes = [AllowAny]

    @extend_schema(request=ThirdPartyLoginSerializer)
    def post(self, request):
        s = ThirdPartyLoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        platform = data["platform"]
        openid = data["openid"]
        union_id = data.get("union_id", "")

        account = ThirdPartyAccount.objects.select_related("user").filter(
            platform=platform, openid=openid
        ).first()

        if account:
            user = account.user
            is_new = False
        else:
            phone = data.get("phone")
            code = data.get("code")
            if not phone or not code:
                return error("首次登录请提供 phone + code 完成绑定")

            cached_code = cache.get(f"{SMS_CODE_PREFIX}{phone}")
            if not cached_code or str(cached_code) != code:
                return error("验证码错误或已过期")
            cache.delete(f"{SMS_CODE_PREFIX}{phone}")

            with transaction.atomic():
                user, user_created = User.objects.get_or_create(
                    phone=phone,
                    defaults={"nickname": f"用户{phone[-4:]}"}
                )
                account, acc_created = ThirdPartyAccount.objects.get_or_create(
                    platform=platform,
                    openid=openid,
                    defaults={"user": user, "union_id": union_id}
                )
                if not acc_created and account.user_id != user.id:
                    return error("该第三方账号已绑定其他用户", status_code=409)

            is_new = user_created

        refresh = RefreshToken.for_user(user)
        return success({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_new": is_new,
            "user": UserProfileSerializer(user).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return error("缺少 refresh token")
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return success(message="已退出登录")
        except Exception:
            return error("Token 无效")


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success(UserProfileSerializer(request.user).data)

    def patch(self, request):
        s = UserProfileSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return success(s.data)