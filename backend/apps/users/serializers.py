from rest_framework import serializers
from .models import User

class SendSmsSerializer(serializers.Serializer):
    phone = serializers.RegexField(r'^1[3-9]\d{9}$', error_messages={
        'invalid': '请输入正确的手机号'
    })

class PhoneLoginSerializer(serializers.Serializer):
    phone = serializers.RegexField(r'^1[3-9]\d{9}$')
    code  = serializers.CharField(min_length=6, max_length=6)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'phone', 'nickname', 'avatar', 'bio', 'date_joined']
        read_only_fields = ['id', 'phone', 'date_joined']