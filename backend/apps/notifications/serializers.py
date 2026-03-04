from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    recipient_id = serializers.IntegerField(source="recipient.id", read_only=True)
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "recipient_id",
            "sender_id",
            "category",
            "title",
            "content",
            "extra",
            "is_read",
            "read_at",
            "created_at",
        )