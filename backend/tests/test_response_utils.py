from rest_framework import status
from utils.response import success, created, error


def test_success_response():
    resp = success(data={"a": 1}, message="ok")
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["code"] == 200
    assert resp.data["message"] == "ok"
    assert resp.data["data"] == {"a": 1}


def test_created_response():
    resp = created(data={"id": 1}, message="created")
    assert resp.status_code == status.HTTP_201_CREATED
    assert resp.data["code"] == 201
    assert resp.data["data"] == {"id": 1}


def test_error_response():
    resp = error(message="bad request", status_code=status.HTTP_400_BAD_REQUEST)
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert resp.data["code"] == 400
    assert resp.data["message"] == "bad request"
    assert resp.data["data"] is None