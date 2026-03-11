from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied
from apps.notifications.models import Notification
from apps.notifications.service import send_notification
from apps.products.models import Product

from .models import Transaction


ACTIVE_STATUSES = [Transaction.Status.PENDING, Transaction.Status.IN_PROGRESS]


def create_transaction(*, product_id, buyer, price=None, remark=""):
    with transaction.atomic():
        product = (
            Product.objects.select_for_update()
            .select_related("seller")
            .get(pk=product_id)
        )

        if product.status != Product.Status.ON_SALE:
            raise ValidationError({"product_id": "仅在售商品可发起交易"})

        if buyer.id == product.seller_id:
            raise ValidationError("不能购买自己发布的商品")

        exists_active = Transaction.objects.filter(
            product=product,
            status__in=ACTIVE_STATUSES,
        ).exists()
        if exists_active:
            raise ValidationError("该商品已有进行中的交易")

        final_price = price
        if final_price is None:
            if product.price is None:
                raise ValidationError({"price": "请提供成交价"})
            final_price = Decimal(str(product.price))

        tx = Transaction.objects.create(
            product=product,
            buyer=buyer,
            seller=product.seller,
            price=final_price,
            remark=remark or "",
            status=Transaction.Status.PENDING,
        )

        send_notification(
            recipient=product.seller,
            sender=buyer,
            category=Notification.Category.TRANSACTION,
            title="你收到一个新的交易请求",
            content=f"商品《{product.title}》有买家发起交易，请及时确认。",
            extra={"transaction_id": tx.id, "product_id": product.id},
        )
        return tx


def confirm_transaction(*, tx, operator):
    with transaction.atomic():
        tx = (
            Transaction.objects.select_for_update()
            .select_related("product", "buyer", "seller")
            .get(pk=tx.pk)
        )

        if operator.id != tx.seller_id:
            raise PermissionDenied("仅卖家可确认交易")

        if not tx.can_confirm():
            raise ValidationError("当前状态不可确认")

        if tx.product.status != Product.Status.ON_SALE:
            raise ValidationError("商品当前状态不允许确认交易")

        tx.status = Transaction.Status.IN_PROGRESS
        tx.confirmed_at = timezone.now()
        tx.save(update_fields=["status", "confirmed_at", "updated_at"])

        send_notification(
            recipient=tx.buyer,
            sender=operator,
            category=Notification.Category.TRANSACTION,
            title="卖家已确认交易",
            content=f"商品《{tx.product.title}》的交易已确认，可继续完成交易。",
            extra={"transaction_id": tx.id, "product_id": tx.product_id},
        )
        return tx


def complete_transaction(*, tx, operator):
    with transaction.atomic():
        tx = (
            Transaction.objects.select_for_update()
            .select_related("product", "buyer", "seller")
            .get(pk=tx.pk)
        )
        product = Product.objects.select_for_update().get(pk=tx.product_id)

        if operator.id not in (tx.buyer_id, tx.seller_id):
            raise PermissionDenied("无权操作该交易")

        if not tx.can_complete():
            raise ValidationError("当前状态不可完成")

        if product.status != Product.Status.ON_SALE:
            raise ValidationError("商品当前状态不允许完成交易")

        tx.status = Transaction.Status.COMPLETED
        tx.completed_at = timezone.now()
        tx.save(update_fields=["status", "completed_at", "updated_at"])

        product.status = Product.Status.SOLD
        product.save(update_fields=["status", "updated_at"])

        recipient = tx.seller if operator.id == tx.buyer_id else tx.buyer
        send_notification(
            recipient=recipient,
            sender=operator,
            category=Notification.Category.TRANSACTION,
            title="交易已完成",
            content=f"商品《{product.title}》的交易已被标记为完成。",
            extra={"transaction_id": tx.id, "product_id": product.id},
        )
        return tx


def cancel_transaction(*, tx, operator, cancel_reason=""):
    with transaction.atomic():
        tx = (
            Transaction.objects.select_for_update()
            .select_related("product", "buyer", "seller")
            .get(pk=tx.pk)
        )

        if operator.id not in (tx.buyer_id, tx.seller_id):
            raise PermissionDenied("无权操作该交易")

        if not tx.can_cancel():
            raise ValidationError("当前状态不可取消")

        tx.status = Transaction.Status.CANCELLED
        tx.cancelled_at = timezone.now()
        tx.cancel_reason = cancel_reason or ""
        tx.save(update_fields=["status", "cancelled_at", "cancel_reason", "updated_at"])

        recipient = tx.seller if operator.id == tx.buyer_id else tx.buyer
        send_notification(
            recipient=recipient,
            sender=operator,
            category=Notification.Category.TRANSACTION,
            title="交易已取消",
            content=f"商品《{tx.product.title}》的交易已取消。",
            extra={"transaction_id": tx.id, "product_id": tx.product_id},
        )
        return tx