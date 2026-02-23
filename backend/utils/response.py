from rest_framework.response import Response
from rest_framework import status as http_status


def success(data=None, message="success", status=http_status.HTTP_200_OK):
    return Response({"code": status, "message": message, "data": data}, status=status)


def created(data=None, message="created"):
    return success(data, message, http_status.HTTP_201_CREATED)


def error(message="error", status=http_status.HTTP_400_BAD_REQUEST, data=None):
    return Response({"code": status, "message": message, "data": data}, status=status)


def custom_exception_handler(exc, context):
    """统一异常响应格式"""
    from rest_framework.views import exception_handler
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            "code": response.status_code,
            "message": str(exc),
            "data": None,
        }
    return response
