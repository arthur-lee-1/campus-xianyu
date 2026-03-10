from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    recipient_id = serializers.IntegerField(source="recipient.id", read_only=True)
    sender_id = serializers.SerializerMethodField()

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

    def get_sender_id(self, obj):
        return obj.sender_id