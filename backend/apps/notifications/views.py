from django.utils import timezone
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from utils.response import success
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        is_read = self.request.query_params.get("is_read")
        category = self.request.query_params.get("category")
        if is_read in ("true", "false"):
            qs = qs.filter(is_read=(is_read == "true"))
        if category:
            qs = qs.filter(category=category)
        return qs.order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return success(
                {
                    "count": self.paginator.page.paginator.count,
                    "next": self.paginator.get_next_link(),
                    "previous": self.paginator.get_previous_link(),
                    "results": serializer.data,
                }
            )
        serializer = self.get_serializer(queryset, many=True)
        return success(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        return success(self.get_serializer(obj).data)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.delete()
        return success(message="删除成功")

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        obj = self.get_object()
        if not obj.is_read:
            obj.is_read = True
            obj.read_at = timezone.now()
            obj.save(update_fields=["is_read", "read_at"])
        return success(self.get_serializer(obj).data, message="已标记为已读")

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        now = timezone.now()
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True, read_at=now)
        return success({"updated": count}, message="全部已读")

    @action(detail=False, methods=["get"], url_path="unread_count")
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return success({"unread_count": count})