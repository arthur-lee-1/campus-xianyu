from decimal import Decimal
from django.db import IntegrityError, transaction
from rest_framework import serializers

from apps.products.models import Product
from .models import Transaction, Rating


def resolve_product_seller(product):
    for attr in ("seller", "user", "owner", "publisher"):
        val = getattr(product, attr, None)
        if val is not None:
            return val
    return None


class TransactionCreateSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)
    price = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)

    class Meta:
        model = Transaction
        fields = ("id", "product_id", "price", "remark")
        read_only_fields = ("id",)

    def validate(self, attrs):
        request = self.context["request"]
        buyer = request.user

        try:
            product = Product.objects.get(pk=attrs["product_id"])
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_id": "商品不存在"})

        seller = resolve_product_seller(product)
        if seller is None:
            raise serializers.ValidationError({"product_id": "无法识别商品卖家"})

        if buyer.id == seller.id:
            raise serializers.ValidationError("不能购买自己发布的商品")

        exists_active = Transaction.objects.filter(
            product=product,
            status__in=[Transaction.Status.PENDING, Transaction.Status.IN_PROGRESS],
        ).exists()
        if exists_active:
            raise serializers.ValidationError("该商品已有进行中的交易")

        if "price" not in attrs or attrs.get("price") is None:
            product_price = getattr(product, "price", None)
            if product_price is None:
                raise serializers.ValidationError({"price": "请提供成交价"})
            attrs["price"] = Decimal(str(product_price))

        attrs["product"] = product
        attrs["seller"] = seller
        attrs["buyer"] = buyer
        return attrs

    def create(self, validated_data):
        validated_data.pop("product_id", None)
        return Transaction.objects.create(**validated_data)


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

        # 先做业务侧重复校验（避免大多数冲突）
        if Rating.objects.filter(transaction=tx, role=role).exists():
            raise serializers.ValidationError("该交易当前角色已评分")

        attrs["role"] = role
        attrs["ratee"] = ratee
        attrs["rater"] = request.user
        attrs["transaction"] = tx
        return attrs

    def create(self, validated_data):
        # 关键：用 atomic savepoint 包住，捕获 IntegrityError 后回滚到 savepoint，
        # 避免把外层测试事务打坏（否则后续请求会 TransactionManagementError）
        try:
            with transaction.atomic():
                return Rating.objects.create(**validated_data)
        except IntegrityError:
            raise serializers.ValidationError("该交易当前角色已评分")