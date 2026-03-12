from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Comment, Follow, Favorite, Conversation, Message

User = get_user_model()


class CommentSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    parent_id = serializers.IntegerField(
        source="parent.id", read_only=True, allow_null=True
    )

    class Meta:
        model = Comment
        fields = ["id", "product", "author_id", "parent_id", "content", "created_at"]
        read_only_fields = ["id", "author_id", "created_at"]


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "parent", "content"]

    def validate(self, attrs):
        parent = attrs.get("parent")
        product = self.context["product"]
        if parent and parent.product_id != product.id:
            raise serializers.ValidationError("回复的父评论不属于当前商品")
        return attrs


class FollowSerializer(serializers.ModelSerializer):
    follower_id = serializers.IntegerField(source="follower.id", read_only=True)
    followed_id = serializers.IntegerField(source="followed.id", read_only=True)

    class Meta:
        model = Follow
        fields = ["id", "follower_id", "followed_id", "created_at"]


class FavoriteSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    product_id = serializers.IntegerField(source="product.id", read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "user_id", "product_id", "created_at"]


def _user_display_name(user):
    for attr in ("nickname", "name", "username", "phone"):
        value = getattr(user, attr, None)
        if value:
            return str(value)
    return f"用户{user.id}"


def _user_avatar(user):
    for attr in ("avatar", "avatar_url"):
        value = getattr(user, attr, None)
        if value:
            try:
                return value.url
            except Exception:
                return str(value)
    return ""


class ConversationEnsureSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    product_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_user_id(self, value):
        request = self.context["request"]
        if request.user.id == value:
            raise serializers.ValidationError("不能和自己发起私信")
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("目标用户不存在")
        return value


class ConversationSerializer(serializers.ModelSerializer):
    other_user_id = serializers.SerializerMethodField()
    other_user_name = serializers.SerializerMethodField()
    other_user_avatar = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "product",
            "other_user_id",
            "other_user_name",
            "other_user_avatar",
            "last_message",
            "last_message_at",
            "unread_count",
            "created_at",
        ]

    def get_other_user_id(self, obj):
        user = obj.get_other_user(self.context["request"].user)
        return user.id

    def get_other_user_name(self, obj):
        user = obj.get_other_user(self.context["request"].user)
        return _user_display_name(user)

    def get_other_user_avatar(self, obj):
        user = obj.get_other_user(self.context["request"].user)
        return _user_avatar(user)

    def get_unread_count(self, obj):
        request = self.context["request"]
        return (
            obj.messages.filter(read_at__isnull=True)
            .exclude(sender=request.user)
            .count()
        )


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender_id",
            "sender_name",
            "content",
            "image",
            "image_url",
            "is_mine",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "conversation",
            "sender_id",
            "sender_name",
            "image_url",
            "is_mine",
            "is_read",
            "read_at",
            "created_at",
        ]

    def get_sender_name(self, obj):
        return _user_display_name(obj.sender)

    def get_image_url(self, obj):
        if not obj.image:
            return ""
        try:
            return obj.image.url
        except Exception:
            return str(obj.image)

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.id == obj.sender_id)

    def get_is_read(self, obj):
        return obj.read_at is not None


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["content", "image"]

    def validate(self, attrs):
        content = (attrs.get("content") or "").strip()
        image = attrs.get("image")
        if not content and not image:
            raise serializers.ValidationError("消息内容和图片不能同时为空")
        attrs["content"] = content
        return attrs
