from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from utils.response import success, created, error
from .models import Transaction, Rating
from .serializers import (
    TransactionCreateSerializer,
    TransactionSerializer,
    RatingCreateSerializer,
    RatingSerializer,
)


class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Transaction.objects.select_related("product", "buyer", "seller").all()
    http_method_names = ["get", "post"]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset().filter(Q(buyer=user) | Q(seller=user))
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return TransactionCreateSerializer
        return TransactionSerializer

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
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tx = serializer.save()
        return created(TransactionSerializer(tx).data, message="交易创建成功")

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        tx = self.get_object()
        if request.user.id != tx.seller_id:
            return error("仅卖家可确认交易", status_code=status.HTTP_403_FORBIDDEN)
        if tx.status != Transaction.Status.PENDING:
            return error("当前状态不可确认", status_code=status.HTTP_400_BAD_REQUEST)

        tx.status = Transaction.Status.IN_PROGRESS
        tx.save(update_fields=["status", "updated_at"])
        return success(TransactionSerializer(tx).data, message="已确认，交易进行中")

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        tx = self.get_object()
        if request.user.id not in (tx.buyer_id, tx.seller_id):
            return error("无权操作该交易", status_code=status.HTTP_403_FORBIDDEN)
        if not tx.can_complete():
            return error("当前状态不可完成", status_code=status.HTTP_400_BAD_REQUEST)

        tx.status = Transaction.Status.COMPLETED
        tx.save(update_fields=["status", "updated_at"])
        return success(TransactionSerializer(tx).data, message="交易已完成")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        tx = self.get_object()
        if request.user.id not in (tx.buyer_id, tx.seller_id):
            return error("无权操作该交易", status_code=status.HTTP_403_FORBIDDEN)
        if not tx.can_cancel():
            return error("当前状态不可取消", status_code=status.HTTP_400_BAD_REQUEST)

        tx.status = Transaction.Status.CANCELLED
        tx.save(update_fields=["status", "updated_at"])
        return success(TransactionSerializer(tx).data, message="交易已取消")

    @action(detail=True, methods=["post"])
    def rate(self, request, pk=None):
        tx = self.get_object()
        serializer = RatingCreateSerializer(
            data=request.data,
            context={"request": request, "transaction": tx},
        )
        serializer.is_valid(raise_exception=True)
        rating = serializer.save()
        return created(RatingSerializer(rating).data, message="评分成功")

    @action(detail=False, methods=["get"], url_path="ratings/me")
    def my_ratings(self, request):
        given = Rating.objects.filter(rater=request.user).select_related("transaction")
        received = Rating.objects.filter(ratee=request.user).select_related("transaction")
        return success(
            {
                "given": RatingSerializer(given, many=True).data,
                "received": RatingSerializer(received, many=True).data,
            }
        )