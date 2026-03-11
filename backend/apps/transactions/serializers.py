from django.db import IntegrityError, transaction
from rest_framework import serializers

from .models import Transaction, Rating


class TransactionCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    remark = serializers.CharField(max_length=200, required=False, allow_blank=True)

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("成交价必须大于 0")
        return value



class TransactionSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    buyer_id = serializers.IntegerField(source="buyer.id", read_only=True)
    seller_id = serializers.IntegerField(source="seller.id", read_only=True)

    class Meta:
        model = Transaction
        fields = (
            "id",
            "product_id",
            "buyer_id",
            "seller_id",
            "status",
            "price",
            "remark",
            "confirmed_at",
            "completed_at",
            "cancelled_at",
            "cancel_reason",

            "created_at",
            "updated_at",
        )


class RatingSerializer(serializers.ModelSerializer):
    rater_id = serializers.IntegerField(source="rater.id", read_only=True)
    ratee_id = serializers.IntegerField(source="ratee.id", read_only=True)

    class Meta:
        model = Rating
        fields = (
            "id",
            "transaction",
            "rater_id",
            "ratee_id",
            "role",
            "score",
            "comment",
            "created_at",
        )


class RatingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ("score", "comment")

    def validate(self, attrs):
        request = self.context["request"]
        tx = self.context["transaction"]

        if tx.status != Transaction.Status.COMPLETED:
            raise serializers.ValidationError("仅已完成交易可评分")

        if request.user.id == tx.buyer_id:
            role = Rating.RaterRole.BUYER
            ratee = tx.seller
        elif request.user.id == tx.seller_id:
            role = Rating.RaterRole.SELLER
            ratee = tx.buyer
        else:
            raise serializers.ValidationError("无权对该交易评分")

        if Rating.objects.filter(transaction=tx, role=role).exists():
            raise serializers.ValidationError("该交易当前角色已评分")

        attrs["role"] = role
        attrs["ratee"] = ratee

        attrs["rater"] = request.user
        attrs["transaction"] = tx
        return attrs

    def create(self, validated_data):
        try:
            with transaction.atomic():
                return Rating.objects.create(**validated_data)

        except IntegrityError:
            raise serializers.ValidationError("该交易当前角色已评分")