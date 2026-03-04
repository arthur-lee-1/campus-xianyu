from rest_framework import serializers
from .models import Comment, Follow, Favorite


class CommentSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    parent_id = serializers.IntegerField(source="parent.id", read_only=True, allow_null=True)

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