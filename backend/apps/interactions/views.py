from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.generics import (
    ListCreateAPIView,
    DestroyAPIView,
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.views import APIView

from apps.products.models import Product
from apps.users.models import User
from utils.response import success, created, error
from .models import Comment, Follow, Favorite, Conversation, Message
from .serializers import (
    CommentSerializer,
    CommentCreateSerializer,
    FollowSerializer,
    FavoriteSerializer,
    ConversationEnsureSerializer,
    ConversationSerializer,
    MessageSerializer,
    MessageCreateSerializer,
)


class IsCommentAuthor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.author_id == request.user.id


class ProductCommentListCreateView(ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return (
            Comment.objects.filter(product_id=product_id)
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
        serializer = (
            CommentSerializer(page, many=True)
            if page is not None
            else CommentSerializer(queryset, many=True)
        )

        if page is not None:
            paginated = self.get_paginated_response(serializer.data)
            return success(data=paginated.data, message="评论列表获取成功")
        return success(data=serializer.data, message="评论列表获取成功")

    def create(self, request, *args, **kwargs):
        product = get_object_or_404(Product, pk=self.kwargs["product_id"])
        serializer = CommentCreateSerializer(
            data=request.data, context={"product": product}
        )
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
        obj, is_new = Follow.objects.get_or_create(
            follower=request.user, followed=target
        )
        if is_new:
            return created(data=FollowSerializer(obj).data, message="关注成功")
        return success(data=FollowSerializer(obj).data, message="已关注，无需重复操作")

    def delete(self, request, user_id):
        deleted, _ = Follow.objects.filter(
            follower=request.user, followed_id=user_id
        ).delete()
        if deleted:
            return success(message="取消关注成功")
        return success(message="本就未关注")


class MyFollowersView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FollowSerializer

    def get_queryset(self):
        return (
            Follow.objects.filter(followed=self.request.user)
            .select_related("follower", "followed")
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page if page is not None else qs, many=True)
        if page is not None:
            return success(
                data=self.get_paginated_response(serializer.data).data,
                message="粉丝列表获取成功",
            )
        return success(data=serializer.data, message="粉丝列表获取成功")


class MyFollowingView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FollowSerializer

    def get_queryset(self):
        return (
            Follow.objects.filter(follower=self.request.user)
            .select_related("follower", "followed")
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page if page is not None else qs, many=True)
        if page is not None:
            return success(
                data=self.get_paginated_response(serializer.data).data,
                message="关注列表获取成功",
            )
        return success(data=serializer.data, message="关注列表获取成功")


class FavoriteProductView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        obj, is_new = Favorite.objects.get_or_create(user=request.user, product=product)
        if is_new:
            return created(data=FavoriteSerializer(obj).data, message="收藏成功")
        return success(
            data=FavoriteSerializer(obj).data, message="已收藏，无需重复操作"
        )

    def delete(self, request, product_id):
        deleted, _ = Favorite.objects.filter(
            user=request.user, product_id=product_id
        ).delete()
        if deleted:
            return success(message="取消收藏成功")
        return success(message="本就未收藏")


class MyFavoritesView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        return (
            Favorite.objects.filter(user=self.request.user)
            .select_related("product", "user")
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page if page is not None else qs, many=True)
        if page is not None:
            return success(
                data=self.get_paginated_response(serializer.data).data,
                message="收藏列表获取成功",
            )
        return success(data=serializer.data, message="收藏列表获取成功")


# ===================== 私信 / 会话 =====================

UserModel = get_user_model()


def _conversation_queryset_for(user):
    return Conversation.objects.filter(
        Q(participant1=user) | Q(participant2=user)
    ).select_related("participant1", "participant2", "product")


class ConversationEnsureView(APIView):
    """
    创建或获取会话
    POST /api/interactions/conversations/ensure/
    {
      "user_id": 2,
      "product_id": 10   # 可选
    }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ConversationEnsureSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        target = get_object_or_404(UserModel, pk=serializer.validated_data["user_id"])
        product_id = serializer.validated_data.get("product_id")
        product = None
        if product_id is not None:
            product = get_object_or_404(Product, pk=product_id)

        p1, p2 = Conversation.normalize_users(request.user, target)

        with transaction.atomic():
            conversation, created_flag = Conversation.objects.get_or_create(
                participant1=p1,
                participant2=p2,
                product=product,
            )

        msg = "会话创建成功" if created_flag else "会话获取成功"
        return success(
            data=ConversationSerializer(
                conversation, context={"request": request}
            ).data,
            message=msg,
        )


class ConversationListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        qs = _conversation_queryset_for(self.request.user)

        keyword = (self.request.query_params.get("keyword") or "").strip()
        if keyword:
            query = Q(last_message__icontains=keyword)

            user_fields = {f.name for f in UserModel._meta.fields}
            user_ids = set()

            for field in ("nickname", "username", "phone", "name"):
                if field in user_fields:
                    cond = {f"{field}__icontains": keyword}
                    matched = UserModel.objects.filter(**cond).values_list(
                        "id", flat=True
                    )
                    user_ids.update(matched)

            if user_ids:
                query |= Q(participant1_id__in=user_ids) | Q(
                    participant2_id__in=user_ids
                )

            qs = qs.filter(query)

        return qs.order_by("-last_message_at", "-id")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(
            page if page is not None else qs, many=True, context={"request": request}
        )
        if page is not None:
            return success(
                data=self.get_paginated_response(serializer.data).data,
                message="会话列表获取成功",
            )
        return success(data=serializer.data, message="会话列表获取成功")


class ConversationDetailView(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return _conversation_queryset_for(self.request.user)

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        return success(
            data=self.get_serializer(obj, context={"request": request}).data,
            message="会话详情获取成功",
        )


class ConversationMessageListCreateView(ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_conversation(self):
        return get_object_or_404(
            _conversation_queryset_for(self.request.user),
            pk=self.kwargs["conversation_id"],
        )

    def get_queryset(self):
        conversation = self.get_conversation()
        return conversation.messages.select_related("sender", "conversation").order_by(
            "created_at", "id"
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MessageCreateSerializer
        return MessageSerializer

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        serializer = MessageSerializer(
            page if page is not None else qs,
            many=True,
            context={"request": request},
        )
        if page is not None:
            return success(
                data=self.get_paginated_response(serializer.data).data,
                message="消息列表获取成功",
            )
        return success(data=serializer.data, message="消息列表获取成功")

    def create(self, request, *args, **kwargs):
        conversation = self.get_conversation()
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.save(conversation=conversation, sender=request.user)

        summary = message.content or "[图片]"
        conversation.last_message = summary[:500]
        conversation.last_message_at = message.created_at
        conversation.save(update_fields=["last_message", "last_message_at"])

        return created(
            data=MessageSerializer(message, context={"request": request}).data,
            message="消息发送成功",
        )


class ConversationReadView(APIView):
    """
    将当前会话中“对方发给我”的未读消息全部标记为已读
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id):
        conversation = get_object_or_404(
            _conversation_queryset_for(request.user), pk=conversation_id
        )
        updated = (
            conversation.messages.filter(read_at__isnull=True)
            .exclude(sender=request.user)
            .update(read_at=timezone.now())
        )
        return success(data={"updated": updated}, message="已读状态更新成功")


class MyUnreadMessageCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        conversation_ids = _conversation_queryset_for(request.user).values_list(
            "id", flat=True
        )
        count = (
            Message.objects.filter(
                conversation_id__in=conversation_ids,
                read_at__isnull=True,
            )
            .exclude(sender=request.user)
            .count()
        )
        return success(data={"unread_count": count}, message="未读消息数获取成功")
