from typing import Iterable, Optional
from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Notification

User = get_user_model()


def send_notification(
    recipient: User,
    title: str,
    content: str,
    *,
    category: str = Notification.Category.SYSTEM,
    sender: Optional[User] = None,
    extra: Optional[dict] = None,
) -> Notification:
    """
    发送单条通知
    """
    return Notification.objects.create(
        recipient=recipient,
        sender=sender,
        category=category,
        title=title,
        content=content,
        extra=extra or {},
    )


def bulk_send_notification(
    recipients: Iterable[User],
    title: str,
    content: str,
    *,
    category: str = Notification.Category.SYSTEM,
    sender: Optional[User] = None,
    extra: Optional[dict] = None,
):
    """
    批量发送通知
    """
    payload = extra or {}
    objs = [
        Notification(
            recipient=user,
            sender=sender,
            category=category,
            title=title,
            content=content,
            extra=payload,
        )
        for user in recipients
    ]
    return Notification.objects.bulk_create(objs)


@transaction.atomic
def mark_notification_read(*, notification: Notification) -> Notification:
    """
    标记单条已读
    """
    notification.mark_read()
    return notification


@transaction.atomic
def mark_all_notifications_read(*, recipient: User) -> int:
    """
    标记用户全部未读消息为已读
    """
    from django.utils import timezone

    now = timezone.now()
    updated = Notification.objects.filter(
        recipient=recipient,
        is_read=False,
    ).update(
        is_read=True,
        read_at=now,
    )
    return updated