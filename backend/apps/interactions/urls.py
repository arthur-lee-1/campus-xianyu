from django.urls import path
from .views import (
    ProductCommentListCreateView,
    CommentDeleteView,
    FollowUserView,
    MyFollowersView,
    MyFollowingView,
    FavoriteProductView,
    MyFavoritesView,
)

urlpatterns = [
    # 评论
    path("products/<int:product_id>/comments/", ProductCommentListCreateView.as_view(), name="product-comments"),
    path("comments/<int:pk>/", CommentDeleteView.as_view(), name="comment-delete"),

    # 关注
    path("users/<int:user_id>/follow/", FollowUserView.as_view(), name="user-follow"),
    path("me/followers/", MyFollowersView.as_view(), name="my-followers"),
    path("me/following/", MyFollowingView.as_view(), name="my-following"),

    # 收藏
    path("products/<int:product_id>/favorite/", FavoriteProductView.as_view(), name="product-favorite"),
    path("me/favorites/", MyFavoritesView.as_view(), name="my-favorites"),
]