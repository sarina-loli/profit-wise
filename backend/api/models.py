import uuid

from django.conf import settings
from django.db import models


class Profile(models.Model):
    """Company details attached to a user account."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    company_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True, default="")
    industry = models.CharField(max_length=100, blank=True, default="")
    location = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name


class Calculation(models.Model):
    """A saved calculation. `inputs` stores the raw form values as JSON."""

    class Type(models.TextChoices):
        PROFIT = "profit", "Profit"
        UNITS = "units", "Units for target profit"
        INPUT_COST = "input_cost", "Input cost for target profit"
        PRICE_PER_UNIT = "price_per_unit", "Price per unit for target profit"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="calculations"
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    inputs = models.JSONField()
    result = models.FloatField()
    profit = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.type} · {self.user_id} · {self.created_at:%Y-%m-%d}"
