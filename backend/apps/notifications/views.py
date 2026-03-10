from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from utils.response import success
from .models import Notification
from .serializers import NotificationSerializer
from .service import mark_notification_read, mark_all_notifications_read


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = (
            Notification.objects
            .filter(recipient=self.request.user)
            .select_related("recipient", "sender")
            .order_by("-created_at")
        )

        is_read = self.request.query_params.get("is_read")
        category = self.request.query_params.get("category")

        if is_read in ("true", "false"):
            qs = qs.filter(is_read=(is_read == "true"))

        if category:
            qs = qs.filter(category=category)

        return qs

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
        obj = mark_notification_read(notification=obj)
        return success(self.get_serializer(obj).data, message="已标记为已读")

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        count = mark_all_notifications_read(recipient=request.user)
        return success({"updated": count}, message="全部已读")

    @action(detail=False, methods=["get"], url_path="unread_count")
    def unread_count(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).count()
        return success({"unread_count": count})