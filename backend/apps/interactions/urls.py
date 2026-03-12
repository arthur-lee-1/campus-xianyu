from django.urls import path
from .views import (
    ProductCommentListCreateView,
    CommentDeleteView,
    FollowUserView,
    MyFollowersView,
    MyFollowingView,
    FavoriteProductView,
    MyFavoritesView,
    ConversationEnsureView,
    ConversationListView,
    ConversationDetailView,
    ConversationMessageListCreateView,
    ConversationReadView,
    MyUnreadMessageCountView,
)

urlpatterns = [
    # 评论
    path(
        "products/<int:product_id>/comments/",
        ProductCommentListCreateView.as_view(),
        name="product-comments",
    ),
    path("comments/<int:pk>/", CommentDeleteView.as_view(), name="comment-delete"),
    # 关注
    path("users/<int:user_id>/follow/", FollowUserView.as_view(), name="user-follow"),
    path("me/followers/", MyFollowersView.as_view(), name="my-followers"),
    path("me/following/", MyFollowingView.as_view(), name="my-following"),
    # 收藏
    path(
        "products/<int:product_id>/favorite/",
        FavoriteProductView.as_view(),
        name="product-favorite",
    ),
    path("me/favorites/", MyFavoritesView.as_view(), name="my-favorites"),
    # 私信 / 会话
    path(
        "conversations/ensure/",
        ConversationEnsureView.as_view(),
        name="conversation-ensure",
    ),
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path(
        "conversations/<int:pk>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
    path(
        "conversations/<int:conversation_id>/messages/",
        ConversationMessageListCreateView.as_view(),
        name="conversation-messages",
    ),
    path(
        "conversations/<int:conversation_id>/read/",
        ConversationReadView.as_view(),
        name="conversation-read",
    ),
    path(
        "messages/unread_count/",
        MyUnreadMessageCountView.as_view(),
        name="message-unread-count",
    ),
]
