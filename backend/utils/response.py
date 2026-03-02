from rest_framework.response import Response
from rest_framework import status as http_status


def success(data=None, message="success", status_code=http_status.HTTP_200_OK):
    return Response(
        {"code": status_code, "message": message, "data": data},
        status=status_code
    )


def created(data=None, message="created"):
    return success(data=data, message=message, status_code=http_status.HTTP_201_CREATED)


def error(message="error", status_code=http_status.HTTP_400_BAD_REQUEST, data=None):
    return Response(
        {"code": status_code, "message": message, "data": data},
        status=status_code
    )