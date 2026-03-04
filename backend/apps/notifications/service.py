from typing import Iterable, Optional
from django.contrib.auth import get_user_model
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
    objs = [
        Notification(
            recipient=u,
            sender=sender,
            category=category,
            title=title,
            content=content,
            extra=extra or {},
        )
        for u in recipients
    ]
    return Notification.objects.bulk_create(objs)