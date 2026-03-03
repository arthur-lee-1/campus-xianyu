from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSellerOrReadOnly(BasePermission):
    """
    只有商品发布者可修改/删除，其他人只读
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and obj.seller_id == request.user.id