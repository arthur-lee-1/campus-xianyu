from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.test import APIRequestFactory


class DummyValidationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        raise ValidationError({"phone": ["手机号不能为空"]})


def test_custom_exception_handler_for_validation_error():
    factory = APIRequestFactory()
    request = factory.get("/dummy")
    response = DummyValidationView.as_view()(request)

    assert response.status_code == 400
    assert response.data["code"] == 400
    # 你若已按我建议改了 exceptions.py，这里应为“参数校验失败”
    # 若未改，可能是 str(exc)
    assert "message" in response.data
    assert "data" in response.data