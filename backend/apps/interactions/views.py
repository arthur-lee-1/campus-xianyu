from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.generics import ListCreateAPIView, DestroyAPIView, ListAPIView
from rest_framework.views import APIView

from apps.products.models import Product
from apps.users.models import User
from utils.response import success, created, error
from .models import Comment, Follow, Favorite
from .serializers import (
    CommentSerializer,
    CommentCreateSerializer,
    FollowSerializer,
    FavoriteSerializer,
)


class IsCommentAuthor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.author_id == request.user.id


class ProductCommentListCreateView(ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return (
            Comment.objects
            .filter(product_id=product_id)
            .select_related("author", "parent")
            .order_by("-id")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CommentCreateSerializer
        return CommentSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        serializer = CommentSerializer(page, many=True) if page is not None else CommentSerializer(queryset, many=True)

        if page is not None:
            paginated = self.get_paginated_response(serializer.data)
            return success(data=paginated.data, message="评论列表获取成功")
        return success(data=serializer.data, message="评论列表获取成功")

    def create(self, request, *args, **kwargs):
        product = get_object_or_404(Product, pk=self.kwargs["product_id"])
        serializer = CommentCreateSerializer(data=request.data, context={"product": product})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(author=request.user, product=product)
        return created(data=CommentSerializer(comment).data, message="评论成功")


class CommentDeleteView(DestroyAPIView):
    queryset = Comment.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsCommentAuthor]

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        self.check_object_permissions(request, comment)
        comment.delete()
        return success(message="删除评论成功", data=None)


class FollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if request.user.id == user_id:
            return error("不能关注自己", status_code=status.HTTP_400_BAD_REQUEST)

        target = get_object_or_404(User, pk=user_id)
        obj, is_new = Follow.objects.get_or_create(follower=request.user, followed=target)
        if is_new:
            return created(data=FollowSerializer(obj).data, message="关注成功")
        return success(data=FollowSerializer(obj).data, message="已关注，无需重复操作")

    def delete(self, request, user_id):
        deleted, _ = Follow.objects.filter(follower=request.user, followed_id=user_id).delete()
        if deleted:
            return success(message="取消关注成功")
        return success(message="本就未关注")


class MyFollowersView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FollowSerializer

    def get_queryset(self):
        return (
            Follow.objects
            .filter(followed=self.request.user)
            .select_related("follower", "followed")
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page if page is not None else qs, many=True)
        if page is not None:
            return success(data=self.get_paginated_response(serializer.data).data, message="粉丝列表获取成功")
        return success(data=serializer.data, message="粉丝列表获取成功")


class MyFollowingView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FollowSerializer

    def get_queryset(self):
        return (
            Follow.objects
            .filter(follower=self.request.user)
            .select_related("follower", "followed")
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page if page is not None else qs, many=True)
        if page is not None:
            return success(data=self.get_paginated_response(serializer.data).data, message="关注列表获取成功")
        return success(data=serializer.data, message="关注列表获取成功")


class FavoriteProductView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        obj, is_new = Favorite.objects.get_or_create(user=request.user, product=product)
        if is_new:
            return created(data=FavoriteSerializer(obj).data, message="收藏成功")
        return success(data=FavoriteSerializer(obj).data, message="已收藏，无需重复操作")

    def delete(self, request, product_id):
        deleted, _ = Favorite.objects.filter(user=request.user, product_id=product_id).delete()
        if deleted:
            return success(message="取消收藏成功")
        return success(message="本就未收藏")


class MyFavoritesView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        return (
            Favorite.objects
            .filter(user=self.request.user)
            .select_related("product", "user")
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page if page is not None else qs, many=True)
        if page is not None:
            return success(data=self.get_paginated_response(serializer.data).data, message="收藏列表获取成功")
        return success(data=serializer.data, message="收藏列表获取成功")