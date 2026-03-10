from django.db import transaction
from rest_framework import serializers
from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "icon", "sort_order"]


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "image_url", "sort_order"]
        read_only_fields = ["id", "image_url"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    cover_image = serializers.SerializerMethodField()
    seller = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "price",
            "original_price",
            "condition",
            "campus",
            "status",
            "view_count",
            "like_count",
            "created_at",
            "category",
            "cover_image",
            "seller",
        ]

    def get_cover_image(self, obj):
        img = obj.images.first()
        if not img or not img.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(img.image.url) if request else img.image.url

    def get_seller(self, obj):
        u = obj.seller
        avatar = getattr(u, "avatar", None)
        avatar_url = None
        if avatar:
            try:
                request = self.context.get("request")
                avatar_url = request.build_absolute_uri(avatar.url) if request else avatar.url
            except Exception:
                avatar_url = None

        return {
            "id": u.id,
            "name": getattr(u, "nickname", None) or getattr(u, "username", f"user_{u.id}"),
            "avatar": avatar_url,
            "campus": getattr(u, "campus", None),
        }


class ProductDetailSerializer(ProductListSerializer):
    description = serializers.CharField()
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ["description", "updated_at", "images"]


class ProductWriteSerializer(serializers.ModelSerializer):
    image_files = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
    )
    replace_images = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "campus",
            "title",
            "description",
            "price",
            "original_price",
            "condition",
            "status",
            "image_files",
            "replace_images",
        ]
        read_only_fields = ["id"]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("价格必须大于 0")
        return value

    def validate(self, attrs):
        price = attrs.get("price", getattr(self.instance, "price", None))
        original_price = attrs.get("original_price", getattr(self.instance, "original_price", None))
        if original_price is not None and price is not None and original_price < price:
            raise serializers.ValidationError("原价不能小于现价")
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        image_files = validated_data.pop("image_files", [])
        validated_data.pop("replace_images", None)
        validated_data["seller"] = self.context["request"].user
        product = Product.objects.create(**validated_data)

        for idx, image in enumerate(image_files):
            ProductImage.objects.create(product=product, image=image, sort_order=idx)
        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        image_files = validated_data.pop("image_files", [])
        replace_images = validated_data.pop("replace_images", False)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if replace_images:
            instance.images.all().delete()

        if image_files:
            start = instance.images.count()
            for idx, image in enumerate(image_files, start=start):
                ProductImage.objects.create(product=instance, image=image, sort_order=idx)

        return instance