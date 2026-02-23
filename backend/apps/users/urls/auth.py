from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import SendSmsView, PhoneLoginView, LogoutView

urlpatterns = [
    path('sms/',           SendSmsView.as_view(),    name='send-sms'),
    path('login/phone/',   PhoneLoginView.as_view(), name='phone-login'),
    path('logout/',        LogoutView.as_view(),     name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]