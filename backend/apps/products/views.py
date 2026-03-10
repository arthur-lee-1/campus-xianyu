from django.db.models import F
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend

from utils.response import success
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductWriteSerializer,
)
from .permissions import IsSellerOrReadOnly


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by("sort_order", "id")
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = (
        Product.objects.select_related("category", "seller")
        .prefetch_related("images")
        .all()
    )
    lookup_value_regex = r"\d+"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "status", "condition", "seller", "campus"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "price", "view_count", "like_count"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "feed", "recommendations", "increase_view"]:
            return [AllowAny()]
        if self.action in ["create"]:
            return [IsAuthenticated()]
        if self.action in ["update", "partial_update", "destroy", "off_shelf", "mark_sold"]:
            return [IsAuthenticated(), IsSellerOrReadOnly()]
        return [IsAuthenticatedOrReadOnly()]

    def _apply_campus_filter(self, queryset):
        campus = self.request.query_params.get("campus")
        if campus:
            queryset = queryset.filter(campus=campus)
        return queryset

    def get_queryset(self):
        qs = super().get_queryset()
        qs = self._apply_campus_filter(qs)

        # 默认仅展示在售商品；卖家本人访问详情时可看到自己的非在售商品
        if self.action == "list":
            return qs.filter(status=Product.Status.ON_SALE)
        return qs

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductWriteSerializer
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != Product.Status.ON_SALE:
            if not request.user.is_authenticated or instance.seller_id != request.user.id:
                return success(data=None, message="商品不存在", status_code=404)
        serializer = self.get_serializer(instance)
        return success(serializer.data)

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def finalize_response(self, request, response, *args, **kwargs):
        # 包装 DRF 默认 list/retrieve/create 等响应为统一格式
        if hasattr(response, "data") and isinstance(response.data, (dict, list)):
            if not (
                isinstance(response.data, dict)
                and {"code", "message", "data"} <= set(response.data.keys())
            ):
                response.data = {
                    "code": response.status_code,
                    "message": "success",
                    "data": response.data,
                }
        return super().finalize_response(request, response, *args, **kwargs)

    @action(methods=["post"], detail=True, permission_classes=[AllowAny], url_path="view")
    def increase_view(self, request, pk=None):
        product = self.get_object()
        Product.objects.filter(pk=product.pk).update(view_count=F("view_count") + 1)
        product.refresh_from_db(fields=["view_count"])
        return success({"id": product.id, "view_count": product.view_count})

    @action(
        methods=["post"],
        detail=True,
        permission_classes=[IsAuthenticated, IsSellerOrReadOnly],
        url_path="off-shelf",
    )
    def off_shelf(self, request, pk=None):
        product = self.get_object()
        product.status = Product.Status.OFF_SHELF
        product.save(update_fields=["status", "updated_at"])
        return success({"id": product.id, "status": product.status}, message="已下架")

    @action(
        methods=["post"],
        detail=True,
        permission_classes=[IsAuthenticated, IsSellerOrReadOnly],
        url_path="mark-sold",
    )
    def mark_sold(self, request, pk=None):
        product = self.get_object()
        product.status = Product.Status.SOLD
        product.save(update_fields=["status", "updated_at"])
        return success({"id": product.id, "status": product.status}, message="已标记为已售")

    @action(methods=["get"], detail=False, permission_classes=[AllowAny], url_path="feed")
    def feed(self, request):
        """
        主页商品流：支持搜索、分类、排序、校区筛选
        """
        queryset = self.filter_queryset(
            self._apply_campus_filter(
                Product.objects.select_related("category", "seller")
                .prefetch_related("images")
                .filter(status=Product.Status.ON_SALE)
            )
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = ProductListSerializer(queryset, many=True, context={"request": request})
        return success(serializer.data)

    @action(methods=["get"], detail=False, permission_classes=[AllowAny], url_path="recommendations")
    def recommendations(self, request):
        """
        简单推荐：最新 + 热门（支持按校区筛选）
        """
        base_qs = (
            Product.objects.filter(status=Product.Status.ON_SALE)
            .select_related("category", "seller")
            .prefetch_related("images")
        )
        base_qs = self._apply_campus_filter(base_qs)

        newest = base_qs.order_by("-created_at")[:10]
        hot = base_qs.order_by("-like_count", "-view_count", "-created_at")[:10]

        return success(
            {
                "newest": ProductListSerializer(
                    newest, many=True, context={"request": request}
                ).data,
                "hot": ProductListSerializer(
                    hot, many=True, context={"request": request}
                ).data,
            }
        )