"""One consistent error shape for the whole API:

    {"detail": "Human readable message", "errors": {"field": ["message", ...]}}
"""
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:  # unexpected server error -> generic message, no leaks
        return Response(
            {"detail": "Something went wrong on our side. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, ValidationError):
        errors = response.data
        if isinstance(errors, list):
            errors = {"non_field_errors": errors}
        first = next(iter(errors.values()), ["Invalid input."])
        first = first[0] if isinstance(first, list) and first else first
        response.data = {"detail": str(first), "errors": errors}
    elif isinstance(response.data, dict) and "detail" in response.data:
        response.data = {"detail": str(response.data["detail"])}
    return response
