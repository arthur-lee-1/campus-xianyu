from rest_framework import serializers
from .models import User

class SendSmsSerializer(serializers.Serializer):
    phone = serializers.RegexField(r'^1[3-9]\d{9}$', error_messages={'invalid': '请输入正确的手机号'})


class PhoneLoginSerializer(serializers.Serializer):
    phone = serializers.RegexField(r'^1[3-9]\d{9}$')
    code = serializers.CharField(min_length=6, max_length=6)


class ThirdPartyLoginSerializer(serializers.Serializer):
    platform = serializers.ChoiceField(choices=[("wechat", "微信"), ("qq", "QQ")])
    openid = serializers.CharField(max_length=100)
    union_id = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # 首次绑定时需要
    phone = serializers.RegexField(r'^1[3-9]\d{9}$', required=False)
    code = serializers.CharField(min_length=6, max_length=6, required=False)

    def validate(self, attrs):
        phone, code = attrs.get("phone"), attrs.get("code")
        if (phone and not code) or (code and not phone):
            raise serializers.ValidationError("phone 和 code 需同时提供")
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'phone', 'nickname', 'avatar', 'bio', 'school', 'date_joined']
        read_only_fields = ['id', 'phone', 'date_joined']