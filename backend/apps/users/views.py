from drf_spectacular.utils import extend_schema
import random
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from utils.response import success, error
from .models import User
from .serializers import SendSmsSerializer, PhoneLoginSerializer, UserProfileSerializer

SMS_CODE_PREFIX  = "sms:code:"   # Redis key 前缀
SMS_CODE_TIMEOUT = 60 * 5        # 5 分钟过期

class SendSmsView(APIView):
    """发送验证码（开发阶段固定返回 123456）"""
    permission_classes = [AllowAny]

    @extend_schema(request=SendSmsSerializer)
    def post(self, request):
        s = SendSmsSerializer(data=request.data)
        if not s.is_valid():
            return error(str(s.errors))

        phone = s.validated_data['phone']

        # 60 秒内不重复发送
        if cache.get(f"{SMS_CODE_PREFIX}{phone}:lock"):
            return error("发送太频繁，请稍后再试")

        code = "123456"  # TODO: 接入真实短信服务后替换
        cache.set(f"{SMS_CODE_PREFIX}{phone}", code, SMS_CODE_TIMEOUT)
        cache.set(f"{SMS_CODE_PREFIX}{phone}:lock", 1, 60)

        return success(message="验证码已发送")


class PhoneLoginView(APIView):
    """手机号 + 验证码登录，用户不存在则自动注册"""
    permission_classes = [AllowAny]

    @extend_schema(request=PhoneLoginSerializer)
    def post(self, request):
        s = PhoneLoginSerializer(data=request.data)
        if not s.is_valid():
            return error(str(s.errors))

        phone = s.validated_data['phone']
        code  = s.validated_data['code']

        cached_code = cache.get(f"{SMS_CODE_PREFIX}{phone}")
        if not cached_code or cached_code != code:
            return error("验证码错误或已过期")

        # 验证通过，删除验证码
        cache.delete(f"{SMS_CODE_PREFIX}{phone}")

        user, created = User.objects.get_or_create(phone=phone)
        if created:
            user.nickname = f"用户{phone[-4:]}"
            user.save()

        refresh = RefreshToken.for_user(user)
        return success({
            "access":  str(refresh.access_token),
            "refresh": str(refresh),
            "is_new":  created,
            "user":    UserProfileSerializer(user).data,
        })


class LogoutView(APIView):
    """登出，将 Refresh Token 加入黑名单"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get("refresh"))
            token.blacklist()
            return success(message="已退出登录")
        except Exception:
            return error("Token 无效")


class UserProfileView(APIView):
    """获取 / 修改当前用户信息"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success(UserProfileSerializer(request.user).data)

    def patch(self, request):
        s = UserProfileSerializer(request.user, data=request.data, partial=True)
        if not s.is_valid():
            return error(str(s.errors))
        s.save()
        return success(s.data)