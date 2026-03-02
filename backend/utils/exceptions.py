from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return response

    # 默认 message
    message = "请求失败"
    data = None

    if isinstance(exc, ValidationError):
        message = "参数校验失败"
        data = response.data  # 把字段错误返回给前端
    else:
        # 例如 NotAuthenticated / PermissionDenied 等
        message = getattr(exc, "detail", None)
        if isinstance(message, (list, dict)):
            data = message
            message = "请求失败"
        elif not isinstance(message, str):
            message = "请求失败"

    response.data = {
        "code": response.status_code,
        "message": message,
        "data": data,
    }
    return response